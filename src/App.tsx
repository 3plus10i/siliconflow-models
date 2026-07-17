import { useState, useEffect, useMemo, useCallback } from 'react';
import type { Model, FilterState, SortSlot } from '@/types/model';
import { loadModels, subtypeRank, DATA_DATE } from '@/lib/data';
import { applyFilters, EMPTY_FILTERS } from '@/lib/filters';
import { applySort, makeEmptySlots } from '@/lib/sort';
import FilterBar from '@/components/FilterBar';
import SortControls from '@/components/SortControls';
import ModelTable from '@/components/ModelTable';

const FOOTER_LINKS = [
  { label: '主页', href: 'https://siliconflow.cn' },
  { label: '模型', href: 'https://siliconflow.cn/models' },
  { label: '价格', href: 'https://siliconflow.cn/pricing' },
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
      <div className="flex-1 max-w-[1200px] mx-auto px-4 sm:px-6 pt-8">
        {/* Header */}
        <header className="mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">SiliconFlow 硅基流动模型列表</h1>
            <a
              href={import.meta.env.BASE_URL + 'data/siliconflow_models.csv'}
              download
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载 CSV
            </a>
            <a
              href={import.meta.env.BASE_URL + 'data/siliconflow_models.json'}
              download
              className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              下载 JSON
            </a>
          </div>
          <p className="text-sm text-gray-500 mt-1">
            数据更新于 {DATA_DATE} · 共 {allModels.length} 个模型
          </p>
        </header>

        {/* Sort */}
        <div className="mb-4 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <SortControls slots={sortSlots} onChange={setSortSlots} onClear={clearSort} />
        </div>

        {/* Filter Bar */}
        <div className="mb-4">
          <FilterBar models={allModels} filters={filters} onFiltersChange={setFilters} onClear={clearFilters} filteredCount={displayModels.length} />
        </div>

        {/* Table */}
        <ModelTable models={displayModels} sortSlots={sortSlots} />
      </div>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center gap-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            SiliconFlow：
            {FOOTER_LINKS.map((l, i) => (
              <span key={l.href} className="flex items-center gap-1">
                <a href={l.href} target="_blank" rel="noopener" className="hover:text-gray-600 transition-colors">{l.label}</a>
                {i < FOOTER_LINKS.length - 1 && <span>·</span>}
              </span>
            ))}
          </span>
          <span className="flex-1 text-center">本项目非硅基流动官方网站。数据来源于公开信息，仅供参考</span>
          <a
            href="https://github.com/3plus10i/siliconflow-models" target="_blank" rel="noopener"
            className="flex items-center gap-1 hover:text-gray-600 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
            项目主页
          </a>
          <span>View <span id="busuanzi_page_pv"></span></span>
        </div>
      </footer>
    </div>
  );
}
