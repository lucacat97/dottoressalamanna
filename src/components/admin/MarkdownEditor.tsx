import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered,
  Link as LinkIcon, Quote, Eye, Pencil, Palette,
} from "lucide-react";

interface Props {
  value: string;
  onChange: (v: string) => void;
  rows?: number;
  placeholder?: string;
}

const COLORS: { label: string; value: string; cls: string }[] = [
  { label: "Petrolio", value: "hsl(178 55% 18%)", cls: "bg-petrolio" },
  { label: "Oro", value: "hsl(38 60% 55%)", cls: "bg-gold-warm" },
  { label: "Accento", value: "hsl(172 40% 26%)", cls: "bg-accent" },
  { label: "Rosso", value: "#c0392b", cls: "bg-[#c0392b]" },
  { label: "Verde", value: "#27ae60", cls: "bg-[#27ae60]" },
  { label: "Blu", value: "#2980b9", cls: "bg-[#2980b9]" },
];

const inputCls =
  "w-full px-4 py-2.5 rounded-md border border-input bg-background font-body text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-y";

const MarkdownEditor = ({ value, onChange, rows = 6, placeholder }: Props) => {
  const taRef = useRef<HTMLTextAreaElement>(null);
  const [tab, setTab] = useState<"edit" | "preview">("edit");
  const [showColors, setShowColors] = useState(false);

  const wrap = (before: string, after: string = before, sample = "testo") => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = value.slice(start, end) || sample;
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  };

  const linePrefix = (prefix: string) => {
    const ta = taRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const lineStart = value.lastIndexOf("\n", start - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + prefix.length, start + prefix.length);
    });
  };

  const insertLink = () => {
    const url = window.prompt("URL del link:");
    if (!url) return;
    wrap("[", `](${url})`, "testo del link");
  };

  const applyColor = (color: string) => {
    wrap(`<span style="color:${color}">`, "</span>", "testo colorato");
    setShowColors(false);
  };

  const Btn = ({ onClick, title, children }: { onClick: () => void; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className="p-1.5 rounded hover:bg-muted text-foreground"
    >
      {children}
    </button>
  );

  return (
    <div className="border border-input rounded-md overflow-hidden bg-background">
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 flex-wrap px-2 py-1.5 border-b border-border bg-muted/40">
        <Btn onClick={() => wrap("**")} title="Grassetto"><Bold size={14} /></Btn>
        <Btn onClick={() => wrap("*")} title="Corsivo"><Italic size={14} /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => linePrefix("## ")} title="Titolo H2"><Heading2 size={14} /></Btn>
        <Btn onClick={() => linePrefix("### ")} title="Titolo H3"><Heading3 size={14} /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <Btn onClick={() => linePrefix("- ")} title="Lista puntata"><List size={14} /></Btn>
        <Btn onClick={() => linePrefix("1. ")} title="Lista numerata"><ListOrdered size={14} /></Btn>
        <Btn onClick={() => linePrefix("> ")} title="Citazione"><Quote size={14} /></Btn>
        <Btn onClick={insertLink} title="Link"><LinkIcon size={14} /></Btn>
        <span className="w-px h-5 bg-border mx-1" />
        <div className="relative">
          <Btn onClick={() => setShowColors((s) => !s)} title="Colore testo"><Palette size={14} /></Btn>
          {showColors && (
            <div className="absolute z-10 top-full left-0 mt-1 bg-popover border border-border rounded-md shadow-elevated p-2 grid grid-cols-3 gap-1.5 w-40">
              {COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => applyColor(c.value)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded hover:bg-muted text-[11px] font-body text-foreground"
                  title={c.label}
                >
                  <span className={`w-3 h-3 rounded-full ${c.cls}`} style={{ backgroundColor: c.value }} />
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="ml-auto flex items-center gap-0.5">
          <button
            type="button"
            onClick={() => setTab("edit")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-body ${tab === "edit" ? "bg-background border border-border" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Pencil size={12} /> Modifica
          </button>
          <button
            type="button"
            onClick={() => setTab("preview")}
            className={`flex items-center gap-1 px-2 py-1 rounded text-[11px] font-body ${tab === "preview" ? "bg-background border border-border" : "text-muted-foreground hover:bg-muted"}`}
          >
            <Eye size={12} /> Anteprima
          </button>
        </div>
      </div>

      {tab === "edit" ? (
        <textarea
          ref={taRef}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`${inputCls} border-0 rounded-none focus:ring-0`}
        />
      ) : (
        <div className="p-4 min-h-[120px] bg-background">
          {value.trim() ? (
            <MarkdownPreview content={value} />
          ) : (
            <p className="font-body text-sm text-muted-foreground italic">Nessun contenuto.</p>
          )}
        </div>
      )}
      <p className="px-3 py-1.5 border-t border-border bg-muted/30 font-body text-[10px] text-muted-foreground">
        Markdown attivo • **grassetto** *corsivo* ## titolo - lista [link](url) — usa la palette per i colori
      </p>
    </div>
  );
};

export const MarkdownPreview = ({ content }: { content: string }) => (
  <div className="prose prose-sm max-w-none font-body text-foreground prose-headings:font-display prose-headings:text-petrolio prose-strong:text-foreground prose-a:text-petrolio prose-blockquote:border-l-petrolio prose-blockquote:text-muted-foreground">
    <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
  </div>
);

export default MarkdownEditor;
