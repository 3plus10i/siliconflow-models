import type { Model, FilterState } from '@/types/model';

export const EMPTY_FILTERS: FilterState = {
  subtypes: new Set(),
  capabilities: new Set(),
  brands: new Set(),
  search: '',
};

export function applyFilters(models: Model[], f: FilterState): Model[] {
  return models.filter(row => {
    if (f.search) {
      const q = f.search.toLowerCase();
      if (!`${row.模型名} ${row.模型品牌} ${row.显示名称}`.toLowerCase().includes(q)) return false;
    }
    if (f.subtypes.size > 0 && !f.subtypes.has(row.子类型)) return false;
    if (f.brands.size > 0 && !f.brands.has(row.模型品牌)) return false;
    for (const cap of f.capabilities) {
      if ((row as unknown as Record<string, string>)[cap] !== 'True') return false;
    }
    return true;
  });
}

export function activeFilterCount(f: FilterState): number {
  return f.subtypes.size + f.capabilities.size + f.brands.size + (f.search ? 1 : 0);
}
