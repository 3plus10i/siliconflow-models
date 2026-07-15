# -*- coding: utf-8 -*-
"""
SiliconFlow 模型爬虫 — 从公开页面抓取模型元数据和价格表，输出 CSV。
用法：python scripts/crawl.py
输出：public/data/models.csv
数据源：
  - 模型元数据 https://siliconflow.cn/models （品牌/名称/类型/尺寸/功能/logo 等）
  - 价格表     https://siliconflow.cn/pricing （pricingApiItems，仅取 online 计费模式）
"""
import csv, json, re, sys, os
from datetime import datetime
from collections import defaultdict

HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                  "(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
MODELS_URL = "https://siliconflow.cn/models"
PRICING_URL = "https://siliconflow.cn/pricing"
OUTPUT = os.path.join(os.path.dirname(__file__), "..", "public", "data", "siliconflow_models_20260303.csv")

# -----------------------------------------------------------------------
# 通用 Next.js JSON 解析
# -----------------------------------------------------------------------
def _decode_next_data(text):
    """从 Next.js __next_f.push 格式中提取 data 节点（自动判断是模型列表还是价格表）。"""
    scripts = re.findall(r'<script[^>]*>(.*?)</script>', text, re.DOTALL)
    for s in scripts:
        if 'modelName' not in s or 'pricing' not in s:
            continue
        m = re.search(r'__next_f\.push\(\[1,"(.*)"\]\)', s, re.DOTALL)
        if not m:
            continue
        try:
            decoded = json.loads('"' + m.group(1) + '"')
            arr, _ = json.JSONDecoder().raw_decode(decoded[decoded.find('['):])
        except Exception:
            continue
        for item in arr:
            if isinstance(item, list):
                for sub in item:
                    if isinstance(sub, dict) and "data" in sub:
                        data = sub["data"]
                        # 模型列表：list of dict with modelName
                        if isinstance(data, list) and data and isinstance(data[0], dict) and "modelName" in data[0]:
                            return data
                        # 价格表：dict with pricingApiItems
                        if isinstance(data, dict) and "pricingApiItems" in data:
                            return data
    return None

# -----------------------------------------------------------------------
# 价格表构建
# -----------------------------------------------------------------------
SCENARIO_PRIORITY = {"刊例价": 0, "活动价": 1, "兜底价": 2}

def parse_tier(object_name, comp):
    m = re.search(r'\.([0-9a-zA-Z\-]+)\.' + re.escape(comp) + r'$', object_name)
    if not m:
        return None, 0
    suffix = m.group(1)
    mm = re.match(r'0-(\w+)-input$', suffix)
    if mm:
        return f"[0,{mm.group(1)})", 0
    mm = re.match(r'over-(\w+)-input$', suffix)
    if mm:
        return f"[{mm.group(1)},inf)", 1
    return None, 0

def fmt_num(v):
    s = f"{v:.6f}".rstrip("0").rstrip(".")
    return s if "." in s else s + ".0"

def to_m_price(price_str, unit):
    try:
        v = float(price_str)
    except (TypeError, ValueError):
        return None, unit
    if unit == "K tokens":
        return v * 1000.0, "M tokens"
    if unit in ("M tokens", "tokens"):
        return v, "M tokens"
    return v, unit

def build_price_map(pricing_data):
    pmap = defaultdict(lambda: defaultdict(dict))
    for it in pricing_data.get("pricingApiItems", []):
        if it.get("payloadBizText") != "online":
            continue
        name = it.get("playgroundName")
        comp = it.get("componentCode")
        if not name or not comp:
            continue
        interval, order = parse_tier(it.get("objectName", ""), comp)
        m_price, disp_unit = to_m_price(it.get("realTimePriceCnyUnit", ""), it.get("unitZhCnName", ""))
        scenario = it.get("price_scenario", "")
        cur = pmap[name][comp].get(order)
        if cur is None or SCENARIO_PRIORITY.get(scenario, 9) < SCENARIO_PRIORITY.get(cur[3], 9):
            pmap[name][comp][order] = (interval, m_price, disp_unit, scenario)
    return pmap

def first_tier(comp_map):
    if not comp_map:
        return ""
    order = min(comp_map.keys())
    _, price, unit, _ = comp_map[order]
    return f"¥{fmt_num(price)} / {unit}" if price is not None else ""

def build_range_pricing(pm):
    parts = []
    for comp, label in (("input-tokens", "输入"), ("output-tokens", "输出")):
        cm = pm.get(comp)
        if not cm or len(cm) < 2:
            continue
        segs = []
        for order in sorted(cm.keys()):
            interval, price, _, _ = cm[order]
            if price is None:
                continue
            segs.append(f"{interval or '全区间'} ¥ {fmt_num(price)}")
        if segs:
            parts.append(label + " " + " / ".join(segs))
    return "，".join(parts)

# -----------------------------------------------------------------------
# 模型元数据处理
# -----------------------------------------------------------------------
TYPE_MAP = {
    "text": "对话", "image": "生图", "embedding": "嵌入",
    "reranker": "重排", "rerank": "重排", "audio": "音频",
    "video": "视频", "multimodal": "多模态", "moderation": "审核",
}

def type_label(m):
    t = m.get("type", "")
    st = m.get("subType", "")
    if st == "chat" and t == "text":
        return "对话"
    return TYPE_MAP.get(t, t) or TYPE_MAP.get(st, st) or ""

def get_cap_flags(m):
    funcs = m.get("_func", []) or []
    funcs_txt = " ".join(funcs)
    has = lambda kw: kw in funcs_txt
    flags = {
        "视觉能力": bool(m.get("vlm")) or has("视觉"),
        "工具调用能力": bool(m.get("functionCallSupport")) or has("工具"),
        "JSON模式能力": bool(m.get("jsonModeSupport")) or has("JSON"),
        "前缀续写": bool(m.get("chatPrefixCompletionSupport")) or has("前缀"),
        "FIM补全能力": bool(m.get("fimCompletionSupport")) or has("FIM"),
    }
    extra = []
    if m.get("supportFT"):
        extra.append("微调")
    st = m.get("subType", "")
    if st == "speech-to-text":
        extra.append("语音识别")
    elif st == "text-to-speech":
        extra.append("语音合成")
    return flags, extra

def fmt_size(val):
    try:
        n = int(val)
    except (TypeError, ValueError):
        return val or ""
    if n >= 1000:
        t = n / 1000
        s = f"{t:.1f}".rstrip("0").rstrip(".")
        return f"{s}T"
    return f"{n}B"

def fmt_ctx(val):
    try:
        n = int(val)
    except (TypeError, ValueError):
        return val or ""
    if n >= 1_000_000:
        m = n / 1_000_000
        if abs(m - round(m)) < 0.1:
            return f"{round(m)}M"
        return f"{m:.1f}M"
    if n >= 1_000:
        return f"{n // 1000}K"
    return str(n)

def fmt_date(val):
    if not val:
        return ""
    if isinstance(val, dict):
        val = val.get("seconds", "")
    try:
        n = int(val)
        if n > 1e12:
            n //= 1000
        return datetime.fromtimestamp(n).strftime("%Y-%m-%d")
    except (TypeError, ValueError):
        return str(val)

# -----------------------------------------------------------------------
# 主流程
# -----------------------------------------------------------------------
def main():
    import requests
    print("抓取 /models ...")
    models = _decode_next_data(requests.get(MODELS_URL, headers=HEADERS, timeout=30).text)
    if not models or not isinstance(models, list):
        print("ERROR: 无法解析 /models 数据")
        sys.exit(1)
    print(f"  {len(models)} 个模型")

    print("抓取 /pricing ...")
    pricing = _decode_next_data(requests.get(PRICING_URL, headers=HEADERS, timeout=30).text)
    if not pricing or not isinstance(pricing, dict):
        print("ERROR: 无法解析 /pricing 数据")
        sys.exit(1)
    pmap = build_price_map(pricing)
    print(f"  {len(pmap)} 个模型价格")

    fields = [
        "logo", "模型品牌", "模型名", "显示名称", "发布时间", "类型", "子类型",
        "输入价格", "输出价格", "缓存输入价格", "区间定价", "其他计费",
        "上下文长度", "尺寸", "视觉能力", "工具调用能力", "JSON模式能力",
        "前缀续写", "FIM补全能力", "其他功能", "描述",
    ]

    rows, unmatched, tiered = [], 0, 0
    for m in models:
        name = m.get("modelName", "")
        pm = pmap.get(name, {})
        inp = first_tier(pm.get("input-tokens"))
        out = first_tier(pm.get("output-tokens"))
        cache = first_tier(pm.get("cached-input-tokens"))
        rp = build_range_pricing(pm)
        if rp:
            tiered += 1
        other = []
        for comp in ("image-cnt", "video-cnt", "utf8-bytes", "task-consumed-tokens", "input-image-tokens"):
            if comp in pm:
                other.append(f"{comp}: {first_tier(pm[comp])}")
        other_p = "; ".join(other)
        if not (inp or out or other_p):
            unmatched += 1
        flags, extra = get_cap_flags(m)
        rows.append({
            "logo": m.get("icon", ""),
            "模型品牌": m.get("mf", ""),
            "模型名": name,
            "显示名称": m.get("DisplayName", ""),
            "发布时间": fmt_date(m.get("publishTime")),
            "类型": type_label(m),
            "子类型": m.get("subType", ""),
            "输入价格": inp,
            "输出价格": out,
            "缓存输入价格": cache,
            "区间定价": rp,
            "其他计费": other_p,
            "上下文长度": fmt_ctx(m.get("contextLen")),
            "尺寸": fmt_size(m.get("size")),
            **flags,
            "其他功能": "、".join(extra),
            "描述": (m.get("desc", "") or "").replace("\n", " ").strip(),
        })

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", newline="", encoding="utf-8-sig") as f:
        w = csv.DictWriter(f, fieldnames=fields)
        w.writeheader()
        w.writerows(rows)

    print(f"  → {OUTPUT}  ({len(rows)} 行, 未匹配价格 {unmatched}, 区间定价 {tiered})")

if __name__ == "__main__":
    main()
