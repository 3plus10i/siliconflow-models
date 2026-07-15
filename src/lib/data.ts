import type { ModelRow, Model, SortField } from '@/types/model';

const CSV_URL = '/data/siliconflow_models.csv';
const META_URL = '/data/metadata.json';
const CACHE_KEY = 'sf_models_cache';
const CACHE_TS_KEY = 'sf_models_ts';
const CACHE_DATE_KEY = 'sf_models_date';
const CACHE_TTL = 3600_000;

/** 数据更新日期，在 loadModels() 中赋值 */
export let DATA_DATE = '';

/** 子类型 → 中文标签 */
export const SUBTYPE_LABELS: Record<string, string> = {
  chat: '对话',
  embedding: '嵌入',
  reranker: '重排',
  'speech-to-text': '转文字',
  'text-to-speech': '转语音',
  'text-to-image': '文生图',
  'text-to-video': '文生视频',
  'image-to-video': '图生视频',
};

/** 子类型显示顺序（表格默认排、筛选 tag 排） */
export const SUBTYPE_ORDER = [
  'chat', 'text-to-image', 'embedding', 'reranker',
  'speech-to-text', 'text-to-speech', 'text-to-video', 'image-to-video',
];

export function subtypeRank(st: string): number {
  const i = SUBTYPE_ORDER.indexOf(st);
  return i >= 0 ? i : 99;
}

/** 品牌 → 显示名（按优先级排序） */
export const BRAND_ORDER: { name: string; label: string }[] = [
  { name: 'deepseek-ai', label: 'DeepSeek' },
  { name: 'Qwen', label: 'Qwen' },
  { name: 'moonshotai', label: 'Kimi' },
  { name: 'zai', label: '智谱' },
  { name: 'MiniMaxAI', label: 'MiniMax' },
  { name: 'meituan-longcat', label: '美团龙猫' },
  { name: 'nex-agi', label: 'Nex' },
  { name: 'stepfun-ai', label: '阶跃星辰' },
  { name: 'Tongyi-MAI', label: 'Tongyi-MAI' },
  { name: 'Wan', label: 'Wan' },
  { name: 'inclusionAI', label: '蚂蚁百灵' },
  { name: 'hunyuan', label: '腾讯混元' },
  { name: 'ByteDance', label: '字节跳动' },
  { name: 'baidu', label: '百度' },
  { name: 'Kolors', label: '可图' },
  { name: 'DianXin', label: '电信' },
  { name: 'BAAI', label: '智源研究院' },
  { name: 'FunAudioLLM', label: 'FunAudioLLM' },
  { name: 'openmoss', label: 'openmoss' },
];

const BRAND_LABEL_MAP: Record<string, string> = Object.fromEntries(
  BRAND_ORDER.map(b => [b.name, b.label])
);
const BRAND_RANK: Record<string, number> = Object.fromEntries(
  BRAND_ORDER.map((b, i) => [b.name, i])
);

export function brandDisplayLabel(name: string): string {
  return BRAND_LABEL_MAP[name] || name;
}

export function brandRank(name: string): number {
  return BRAND_RANK[name] ?? 999;
}

/** 去除 ¥ 和单位后的纯数值文本 + 单位 */
function stripPrice(raw: string): { val: string; unit: string } {
  const s = raw.trim();
  if (!s) return { val: '', unit: '' };
  const m = s.match(/¥([\d.]+)\s*\/\s*(.+)/);
  if (m) return { val: m[1], unit: m[2] };
  // 其他计费格式: "image-cnt: ¥0.3 / 图片"
  const m2 = s.match(/:\s*¥([\d.]+)\s*\/\s*(.+)/);
  if (m2) return { val: m2[1], unit: m2[2] };
  return { val: s.replace('¥', ''), unit: '' };
}

/** 价格数值始终保留两位小数 */
function fmtVal(raw: string): string {
  const n = parseFloat(raw);
  return isNaN(n) ? raw : n.toFixed(2);
}

/** 单位简写 */
function shortUnit(unit: string): string {
  if (unit === 'M tokens') return 'Mt';
  return unit;
}

function simpleCSV(text: string): ModelRow[] {
  const lines = text.trim().split('\n');
  if (lines.length < 2) return [];
  const headers = lines[0].split(',').map(h => h.trim());
  return lines.slice(1).map(line => {
    const row: Record<string, string> = {};
    let i = 0, col = 0, cur = '';
    while (i < line.length) {
      if (line[i] === '"') {
        const end = line.indexOf('"', i + 1);
        cur = line.slice(i + 1, end);
        i = end + 1;
      } else if (line[i] === ',') {
        if (col < headers.length) row[headers[col]] = cur;
        col++; cur = ''; i++;
      } else { cur += line[i]; i++; }
    }
    if (col < headers.length) row[headers[col]] = cur;
    return row as unknown as ModelRow;
  });
}

function compute(row: ModelRow): Model {
  const inRaw = (row.输入价格 || '').trim();
  const outRaw = (row.输出价格 || '').trim();
  const otherRaw = (row.其他计费 || '').trim();
  const inP = stripPrice(inRaw);
  const outP = stripPrice(outRaw);

  // ── 价格显示：两个 5ch 右对齐数值 slot + 单位（Mt）；若有缓存价则追加第二行 ──
  let priceHtml = '';
  const unit = inP.unit || outP.unit || '';
  const displayUnit = shortUnit(unit);
  if (inP.val && outP.val) {
    priceHtml = `<span class="inline-block text-right" style="width:5ch">${fmtVal(inP.val)}</span> / <span class="inline-block text-right" style="width:5ch">${fmtVal(outP.val)}</span><span class="text-[10px] text-gray-400 ml-1">${displayUnit}</span>`;
  } else if (otherRaw && !inP.val) {
    const first = otherRaw.split(';')[0].replace(/^[a-z\-]+:\s*/, '');
    const fp = stripPrice(first);
    priceHtml = `${fmtVal(fp.val)}<span class="text-[10px] text-gray-400 ml-0.5">/${fp.unit}</span>`;
  } else if (inP.val) {
    priceHtml = `${fmtVal(inP.val)}<span class="text-[10px] text-gray-400 ml-0.5">(${inP.unit})</span>`;
  } else {
    priceHtml = '-';
  }

  // 缓存命中输入价格第二行
  const cachedRaw = (row.缓存输入价格 || '').trim();
  if (cachedRaw) {
    const cp = stripPrice(cachedRaw);
    if (cp.val) {
      priceHtml += `<br/><span class="text-[11px] text-gray-400">缓存命中输入 ${fmtVal(cp.val)} / ${displayUnit}</span>`;
    }
  }

  // ── 排序用价格数值（chat取out，生图/视频/音频取相应值）──
  let sortPrice = 0;
  if (outP.val) {
    sortPrice = parseFloat(outP.val) || 0;
  } else if (otherRaw) {
    const m = otherRaw.match(/¥([\d.]+)/);
    sortPrice = m ? parseFloat(m[1]) : 0;
  } else if (inP.val) {
    sortPrice = parseFloat(inP.val) || 0;
  }

  // ── 参数量排序 ──
  const sz = (row.尺寸 || '').trim().toUpperCase();
  let sortSize = 0;
  if (sz.endsWith('T')) sortSize = parseFloat(sz) * 1000;
  else if (sz.endsWith('B')) sortSize = parseFloat(sz);
  else sortSize = parseInt(sz) || 0;

  // ── 上下文排序 ──
  const cl = (row.上下文长度 || '').trim();
  let sortCtx = 0;
  if (cl.endsWith('M')) sortCtx = parseFloat(cl) * 1000;
  else if (cl.endsWith('K')) sortCtx = parseFloat(cl);
  else sortCtx = parseInt(cl) || 0;

  // ── 品牌 logo map ──
  return {
    ...row,
    _priceHtml: priceHtml,
    _sortPrice: sortPrice,
    _sortSize: sortSize,
    _sortCtx: sortCtx,
  };
}

export async function loadModels(): Promise<Model[]> {
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTs = localStorage.getItem(CACHE_TS_KEY);
  const cachedDate = localStorage.getItem(CACHE_DATE_KEY);
  if (cached && cachedTs && cachedDate && Date.now() - parseInt(cachedTs) < CACHE_TTL) {
    DATA_DATE = cachedDate;
    return JSON.parse(cached).map(compute);
  }
  const [csvResp, metaResp] = await Promise.all([
    fetch(CSV_URL),
    fetch(META_URL),
  ]);
  const text = await csvResp.text();
  try {
    const meta = await metaResp.json();
    DATA_DATE = meta.date || '';
  } catch {
    DATA_DATE = '';
  }
  const rows = simpleCSV(text).map(compute);
  localStorage.setItem(CACHE_KEY, JSON.stringify(rows));
  localStorage.setItem(CACHE_TS_KEY, String(Date.now()));
  localStorage.setItem(CACHE_DATE_KEY, DATA_DATE);
  return rows;
}

export function getSortValue(row: Model, field: SortField): number | string {
  switch (field) {
    case '价格': return row._sortPrice;
    case '尺寸': return row._sortSize;
    case '上下文长度': return row._sortCtx;
    case '发布时间': return row.发布时间 || '';
    case '模型名': return row.模型名 || '';
  }
}
