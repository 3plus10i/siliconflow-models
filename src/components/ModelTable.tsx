import { Fragment, useState, useCallback } from 'react';
import type { Model, SortSlot } from '@/types/model';
import { SUBTYPE_LABELS, brandDisplayLabel } from '@/lib/data';

const COLUMNS = [
  { key: '模型名',      width: 280, sticky: true },
  { key: '参数量',      width: 60,  align: 'right' as const },
  { key: '上下文长度',  width: 60,  align: 'right' as const },
  { key: '价格',        width: 150 },
  { key: '类型',        width: 80 },
  { key: '视觉能力',    width: 52 },
  { key: '工具调用能力',width: 52 },
  { key: 'JSON模式能力',width: 52 },
  { key: '前缀续写',    width: 52 },
  { key: 'FIM补全能力', width: 52 },
];
const CAP_KEYS = ['视觉能力', '工具调用能力', 'JSON模式能力', '前缀续写', 'FIM补全能力'] as const;

interface Props { models: Model[]; sortSlots: SortSlot[]; }

export default function ModelTable({ models, sortSlots }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const handleCopy = useCallback((name: string) => {
    navigator.clipboard.writeText(name);
    setCopied(name);
    setTimeout(() => setCopied(null), 3000);
  }, []);
  const tags = sortSlots
    .map((s, i) => (s.field ? { field: s.field, dir: s.dir, idx: i } : null))
    .filter(Boolean) as { field: string; dir: string; idx: number }[];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto" style={{ maxHeight: '75vh' }}>
        <table className="w-full text-sm border-collapse table-fixed">
          <thead className="sticky top-0 z-10">
            <tr>
              {COLUMNS.map(col => {
                const tag = tags.find(t => t.field === col.key);
                return (
                  <th
                    key={col.key}
                    className={`px-2 py-2.5 text-xs font-semibold text-gray-600 bg-gray-50 border-r border-gray-200 last:border-r-0 ${
                      col.sticky ? 'sticky left-0 z-20' : ''
                    }`}
                    style={{ width: col.width }}
                  >
                    {col.key === '价格' ? (
                      <>价格<span className="text-[10px] font-normal text-gray-400">（输入/输出）</span></>
                    ) : col.key}
                    {tag && (
                      <span className={`ml-0.5 text-[10px] ${
                        tag.idx === 0 ? 'text-blue-600' : tag.idx === 1 ? 'text-indigo-500' : 'text-violet-400'
                      }`}>
                        {tag.dir === 'asc' ? ` ↑${tag.idx + 1}` : ` ↓${tag.idx + 1}`}
                      </span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {models.length === 0 ? (
              <tr><td colSpan={COLUMNS.length} className="px-8 py-16 text-center text-gray-400">
                <div className="text-base mb-1">没有匹配的模型</div>请调整筛选条件
              </td></tr>
            ) : (
              models.map((row, idx) => (
                <Fragment key={row.模型名}>
                  <ModelRow
                    row={row} idx={idx}
                    isExpanded={expanded === idx}
                    onToggle={() => setExpanded(expanded === idx ? null : idx)}
                    copied={copied === row.模型名}
                    onCopy={() => handleCopy(row.模型名)}
                  />
                  {expanded === idx && <DetailRow row={row} colSpan={COLUMNS.length} />}
                </Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ModelRow({ row, idx, isExpanded, onToggle, copied, onCopy }: {
  row: Model; idx: number; isExpanded: boolean; onToggle: () => void; copied: boolean; onCopy: () => void;
}) {
  const bg = idx % 2 === 0 ? '#fff' : '#f9fafb';
  return (
    <tr className="hover:bg-blue-50/30 transition-colors border-b border-gray-100" style={{ background: bg }}>
      {/* 模型名 */}
      <td
        className="sticky left-0 px-3 py-2.5 font-medium text-gray-900 border-r border-gray-200 cursor-pointer"
        style={{ width: 260, background: bg }}
        onClick={onToggle}
        title={row.模型名}
      >
        <div className="flex items-center">
          {row.logo ? <img src={row.logo} alt="" className="inline-block h-5 w-5 rounded object-contain mr-1.5 align-middle bg-gray-100 shrink-0" loading="lazy" onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : null}
          <span className="truncate align-middle hover:underline underline-offset-2">{row.模型名}</span>
          {copied ? (
            <span className="text-[10px] text-green-500 align-middle ml-2 shrink-0">已复制</span>
          ) : (
            <button
              onClick={e => { e.stopPropagation(); onCopy(); }}
              className="inline-flex items-center ml-2 p-0.5 text-gray-300 hover:text-gray-500 align-middle shrink-0"
              title="复制模型名"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            </button>
          )}
        </div>
        {row.发布时间 && (
          <div className="text-[11px] text-gray-400 mt-0.5 font-normal">发布于 {row.发布时间}</div>
        )}
      </td>

      {/* 参数量 */}
      <td className="px-2 py-2.5 text-right font-mono text-base border-r border-gray-200 pr-3 tabular-nums">
        {row.尺寸 || '-'}
      </td>

      {/* 上下文长度 */}
      <td className="px-2 py-2.5 text-right font-mono text-base border-r border-gray-200 pr-3 tabular-nums">
        {row.上下文长度 || '-'}
      </td>

      {/* 价格 */}
      <td className="px-2 py-2.5 text-right border-r border-gray-200 pr-3" style={{ overflow:'hidden', textOverflow:'ellipsis' }}>
        <span className="font-mono text-base tabular-nums" dangerouslySetInnerHTML={{ __html: row._priceHtml }} />
      </td>

      {/* 类型 */}
      <td className="px-2 py-2.5 text-center border-r border-gray-200">
        <span className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 text-sm">
          {SUBTYPE_LABELS[row.子类型] || row.子类型 || '-'}
        </span>
      </td>

      {CAP_KEYS.map(ck => {
        const v = (row as unknown as Record<string, string>)[ck] === 'True';
        return (
          <td key={ck} className="px-0 py-2.5 text-center border-r border-gray-200">
            {v
              ? <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-green-100 text-green-700 text-xs font-bold">✓</span>
              : <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-gray-100 text-gray-300 text-xs">-</span>}
          </td>
        );
      })}
    </tr>
  );
}

function DetailRow({ row, colSpan }: { row: Model; colSpan: number }) {
  const modelUrl = `https://cloud.siliconflow.cn/me/models?target=${encodeURIComponent(row.模型名)}`;
  return (
    <tr className="bg-blue-50/30">
      <td className="sticky left-0" style={{ background: '#eff6ff' }} />
      <td colSpan={colSpan - 1} className="px-4 py-3 text-sm text-gray-600 leading-relaxed space-y-1.5">
        <p><span className="font-semibold text-gray-700">描述：</span>{row.描述 || '暂无描述'}</p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-gray-500 pt-1 border-t border-blue-100">
          <span>品牌：{brandDisplayLabel(row.模型品牌)} ({row.模型品牌})</span>
          {row.显示名称 && <span>显示名：{row.显示名称}</span>}
          {row.发布时间 && <span>发布：{row.发布时间}</span>}
          {row.其他功能 && <span>功能：{row.其他功能}</span>}
          {row.区间定价 && <span className="text-amber-600">区间：{row.区间定价}</span>}
        </div>
        <a href={modelUrl} target="_blank" rel="noopener noreferrer"
           className="inline-flex items-center gap-1 text-xs whitespace-nowrap px-2 py-0.5 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 transition">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
          模型广场
        </a>
      </td>
    </tr>
  );
}
