import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Model, FilterState, SortSlot } from '@/types/model';
import { loadModels, subtypeRank, DATA_DATE } from '@/lib/data';
import { applyFilters, EMPTY_FILTERS } from '@/lib/filters';
import { applySort, makeEmptySlots } from '@/lib/sort';
import FilterBar from '@/components/FilterBar';
import SortControls from '@/components/SortControls';
import ModelTable from '@/components/ModelTable';

const FOOTER_LINKS = [
  { label: 'SiliconFlow 主页', href: 'https://siliconflow.cn' },
  { label: '模型中心', href: 'https://siliconflow.cn/models' },
  { label: '价格页', href: 'https://siliconflow.cn/pricing' },
  { label: 'API 文档', href: 'https://docs.siliconflow.cn' },
];

export default function App() {
  const [allModels, setAllModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<FilterState>(EMPTY_FILTERS);
  const [sortSlots, setSortSlots] = useState<SortSlot[]>(makeEmptySlots);

  useEffect(() => {
    loadModels()
      .then(m => { setAllModels(m); setLoading(false); })
      .catch(e => { setError(e.message); setLoading(false); });
  }, []);

  const displayModels = useMemo(() => {
    let m = applyFilters(allModels, filters);
    // 基础排序：按子类型顺序
    m = [...m].sort((a, b) => subtypeRank(a.子类型) - subtypeRank(b.子类型));
    m = applySort(m, sortSlots);
    return m;
  }, [allModels, filters, sortSlots]);

  const clearFilters = useCallback(() => setFilters(EMPTY_FILTERS), []);
  const clearSort = useCallback(() => setSortSlots(makeEmptySlots()), []);

  if (loading) return <div className="flex items-center justify-center min-h-screen text-gray-400">加载中...</div>;
  if (error) return <div className="flex items-center justify-center min-h-screen text-red-500">加载失败：{error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 py-8">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">SiliconFlow 模型列表 - 参数|上下文|价格|能力</h1>
            <a
              href="/data/siliconflow_models.csv"
              download
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载 CSV
            </a>
            <a
              href="/data/siliconflow_models.json"
              download
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载 JSON
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            数据更新于 {DATA_DATE} · {allModels.length} 个模型 · 显示 {displayModels.length} 个
          </p>
        </header>

        {/* Sort */}
        <div className="mb-4">
          <SortControls slots={sortSlots} onChange={setSortSlots} onClear={clearSort} />
        </div>

        {/* Filter Bar */}
        <div className="mb-4">
          <FilterBar models={allModels} filters={filters} onFiltersChange={setFilters} onClear={clearFilters} />
        </div>

        {/* Table */}
        <ModelTable models={displayModels} sortSlots={sortSlots} />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400">
          <span>本项目非硅基流动官方，数据来源于公开信息，仅供参考</span>
          <div className="flex items-center gap-4">
            {FOOTER_LINKS.map(l => (
              <a key={l.href} href={l.href} target="_blank" rel="noopener" className="hover:text-gray-600 transition-colors">
                {l.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
