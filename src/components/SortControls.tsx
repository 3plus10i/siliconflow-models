import { useState } from 'react';
import type { SortSlot } from '@/types/model';
import { SORT_OPTIONS } from '@/lib/sort';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus } from 'lucide-react';

interface Props {
  slots: SortSlot[];
  onChange: (slots: SortSlot[]) => void;
  onClear: () => void;
}

function uniqueSlots(slots: SortSlot[]): SortSlot[] {
  const seen = new Set<string>();
  return slots.map(s => {
    if (!s.field) return s;
    if (seen.has(s.field)) return { field: null, dir: 'desc' };
    seen.add(s.field);
    return s;
  });
}

export default function SortControls({ slots, onChange, onClear }: Props) {
  const [visibleCount, setVisibleCount] = useState(1);

  const handleField = (i: number, field: string) => {
    const next = [...slots];
    next[i] = { ...next[i], field: field === '_none' ? null : field as SortSlot['field'] };
    onChange(uniqueSlots(next));
  };
  const toggleDir = (i: number) => {
    const next = [...slots];
    next[i] = { ...next[i], dir: next[i].dir === 'asc' ? 'desc' : 'asc' };
    onChange(next);
  };

  const handleAdd = () => {
    if (visibleCount < 3) setVisibleCount(prev => prev + 1);
  };

  const handleClear = () => {
    setVisibleCount(1);
    onClear();
  };

  const active = slots.slice(0, visibleCount).some(s => s.field);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs font-semibold text-gray-500 shrink-0">排序</span>
      {slots.slice(0, visibleCount).map((s, i) => (
        <div key={i} className="flex items-center gap-1">
          <Select value={s.field || '_none'} onValueChange={v => handleField(i, v)}>
            <SelectTrigger className="h-8 w-[140px] text-xs">
              <SelectValue placeholder={i === 0 ? '主排序' : i === 1 ? '次排序' : '第三排序'} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="_none">—</SelectItem>
              {SORT_OPTIONS.map(o => (
                <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={() => toggleDir(i)}
            className="h-8 px-1.5 text-xs rounded-sm border border-input bg-transparent hover:bg-accent hover:text-accent-foreground"
            style={{ minWidth: 44 }}
          >
            {s.dir === 'asc' ? '升序↑' : '降序↓'}
          </button>
        </div>
      ))}
      {visibleCount < 3 && (
        <button
          onClick={handleAdd}
          className="h-6 w-6 flex items-center justify-center rounded-full border-2 border-dashed border-input bg-transparent text-gray-400 hover:text-gray-600 hover:bg-accent"
          title="增加排序依据"
        >
          <Plus size={14} />
        </button>
      )}
      <button
        onClick={handleClear}
        className={`text-xs ml-4 px-3 py-1 rounded-sm border flex items-center gap-1 transition ${
          active ? 'border-purple-400 text-purple-500 hover:bg-purple-50' : 'border-gray-300 text-gray-500 hover:bg-gray-100'
        }`}
      >
        <X size={12} /> 清除排序
      </button>
    </div>
  );
}
