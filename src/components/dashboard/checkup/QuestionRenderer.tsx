import { Question } from "./checkupSchema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

interface Props {
  q: Question;
  value: any;
  onChange: (v: any) => void;
}

export default function QuestionRenderer({ q, value, onChange }: Props) {
  if (q.type === "select") {
    return (
      <select value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full px-3 py-2 rounded-md border border-input bg-background font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring">
        <option value="">— seleziona —</option>
        {q.options!.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    );
  }
  if (q.type === "multi") {
    const arr: string[] = Array.isArray(value) ? value : [];
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {q.options!.map((o) => {
          const checked = arr.includes(o);
          return (
            <label key={o} className="flex items-center gap-2 px-3 py-2 rounded-md border border-input bg-background cursor-pointer hover:bg-muted/50 transition-colors">
              <Checkbox checked={checked} onCheckedChange={(c) => {
                if (c) onChange([...arr, o]);
                else onChange(arr.filter((x) => x !== o));
              }} />
              <span className="font-body text-sm">{o}</span>
            </label>
          );
        })}
      </div>
    );
  }
  if (q.type === "number") {
    return <Input type="number" min={0} max={10} step={1} value={value ?? ""} onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))} />;
  }
  if (q.type === "longtext") {
    return <Textarea rows={3} value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
  return <Input value={value ?? ""} onChange={(e) => onChange(e.target.value)} />;
}
