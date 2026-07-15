import type { Model, SortSlot, SortField } from '@/types/model';
import { getSortValue } from './data';

/** 多级稳定排序 */
export function applySort(models: Model[], slots: SortSlot[]): Model[] {
  const active = slots.filter(s => s.field);
  if (active.length === 0) return models;

  return [...models].sort((a, b) => {
    for (const slot of active) {
      const va = getSortValue(a, slot.field!);
      const vb = getSortValue(b, slot.field!);
      const m = slot.dir === 'asc' ? 1 : -1;
      if (typeof va === 'number' && typeof vb === 'number') {
        if (va !== vb) return (va - vb) * m;
      } else {
        const cmp = String(va).localeCompare(String(vb), 'zh');
        if (cmp !== 0) return cmp * m;
      }
    }
    return 0;
  });
}

export const SORT_OPTIONS: { value: SortField; label: string }[] = [
  { value: '价格', label: '价格（输出）' },
  { value: '尺寸', label: '参数量' },
  { value: '上下文长度', label: '上下文长度' },
  { value: '发布时间', label: '发布日期' },
  { value: '模型名', label: '模型名' },
];

export function makeEmptySlots(): SortSlot[] {
  return [
    { field: null, dir: 'desc' },
    { field: null, dir: 'desc' },
    { field: null, dir: 'desc' },
  ];
}
