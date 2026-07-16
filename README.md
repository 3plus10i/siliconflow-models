# SiliconFlow Models

展示硅基流动 [SiliconFlow](https://siliconflow.cn) 平台上所有可用 AI 模型的目录页面，支持按类型、品牌、能力筛选，以及多字段自定义排序。

## 数据源

模型数据通过 `scripts/crawl.py` 从 SiliconFlow 公开页面抓取，输出为 `public/data/models.csv`。运行 `python scripts/crawl.py` 即可更新。

## 相关链接

- [SiliconFlow 主页](https://siliconflow.cn)
- [模型中心](https://siliconflow.cn/models)
- [价格页](https://siliconflow.cn/pricing)

## 项目主页

[https://github.com/3plus10i/siliconflow-models](https://github.com/3plus10i/siliconflow-models)

## 本地运行

```bash
npm install
npm run dev
```

## 免责声明

本项目非硅基流动官方网站，数据来源于公开信息，仅供参考。

## 技术栈

React 19 + TypeScript + Vite + Tailwind CSS + shadcn/ui
