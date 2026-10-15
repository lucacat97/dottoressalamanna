// Genera il PDF della consulenza cefalometrica con lo stile "Metodo AMCOP":
// intestazione con logo, box disclaimer, bande colorate per le sezioni,
// tabella valori, foto dispositivo, gamma colori e istruzioni d'uso.
// Pensato per chi non apre bene il .docx (es. Pages su Mac).
import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const TEAL = rgb(0x1f / 255, 0x6e / 255, 0x8c / 255);
const TEAL_DARK = rgb(0x15 / 255, 0x52 / 255, 0x63 / 255);
const LIGHT = rgb(0xea / 255, 0xf3 / 255, 0xf8 / 255);
const AMBER_BG = rgb(1, 0xf8 / 255, 0xe1 / 255);
const AMBER_BORDER = rgb(0xf0 / 255, 0xb4 / 255, 0);
const GRID = rgb(0xc9 / 255, 0xd8 / 255, 0xe0 / 255);
const INK = rgb(0x13 / 255, 0x13 / 255, 0x13 / 255);
const GREY = rgb(0x45 / 255, 0x45 / 255, 0x45 / 255);
const WHITE = rgb(1, 1, 1);

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 42;
const CONTENT_W = PAGE_W - MARGIN * 2;

// pdf-lib usa i font standard WinAnsi: sostituiamo i caratteri non coperti.
function sanitize(s: string): string {
  return s
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/…/g, "...")
    .replace(/·/g, "-")
    .replace(/[•◦]/g, "-")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/×/g, "x")
    .replace(/→/g, "->")
    .replace(/[^\x20-\x7E\xC0-\xFF\n]/g, "");
}

type Inline = { text: string; bold?: boolean };

function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push({ text: src.slice(last, m.index) });
    if (m[2] !== undefined) out.push({ text: m[2], bold: true });
    else if (m[3] !== undefined) out.push({ text: m[3], bold: true });
    else if (m[4] !== undefined) out.push({ text: m[4] });
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out.filter((i) => i.text.length > 0);
}

interface Section {
  num: number;
  title: string;
  body: string;
}

function parseSections(markdown: string): Section[] {
  const re = /^##\s*(\d)\.\s*(.+)$/gm;
  const matches: { num: number; title: string; index: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(markdown)) !== null) {
    matches.push({ num: Number(m[1]), title: m[2].trim(), index: m.index });
  }
  return matches.map((cur, i) => {
    const start = cur.index + markdown.slice(cur.index).indexOf("\n") + 1;
    const end = i + 1 < matches.length ? matches[i + 1].index : markdown.length;
    return { num: cur.num, title: cur.title, body: markdown.slice(start, end).trim() };
  });
}

function bodyLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("|") && !l.startsWith("![") && !/^Scheda dispositivo/i.test(l));
}

function extractDisclaimer(markdown: string): string | null {
  const m = markdown.match(/^>\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function tableRows(body: string): string[][] {
  const lines = body.split("\n").map((l) => l.trim()).filter((l) => /^\|.*\|$/.test(l));
  return lines
    .filter((l) => !/^\|[\s:|-]+\|$/.test(l))
    .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()));
}

// ── Cursor di pagina con gestione automatica delle nuove pagine ──
class Cursor {
  page: PDFPage;
  y: number;
  constructor(private doc: PDFDocument, private font: PDFFont, private bold: PDFFont) {
    this.page = doc.addPage([PAGE_W, PAGE_H]);
    this.y = PAGE_H - MARGIN;
  }
  ensure(needed: number) {
    if (this.y - needed < MARGIN) {
      this.page = this.doc.addPage([PAGE_W, PAGE_H]);
      this.y = PAGE_H - MARGIN;
    }
  }
  /** Disegna testo con parti in grassetto, con ritorno a capo automatico. */
  wrapText(src: string, size: number, opts: { color?: typeof INK; indent?: number; lineH?: number } = {}): number {
    const color = opts.color ?? INK;
    const indent = opts.indent ?? 0;
    const lineH = opts.lineH ?? size * 1.45;
    const maxW = CONTENT_W - indent;
    const parts = parseInline(sanitize(src));
    // Spezza in "parole" mantenendo lo stile
    const words: { t: string; bold: boolean }[] = [];
    for (const p of parts) {
      for (const w of p.text.split(/(\s+)/)) {
        if (w) words.push({ t: w, bold: !!p.bold });
      }
    }
    let x = MARGIN + indent;
    let lines = 0;
    const flushLine = () => { lines++; this.y -= lineH; x = MARGIN + indent; };
    for (const w of words) {
      const f = w.bold ? this.bold : this.font;
      const wWidth = f.widthOfTextAtSize(w.t, size);
      if (x + wWidth > MARGIN + indent + maxW && x > MARGIN + indent) {
        this.ensure(lineH);
        flushLine();
        if (/^\s+$/.test(w.t)) continue;
      }
      this.page.drawText(w.t, { x, y: this.y, size, font: f, color: w.bold ? TEAL_DARK : color });
      x += wWidth;
    }
    this.ensure(lineH);
    flushLine();
    return lines;
  }
  band(title: string) {
    const h = 20;
    this.ensure(h + 30);
    this.y -= 8;
    this.page.drawRectangle({ x: MARGIN, y: this.y - h + 5, width: CONTENT_W, height: h, color: TEAL });
    this.page.drawText(sanitize(title), { x: MARGIN + 8, y: this.y - h + 10, size: 11, font: this.bold, color: WHITE });
    this.y -= h + 4;
  }
  gap(n: number) { this.y -= n; }
}

async function embedImage(doc: PDFDocument, bytes: Uint8Array) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return doc.embedPng(bytes);
  return doc.embedJpg(bytes);
}

export interface AmcopPdfData {
  patientName: string;
  date: string;
  logo?: Uint8Array | null;
  deviceImage?: Uint8Array | null;
  deviceImageAlt?: string;
  rangeImages?: (Uint8Array | null)[];
  rangeCaption?: string;
}

/**
 * Costruisce il PDF con stile AMCOP. Restituisce null se il markdown
 * non contiene le sezioni attese (il chiamante può fare fallback).
 */
export async function buildAmcopPdf(markdown: string, data: AmcopPdfData): Promise<Uint8Array | null> {
  const sections = parseSections(markdown);
  const byNum = new Map(sections.map((s) => [s.num, s]));
  if (!byNum.has(1) || !byNum.has(2) || !byNum.has(3) || !byNum.has(4) || !byNum.has(8)) return null;

  const doc = await PDFDocument.create();
  doc.setTitle(`Consulenza Cefalometrica — ${data.patientName}`);
  doc.setCreator("Metodo MILA");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const cur = new Cursor(doc, font, bold);

  // ── Intestazione: logo + titolo + badge ──
  const headerH = 64;
  cur.ensure(headerH + 10);
  const topY = cur.y;
  if (data.logo) {
    try {
      const logo = await embedImage(doc, data.logo);
      const lh = 44;
      const lw = (logo.width / logo.height) * lh;
      cur.page.drawImage(logo, { x: MARGIN, y: topY - lh, width: Math.min(lw, 120), height: lh });
    } catch { /* logo opzionale */ }
  }
  cur.page.drawText("Consulenza Cefalometrica", { x: MARGIN + 130, y: topY - 20, size: 19, font: bold, color: rgb(0x1a / 255, 0x1a / 255, 0x2e / 255) });
  cur.page.drawText(sanitize(`Analisi Cefalometrica - ${data.patientName}`), { x: MARGIN + 130, y: topY - 38, size: 11, font, color: GREY });
  // Badge a destra
  const badgeW = 150;
  const badgeX = PAGE_W - MARGIN - badgeW;
  cur.page.drawRectangle({ x: badgeX, y: topY - 52, width: badgeW, height: 52, color: LIGHT });
  cur.page.drawText("Metodo AMCOP", { x: badgeX + 12, y: topY - 22, size: 11, font: bold, color: TEAL_DARK });
  cur.page.drawText(sanitize("Funzione - Crescita - Postura"), { x: badgeX + 12, y: topY - 38, size: 9, font, color: TEAL_DARK });
  cur.y = topY - headerH;

  // ── Disclaimer ──
  const disclaimer = extractDisclaimer(markdown);
  if (disclaimer) {
    const size = 8.5;
    const lineH = size * 1.4;
    // stima righe
    const approxCharsPerLine = Math.floor(CONTENT_W / (size * 0.5));
    const lines = Math.max(1, Math.ceil(disclaimer.length / approxCharsPerLine));
    const boxH = lines * lineH + 16;
    cur.ensure(boxH + 10);
    cur.page.drawRectangle({ x: MARGIN, y: cur.y - boxH, width: CONTENT_W, height: boxH, color: AMBER_BG });
    cur.page.drawRectangle({ x: MARGIN, y: cur.y - boxH, width: 3, height: boxH, color: AMBER_BORDER });
    cur.y -= 10;
    const savedY = cur.y;
    cur.wrapText(disclaimer, size, { indent: 10, lineH });
    cur.y = Math.min(cur.y, savedY - boxH + 6);
    cur.gap(6);
  }

  // ── Sezione 1: tabella valori ──
  const s1 = byNum.get(1)!;
  cur.band(`1. ${s1.title.replace(/\*\*/g, "")}`);
  const rows = tableRows(s1.body);
  if (rows.length >= 2) {
    const cols = Math.max(...rows.map((r) => r.length));
    const weights = cols === 4 ? [0.30, 0.16, 0.28, 0.26] : Array.from({ length: cols }, () => 1 / cols);
    const colWs = weights.map((w) => w * CONTENT_W);
    const cellSize = 8;
    const cellPad = 5;
    for (let r = 0; r < rows.length; r++) {
      // calcola altezza riga (wrap nelle celle)
      const cellLines: string[][] = [];
      let rowLines = 1;
      for (let c = 0; c < cols; c++) {
        const txt = sanitize((rows[r][c] ?? "").replace(/\*\*/g, ""));
        const f = r === 0 ? bold : font;
        const maxW = colWs[c] - cellPad * 2;
        const words = txt.split(/\s+/).filter(Boolean);
        const linesArr: string[] = [];
        let line = "";
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (f.widthOfTextAtSize(test, cellSize) > maxW && line) {
            linesArr.push(line);
            line = w;
          } else line = test;
        }
        if (line) linesArr.push(line);
        cellLines.push(linesArr.length ? linesArr : [""]);
        rowLines = Math.max(rowLines, linesArr.length);
      }
      const rowH = rowLines * (cellSize + 3) + cellPad * 2;
      cur.ensure(rowH + 4);
      let x = MARGIN;
      for (let c = 0; c < cols; c++) {
        if (r === 0) {
          cur.page.drawRectangle({ x, y: cur.y - rowH, width: colWs[c], height: rowH, color: LIGHT });
        }
        cur.page.drawRectangle({ x, y: cur.y - rowH, width: colWs[c], height: rowH, borderColor: GRID, borderWidth: 0.5 });
        const f = r === 0 ? bold : font;
        cellLines[c].forEach((ln, li) => {
          cur.page.drawText(ln, { x: x + cellPad, y: cur.y - cellPad - cellSize - li * (cellSize + 3), size: cellSize, font: f, color: INK });
        });
        x += colWs[c];
      }
      cur.y -= rowH;
    }
    cur.gap(6);
  }
  for (const l of bodyLines(s1.body)) cur.wrapText(l, 9.5);

  // ── Sezioni 2 e 3 ──
  for (const num of [2, 3]) {
    const s = byNum.get(num)!;
    cur.band(`${num}. ${s.title.replace(/\*\*/g, "")}`);
    for (const l of bodyLines(s.body)) cur.wrapText(l, 9.5);
  }

  // ── Sezione 4: dispositivo consigliato + foto + gamma ──
  const s4 = byNum.get(4)!;
  cur.band(`4. ${s4.title.replace(/\*\*/g, "")}`);
  for (const l of bodyLines(s4.body)) cur.wrapText(l, 9.5);
  if (data.deviceImage) {
    try {
      const img = await embedImage(doc, data.deviceImage);
      const maxW = 240;
      const scale = Math.min(maxW / img.width, 160 / img.height, 1);
      const w = img.width * scale;
      const h = img.height * scale;
      cur.ensure(h + 12);
      cur.page.drawImage(img, { x: MARGIN + (CONTENT_W - w) / 2, y: cur.y - h, width: w, height: h });
      cur.y -= h + 8;
    } catch { /* immagine opzionale */ }
  }
  const rangeImgs = (data.rangeImages ?? []).filter((b): b is Uint8Array => !!b);
  if (rangeImgs.length > 0) {
    const cellW = CONTENT_W / rangeImgs.length;
    const imgH = 56;
    cur.ensure(imgH + 26);
    for (let i = 0; i < rangeImgs.length; i++) {
      try {
        const img = await embedImage(doc, rangeImgs[i]);
        const scale = Math.min((cellW - 8) / img.width, imgH / img.height, 1);
        const w = img.width * scale;
        const h = img.height * scale;
        cur.page.drawImage(img, { x: MARGIN + i * cellW + (cellW - w) / 2, y: cur.y - h, width: w, height: h });
      } catch { /* salta immagine */ }
    }
    cur.y -= imgH + 4;
    const caption = sanitize(data.rangeCaption ?? "GAMMA DISPOSITIVI AMCOP - Bio Attivatori DCM");
    const capW = bold.widthOfTextAtSize(caption, 8);
    cur.page.drawText(caption, { x: MARGIN + (CONTENT_W - capW) / 2, y: cur.y - 8, size: 8, font: bold, color: TEAL_DARK });
    cur.y -= 16;
  }

  // ── Sezioni 5, 6, 7 ──
  for (const num of [5, 6, 7]) {
    const s = byNum.get(num);
    if (!s) continue;
    cur.band(`${num}. ${s.title.replace(/\*\*/g, "")}`);
    for (const l of bodyLines(s.body)) cur.wrapText(l, 9.5);
  }

  // ── Sezione 8: indicazioni terapeutiche numerate ──
  const s8 = byNum.get(8)!;
  cur.band(`8. ${s8.title.replace(/\*\*/g, "")}`);
  let n = 0;
  for (const l of bodyLines(s8.body)) {
    const ord = l.match(/^(\d+)\.\s+(.+)$/);
    const num8 = ord ? Number(ord[1]) : ++n;
    const text = ord ? ord[2] : l;
    cur.wrapText(`${num8}. ${text}`, 9.5, { indent: 10 });
  }

  // ── Sezione 9: istruzioni d'uso ──
  const s9 = byNum.get(9);
  if (s9) {
    cur.band(`9. ${s9.title.replace(/\*\*/g, "")}`);
    let m9 = 0;
    for (const l of bodyLines(s9.body)) {
      const ord = l.match(/^(\d+)\.\s+(.+)$/);
      const num9 = ord ? Number(ord[1]) : ++m9;
      const text = ord ? ord[1] : l;
      cur.wrapText(`${num9}. ${text}`, 9.5, { indent: 10 });
    }
  }

  // ── Nota finale ──
  cur.ensure(30);
  cur.gap(14);
  cur.page.drawLine({ start: { x: MARGIN, y: cur.y }, end: { x: PAGE_W - MARGIN, y: cur.y }, thickness: 0.7, color: GRID });
  cur.gap(10);
  cur.page.drawText(sanitize(`Consulenza generata il ${data.date} - Metodo AMCOP - Funzione - Crescita - Postura`), { x: MARGIN, y: cur.y, size: 8, font, color: GREY });

  return new Uint8Array(await doc.save());
}

export const PDF_MIME = "application/pdf";
