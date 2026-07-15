# 开发备忘

## 双平台部署 — base 路径机制

项目同时部署到 **EdgeOne Pages（自定义域名）** 和 **GitHub Pages（无自定义域名）**，需要不同的 base 路径：

| 平台 | base | 数据路径 | 控制方式 |
|------|------|---------|---------|
| EdgeOne Pages | `/` | `/data/siliconflow_models.csv` | 不设 `BASE_URL` 环境变量 |
| GitHub Pages | `/siliconflow-models/` | `/siliconflow-models/data/siliconflow_models.csv` | 构建时设 `BASE_URL=/siliconflow-models/` |

### 关键点

- `vite.config.ts` 中 `base` 由 `process.env.BASE_URL` 控制，未设置时回退为 `/`
- `src/lib/data.ts` 中 CSV/META URL 用 `import.meta.env.BASE_URL` 拼接，这是 Vite 构建时常量
- GitHub Pages 部署通过 `.github/workflows/deploy-pages.yml`，构建时注入 `BASE_URL=/siliconflow-models/`
- EdgeOne Pages 构建流程不设此变量，走默认 `/`，不影响自定义域名
- GitHub Pages 部署后需在仓库 `Settings → Pages` 中确认 Source 为 **"GitHub Actions"**
