import { FDI_UPPER, FDI_LOWER } from "./form-schema";

interface Props {
  value: number[];
  onChange: (next: number[]) => void;
}

const ToothIcon = ({ selected }: { selected: boolean }) => (
  <svg width="22" height="28" viewBox="0 0 22 28" fill="none" className="mx-auto">
    <path
      d="M5 3 C 7 1, 15 1, 17 3 C 20 6, 19 11, 17 14 L 14 26 C 13 28, 9 28, 8 26 L 5 14 C 3 11, 2 6, 5 3 Z"
      fill={selected ? "hsl(var(--primary) / 0.25)" : "white"}
      stroke={selected ? "hsl(var(--primary))" : "#aaa"}
      strokeWidth="1"
    />
  </svg>
);

export default function DentalChartFDI({ value, onChange }: Props) {
  const toggle = (n: number) => {
    onChange(value.includes(n) ? value.filter((v) => v !== n) : [...value, n].sort((a, b) => a - b));
  };

  const renderRow = (teeth: number[]) => (
    <div className="grid grid-cols-16 gap-0.5">
      {teeth.map((n) => (
        <div key={n} className="flex flex-col items-center">
          <ToothIcon selected={value.includes(n)} />
          <button
            type="button"
            onClick={() => toggle(n)}
            className={`mt-0.5 text-[10px] font-mono px-1 py-0.5 rounded border transition-colors ${
              value.includes(n)
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background border-border hover:border-primary/50"
            }`}
          >
            {n}
          </button>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-4 p-3 border border-border rounded-md bg-muted/20" style={{ ['--tw-grid-cols-16' as any]: 'repeat(16, minmax(0, 1fr))' }}>
      <div>
        <p className="font-body text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">Arcata Superiore</p>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
          {FDI_UPPER.map((n) => (
            <div key={n} className="flex flex-col items-center">
              <ToothIcon selected={value.includes(n)} />
              <button
                type="button"
                onClick={() => toggle(n)}
                className={`mt-0.5 text-[10px] font-mono px-1 py-0.5 rounded border w-full transition-colors ${
                  value.includes(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {n}
              </button>
            </div>
          ))}
        </div>
      </div>
      <div>
        <p className="font-body text-[11px] text-muted-foreground mb-1 uppercase tracking-wider">Arcata Inferiore</p>
        <div className="grid gap-0.5" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
          {FDI_LOWER.map((n) => (
            <div key={n} className="flex flex-col items-center">
              <button
                type="button"
                onClick={() => toggle(n)}
                className={`mb-0.5 text-[10px] font-mono px-1 py-0.5 rounded border w-full transition-colors ${
                  value.includes(n)
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-border hover:border-primary/50"
                }`}
              >
                {n}
              </button>
              <div style={{ transform: "rotate(180deg)" }}>
                <ToothIcon selected={value.includes(n)} />
              </div>
            </div>
          ))}
        </div>
      </div>
      {value.length > 0 && (
        <p className="text-xs text-muted-foreground">
          Selezionati: <span className="font-mono">{value.join(", ")}</span>
        </p>
      )}
    </div>
  );
}
