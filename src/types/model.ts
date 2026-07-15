/** 模型原始数据（来自 CSV 列） */
export interface ModelRow {
  logo: string;
  模型品牌: string;
  模型名: string;
  显示名称: string;
  发布时间: string;
  类型: string;
  子类型: string;
  输入价格: string;
  输出价格: string;
  缓存输入价格: string;
  区间定价: string;
  其他计费: string;
  上下文长度: string;
  尺寸: string;
  视觉能力: string;
  工具调用能力: string;
  JSON模式能力: string;
  前缀续写: string;
  FIM补全能力: string;
  其他功能: string;
  描述: string;
}

/** 渲染用的模型数据（加入 computed 字段） */
export interface Model extends ModelRow {
  _priceHtml: string;    // 价格 HTML（值正常字号 + 单位 span）
  _sortPrice: number;    // 排序用价格数值
  _sortSize: number;     // 排序用参数量数值
  _sortCtx: number;      // 排序用上下文数值
}

/** 子类型 → label */
export type SubtypeKey = 'chat' | 'embedding' | 'reranker' | 'speech-to-text' | 'text-to-speech' | 'text-to-image' | 'text-to-video' | 'image-to-video';

/** 排序字段 */
export type SortField = '价格' | '尺寸' | '上下文长度' | '发布时间' | '模型名';

/** 排序槽位 */
export interface SortSlot {
  field: SortField | null;
  dir: 'asc' | 'desc';
}

/** 筛选状态：类型合并为 subtypes */
export interface FilterState {
  subtypes: Set<string>;     // 子类型多选
  capabilities: Set<string>;
  brands: Set<string>;      // 品牌多选（按品牌名）
  search: string;
}

/** 品牌信息（logo + 名称） */
export interface BrandInfo {
  name: string;
  logo: string;
}
