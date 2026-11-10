import { useRef, useState, useMemo, type PointerEvent } from "react";
import { Upload, Download, ZoomIn, ZoomOut, RotateCcw, Crosshair, AlertTriangle, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { downloadConsultationDocument } from "@/lib/consultation-download";
import { LANDMARKS, POINT_LABELS, SEGMENTS, MEASURE_LABELS, formattedMeasure, calculateMeasures, analysisSignature, type Points, type Landmark } from "@/lib/cephalometry/geometry";
import { analysisSchema, downloadBlob, readMilaStream, type Analysis } from "@/lib/cephalometry/analysis";
import { exportTrace } from "@/lib/cephalometry/export";

export default function AutomaticCephalometry() {
  const [image, setImage] = useState("");
  const [size, setSize] = useState({ width: 1, height: 1 });
  const [points, setPoints] = useState<Points>({});
  const [selected, setSelected] = useState<Landmark>("S");
  const [calibration, setCalibration] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<"M" | "F">("F");
  const [zoom, setZoom] = useState(1);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [report, setReport] = useState("");
  const [reportSignature, setReportSignature] = useState("");
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [pdfPage, setPdfPage] = useState(1);
  const [pageCount, setPageCount] = useState(0);
  const imageInput = useRef<HTMLInputElement>(null), importInput = useRef<HTMLInputElement>(null);
  const drag = useRef<Landmark | null>(null);
  const mm = Number(calibration) > 0 ? Number(calibration) : null;
  const measures = useMemo(() => calculateMeasures(points, mm), [points, mm]);
  const signature = analysisSignature(points, mm, age, sex);
  const stale = Boolean(report && reportSignature !== signature);
  const ready = image && Number(age) > 0 && Number(age) <= 120 && Object.keys(MEASURE_LABELS).every(key => measures[key as keyof typeof MEASURE_LABELS] !== null);
  const analysis: Analysis = { version: 1, image, ...size, points, calibration: mm, age, sex, report, reportSignature };
  const fail = (e: unknown) => toast({ title: "Operazione non riuscita", description: e instanceof Error ? e.message : "Riprova.", variant: "destructive" });
  const changed = (p: Points) => { setPoints(p); setConfirmed(false); };

  const setSource = async (source: string) => {
    const img = new Image(); img.src = source; await img.decode();
    if (img.width > 10000 || img.height > 10000 || img.width * img.height > 25_000_000) throw new Error("Immagine troppo grande (massimo 25 megapixel).");
    const canvas = document.createElement("canvas"); canvas.width = img.width; canvas.height = img.height;
    const context = canvas.getContext("2d"); if (!context) throw new Error("Immagine non leggibile");
    context.drawImage(img, 0, 0);
    setImage(canvas.toDataURL("image/png")); setSize({ width: img.width, height: img.height });
    setPoints({}); setCalibration(""); setConfirmed(false); setReport(""); setReportSignature(""); setZoom(1);
  };
  const renderPdf = async (bytes: Uint8Array, pageNumber: number) => {
    const pdfjs = await import("pdfjs-dist");
    const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
    pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
    const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
    try {
      setPageCount(pdf.numPages);
      const page = await pdf.getPage(pageNumber), viewport = page.getViewport({ scale: 2 });
      if (viewport.width * viewport.height > 25_000_000) throw new Error("Pagina PDF troppo grande");
      const canvas = document.createElement("canvas"); canvas.width = viewport.width; canvas.height = viewport.height;
      const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("PDF non leggibile");
      await page.render({ canvasContext: ctx, canvas, viewport }).promise;
      await setSource(canvas.toDataURL("image/png"));
    } finally { await pdf.destroy(); }
  };
  const loadFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    try {
      if (file.size > 20 * 1024 * 1024) throw new Error("Dimensione massima 20 MB.");
      if (file.type === "application/pdf") {
        const bytes = new Uint8Array(await file.arrayBuffer()); setPdfBytes(bytes); setPdfPage(1); await renderPdf(bytes, 1);
      } else if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        setPdfBytes(null); setPageCount(0);
        const url = URL.createObjectURL(file); try { await setSource(url); } finally { URL.revokeObjectURL(url); }
      } else throw new Error("Carica PNG, JPEG, WebP o PDF.");
    } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const importFile = async (file?: File) => {
    if (!file) return;
    try {
      if (file.size > 45_000_000) throw new Error("Fascicolo troppo grande");
      const parsed = analysisSchema.parse(JSON.parse(await file.text()));
      await setSource(parsed.image);
      const img = new Image(); img.src = parsed.image; await img.decode();
      if (img.width !== parsed.width || img.height !== parsed.height) throw new Error("Dimensioni del fascicolo non coerenti");
      const restored: Points = {};
      for (const id of LANDMARKS) {
        const p = parsed.points[id];
        if (p && typeof p.x === "number" && typeof p.y === "number") restored[id] = { x: p.x, y: p.y };
      }
      setPoints(restored); setCalibration(parsed.calibration?.toString() ?? ""); setAge(parsed.age); setSex(parsed.sex);
      setReport(parsed.report); setReportSignature(parsed.reportSignature); setPdfBytes(null); setPageCount(0);
    } catch (e) { fail(e); }
  };
  const locate = (e: PointerEvent<SVGSVGElement>) => {
    const matrix = e.currentTarget.getScreenCTM(); if (!matrix) return null;
    const p = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
    return { x: Math.max(0, Math.min(size.width, p.x)), y: Math.max(0, Math.min(size.height, p.y)) };
  };
  const generate = async () => {
    if (!ready || !confirmed || busy) return;
    setBusy(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Accedi nuovamente all’area riservata.");
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orthodontic-diagnosis`, {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
        body: JSON.stringify({ nome: "Paziente", cognome: "", age: Number(age), sex,
          angolo_sellare: measures.angolo_sellare, anb: measures.anb, wits: measures.wits,
          angolo_articolare: measures.angolo_articolare, angolo_goniaco: measures.angolo_goniaco, rapporto_ns_gome: measures.rapporto_ns_gome }),
      });
      if (!response.ok || !response.body) { const error = await response.json().catch(() => ({})); throw new Error(error.error ?? "Generazione non disponibile"); }
      const result = await readMilaStream(response.body); setReport(result); setReportSignature(signature);
      toast({ title: "Consulenza MILA disponibile" });
    } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const downloadReport = async (format: "pdf" | "docx") => {
    setBusy(true);
    try { await downloadConsultationDocument({ markdown: report, tool: "orthodontic", patientName: "Paziente", format, filename: `MILA_consulenza.${format}` }); }
    catch (e) { fail(e); } finally { setBusy(false); }
  };
  const autoDetect = async () => {
    setBusy(true);
    try {
      const img = new Image(); img.src = image; await img.decode();
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement("canvas"); c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      const { data, error } = await supabase.functions.invoke("cephalometric-landmarks", { body: { image: c.toDataURL("image/jpeg", 0.9) } });
      if (error || data?.error) throw new Error(data?.error ?? error?.message ?? "Riconoscimento non riuscito");
      const next: Points = { ...points };
      for (const [k, p] of Object.entries(data.points as Record<string, { x: number; y: number }>)) next[k as Landmark] = { x: p.x * size.width, y: p.y * size.height };
      changed(next);
      toast({ title: "Punti proposti", description: "Verifica e trascina i punti dove serve prima di confermare." });
    } catch (e) { fail(e); } finally { setBusy(false); }
  };
  const exportImage = async (format: "png" | "pdf") => { setBusy(true); try { await exportTrace(analysis, format); } catch (e) { fail(e); } finally { setBusy(false); } };

  return <div className="space-y-6">
    <div role="status" className="border-l-4 border-gold bg-muted p-4 flex items-start gap-3">
      <AlertTriangle className="text-gold shrink-0" size={20} />
      <div><p className="font-semibold text-foreground">Prototipo sperimentale · riconoscimento automatico da verificare</p><p className="text-sm text-muted-foreground">I punti proposti da un modello AI generico possono essere imprecisi di alcuni millimetri: controllali e correggili sempre prima di confermare.</p></div>
    </div>
    <div className="flex flex-wrap items-end gap-4">
      <input ref={imageInput} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" className="hidden" onChange={e => void loadFile(e.target.files?.[0])} />
      <input ref={importInput} type="file" accept=".json" className="hidden" onChange={e => void importFile(e.target.files?.[0])} />
      <Button onClick={() => imageInput.current?.click()} disabled={busy}><Upload size={16} className="mr-2" />Carica teleradiografia</Button>
      {image && <Button variant="secondary" onClick={() => void autoDetect()} disabled={busy}><Crosshair size={16} className="mr-2" />Riconosci punti automaticamente</Button>}
      <Button variant="outline" onClick={() => importInput.current?.click()} disabled={busy}>Apri fascicolo</Button>
      <div className="w-24"><Label htmlFor="cef-age">Età</Label><Input id="cef-age" type="number" min="1" max="120" value={age} onChange={e => { setAge(e.target.value); setConfirmed(false); }} className="text-base" disabled={busy} /></div>
      <div><Label htmlFor="cef-sex">Sesso</Label><select id="cef-sex" value={sex} disabled={busy} onChange={e => { setSex(e.target.value as "M" | "F"); setConfirmed(false); }} className="block h-10 rounded-md border border-input bg-background px-3 text-base"><option value="F">F</option><option value="M">M</option></select></div>
      {pageCount > 1 && <div><Label htmlFor="cef-page">Pagina PDF</Label><select id="cef-page" value={pdfPage} disabled={busy} className="block h-10 border border-input rounded-md bg-background px-3 text-base" onChange={async e => { if (!pdfBytes) return; const n = Number(e.target.value); setPdfPage(n); setBusy(true); try { await renderPdf(pdfBytes, n); } catch (err) { fail(err); } finally { setBusy(false); } }}>{Array.from({ length: pageCount }, (_, i) => <option key={i + 1}>{i + 1}</option>)}</select></div>}
      {busy && <Loader2 className="animate-spin text-primary" aria-label="Operazione in corso" />}
    </div>
    {image ? <Tabs defaultValue="trace">
      <TabsList><TabsTrigger value="trace">Tracciato cefalometrico</TabsTrigger><TabsTrigger value="report">Consulenza MILA{stale ? " · da aggiornare" : ""}</TabsTrigger></TabsList>
      <TabsContent value="trace" className="space-y-5">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_300px] gap-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Button variant="outline" size="icon" title="Riduci zoom" aria-label="Riduci zoom" onClick={() => setZoom(v => Math.max(1, v - .25))}><ZoomOut size={16} /></Button>
              <span className="text-sm tabular-nums w-14 text-center">{Math.round(zoom * 100)}%</span>
              <Button variant="outline" size="icon" title="Aumenta zoom" aria-label="Aumenta zoom" onClick={() => setZoom(v => Math.min(3, v + .25))}><ZoomIn size={16} /></Button>
              <Button variant="ghost" size="icon" title="Ripristina zoom" aria-label="Ripristina zoom" onClick={() => setZoom(1)}><RotateCcw size={16} /></Button>
              <span className="text-sm text-muted-foreground">Punto: {selected}</span>
            </div>
            <div className="overflow-auto border border-border rounded-md max-h-[75vh]">
              <svg role="img" aria-label="Radiografia con tracciato cefalometrico modificabile" viewBox={`0 0 ${size.width} ${size.height}`} width={`${zoom * 100}%`} className="block touch-none select-none" onPointerDown={e => {
                if (busy || (e.target as Element).closest('[data-point]')) return;
                const p = locate(e); if (p) changed({ ...points, [selected]: p });
              }} onPointerMove={e => { if (!drag.current || busy) return; const p = locate(e); if (p) changed({ ...points, [drag.current]: p }); }} onPointerUp={() => { drag.current = null; }} onPointerCancel={() => { drag.current = null; }}>
                <image href={image} width={size.width} height={size.height} />
                {SEGMENTS.map(([a, b]) => { const pa = points[a], pb = points[b]; return pa && pb ? <line key={`${a}-${b}`} x1={pa.x} y1={pa.y} x2={pb.x} y2={pb.y} className="stroke-gold" strokeWidth={Math.max(2, size.width / 400)} pointerEvents="none" /> : null; })}
                {Object.entries(points).map(([id, p]) => <g key={id} data-point={id} onPointerDown={e => { if (busy) return; e.stopPropagation(); drag.current = id as Landmark; setSelected(id as Landmark); e.currentTarget.ownerSVGElement?.setPointerCapture(e.pointerId); }} className="cursor-move">
                  <circle cx={p.x} cy={p.y} r={size.width / 90} className="fill-transparent" />
                  <circle cx={p.x} cy={p.y} r={Math.max(4, size.width / 180)} className={selected === id ? "fill-gold stroke-foreground" : "fill-primary stroke-gold"} strokeWidth={2} />
                  <text x={p.x + size.width / 100} y={p.y - size.width / 100} fontSize={Math.max(14, size.width / 50)} className="fill-gold font-semibold">{id}</text>
                </g>)}
              </svg>
            </div>
          </div>
          <aside className="space-y-5">
            <div><h3 className="font-display font-semibold mb-2">Punti anatomici</h3><div className="grid grid-cols-2 gap-2">
              {LANDMARKS.map(id => <Button key={id} variant={selected === id ? "default" : "outline"} disabled={busy} onClick={() => setSelected(id)} className="justify-start" title={POINT_LABELS[id]}><Crosshair size={14} className="mr-2 shrink-0" />{id}{points[id] ? " ✓" : ""}</Button>)}
            </div><p className="text-xs text-muted-foreground mt-2">{POINT_LABELS[selected]}</p>
              {points[selected] && <Button variant="ghost" size="sm" disabled={busy} onClick={() => { const next = { ...points }; delete next[selected]; changed(next); }}>Rimuovi {selected}</Button>}
            </div>
            <div><Label htmlFor="calibration-mm">Distanza C1–C2 (mm)</Label><Input id="calibration-mm" type="number" min="0.01" max="10000" step="0.1" value={calibration} disabled={busy} onChange={e => { setCalibration(e.target.value); setConfirmed(false); }} className="text-base" /><p className="text-xs text-muted-foreground mt-2">{measures.mmPerPx ? `Scala: ${measures.mmPerPx.toFixed(4)} mm/pixel` : "Scala non calibrata · Wits non disponibile"}</p></div>
            <div className="border-t border-border pt-3"><h3 className="font-display font-semibold mb-2">Misure del tracciato</h3><dl className="space-y-3">{Object.entries(MEASURE_LABELS).map(([key, label]) => <div key={key} className="flex justify-between gap-3 text-sm"><dt>{label}</dt><dd className="font-semibold tabular-nums whitespace-nowrap">{formattedMeasure(key, measures[key as keyof typeof MEASURE_LABELS])}</dd></div>)}</dl></div>
          </aside>
        </div>
        <div className="flex gap-3 flex-wrap border-t border-border pt-4">
          <Button variant="outline" disabled={busy} onClick={() => void exportImage("pdf")}><Download size={16} className="mr-2" />Tracciato PDF</Button>
          <Button variant="outline" disabled={busy} onClick={() => void exportImage("png")}><Download size={16} className="mr-2" />Immagine PNG</Button>
          <Button variant="outline" disabled={busy} onClick={() => downloadBlob(new Blob([JSON.stringify(analysis)], { type: "application/json" }), "MILA_fascicolo.json")}><Download size={16} className="mr-2" />Salva fascicolo</Button>
        </div>
        <div className="flex items-start gap-3"><Checkbox id="cef-confirm" checked={confirmed} disabled={busy || !ready} onCheckedChange={v => setConfirmed(v === true)} /><Label htmlFor="cef-confirm" className="text-sm leading-relaxed">Ho verificato punti, scala, piano occlusale posteriore→anteriore e misure. Lo strumento non costituisce diagnosi medica; la responsabilità resta al professionista.</Label></div>
        <Button disabled={!ready || !confirmed || busy} onClick={() => void generate()} className="whitespace-normal h-auto min-h-10 py-2">Conferma tracciato e genera consulenza MILA</Button>
      </TabsContent>
      <TabsContent value="report" className="space-y-4">
        {stale && <p role="alert" className="text-destructive font-semibold">Tracciato modificato: aggiorna la consulenza prima di scaricarla.</p>}
        {report ? <><div className="flex flex-wrap gap-3"><Button disabled={busy || stale} onClick={() => void downloadReport("pdf")}><Download size={16} className="mr-2" />PDF</Button><Button variant="outline" disabled={busy || stale} onClick={() => void downloadReport("docx")}><Download size={16} className="mr-2" />Word</Button></div><div className="prose prose-sm dark:prose-invert max-w-none"><ReactMarkdown remarkPlugins={[remarkGfm]}>{report}</ReactMarkdown></div></> : <p className="text-muted-foreground py-8">Nessuna consulenza generata.</p>}
      </TabsContent>
    </Tabs> : <div className="py-16 border-y border-border text-center"><Crosshair size={40} className="mx-auto text-primary mb-4" /><h3 className="font-display text-xl">Teleradiografia</h3><p className="text-sm text-muted-foreground mt-2">PNG, JPEG, WebP o PDF · massimo 20 MB</p></div>}
  </div>;
}