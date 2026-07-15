import { useMemo } from 'react';
import type { Model, FilterState, BrandInfo } from '@/types/model';
import { Input } from '@/components/ui/input';
import { SUBTYPE_LABELS, brandDisplayLabel, brandRank, subtypeRank } from '@/lib/data';
import { X } from 'lucide-react';

interface Props {
  models: Model[];
  filters: FilterState;
  onFiltersChange: (f: FilterState) => void;
  onClear: () => void;
}

function toggleSet(set: Set<string>, val: string): Set<string> {
  const next = new Set(set);
  next.has(val) ? next.delete(val) : next.add(val);
  return next;
}

export default function FilterBar({ models, filters, onFiltersChange, onClear }: Props) {
  const subtypes = useMemo(
    () => [...new Set(models.map(m => m.子类型))].filter(Boolean).sort((a, b) => subtypeRank(a) - subtypeRank(b)),
    [models]
  );

  // 品牌排序：有显示名的在前
  const brands = useMemo((): BrandInfo[] => {
    const seen = new Map<string, string>();
    for (const m of models) {
      if (!seen.has(m.模型品牌)) seen.set(m.模型品牌, m.logo);
    }
    return [...seen.entries()]
      .map(([name, logo]) => ({ name, logo }))
      .sort((a, b) => brandRank(a.name) - brandRank(b.name));
  }, [models]);

  const capKeys = ['视觉能力', '工具调用能力', 'JSON模式能力', '前缀续写', 'FIM补全能力'] as const;
  const capLabels: Record<string, string> = {
    视觉能力: '👁 视觉', 工具调用能力: '🛠 工具', JSON模式能力: '{ } JSON',
    前缀续写: '✍ 前缀', FIM补全能力: '</> FIM',
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
      {/* 清除筛选 — 常驻 */}
      <div className="flex items-center">
        <button onClick={onClear}
          className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center gap-1">
          <X size={12} /> 清除筛选
        </button>
      </div>

      {/* 类型 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 mr-1">类型</span>
        {subtypes.map(v => (
          <button
            key={v}
            onClick={() => onFiltersChange({ ...filters, subtypes: toggleSet(filters.subtypes, v) })}
            className={`text-xs px-2 py-1 rounded-lg border transition ${
              filters.subtypes.has(v)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:border-blue-500'
            }`}
          >
            {SUBTYPE_LABELS[v] || v}
          </button>
        ))}
      </div>

      {/* 品牌 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 mr-1">品牌</span>
        {brands.map(b => (
          <button
            key={b.name}
            onClick={() => onFiltersChange({ ...filters, brands: toggleSet(filters.brands, b.name) })}
            className={`text-xs px-2 py-1 rounded-lg border transition flex items-center gap-1 ${
              filters.brands.has(b.name)
                ? 'bg-blue-600 text-white border-blue-600'
                : 'border-gray-300 text-gray-600 hover:border-blue-500'
            }`}
          >
            {b.logo ? <img src={b.logo} alt="" className="h-4 w-4 rounded object-contain" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : null}
            {brandDisplayLabel(b.name)}
          </button>
        ))}
      </div>

      {/* 能力 */}
      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-xs font-semibold text-gray-500 mr-1">能力</span>
        {capKeys.map(k => (
          <button
            key={k}
            onClick={() => onFiltersChange({ ...filters, capabilities: toggleSet(filters.capabilities, k) })}
            className={`text-xs px-2 py-1 rounded-lg border transition ${
              filters.capabilities.has(k)
                ? 'bg-green-600 text-white border-green-600'
                : 'border-gray-300 text-gray-600 hover:border-green-500'
            }`}
          >
            {capLabels[k]}
          </button>
        ))}
      </div>

      {/* 搜索 */}
      <div className="pt-3 border-t border-gray-100 flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 shrink-0">搜索</span>
        <Input
          value={filters.search}
          onChange={e => onFiltersChange({ ...filters, search: e.target.value })}
          placeholder="模型名 / 品牌 ..."
          className="max-w-xs h-8 text-sm"
        />
      </div>
    </div>
  );
}
