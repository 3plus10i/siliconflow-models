import type { SortSlot } from '@/types/model';
import { SORT_OPTIONS, makeEmptySlots } from '@/lib/sort';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';

interface Props {
  slots: SortSlot[];
  onChange: (slots: SortSlot[]) => void;
  onClear: () => void;
}

const DIR_OPTIONS = [
  { value: 'desc' as const, label: '降序' },
  { value: 'asc' as const, label: '升序' },
];

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
  const handleField = (i: number, field: string) => {
    const next = [...slots];
    next[i] = { ...next[i], field: field === '_none' ? null : field as SortSlot['field'] };
    onChange(uniqueSlots(next));
  };
  const handleDir = (i: number, dir: string) => {
    const next = [...slots];
    next[i] = { ...next[i], dir: dir as 'asc' | 'desc' };
    onChange(next);
  };

  return (
    <div className="space-y-1.5">
        <button
          onClick={onClear}
          className="text-xs px-3 py-1 rounded-lg border border-gray-300 text-gray-500 hover:bg-gray-100 flex items-center gap-1"
        >
          <X size={12} /> 清除排序
        </button>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold text-gray-500">排序</span>
        {slots.map((s, i) => (
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
            <Select value={s.dir} onValueChange={v => handleDir(i, v)}>
              <SelectTrigger className="h-8 w-[70px] text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIR_OPTIONS.map(d => (
                  <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  );
}
