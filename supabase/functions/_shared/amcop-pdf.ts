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
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, "");
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
  rangeLabels?: string[];
}

/**
 * Costruisce il PDF con stile AMCOP. Restituisce null se il markdown
 * non contiene le sezioni attese (il chiamante può fare fallback).
 */
export async function buildAmcopPdf(markdown: string, data: AmcopPdfData): Promise<Uint8Array | null> {
  const sections = parseSections(markdown);
  const byNum = new Map(sections.map(s => [s.num, s]));
  if (![1, 2, 3, 4, 8].every(n => byNum.has(n))) return null;
  const doc = await PDFDocument.create();
  doc.setTitle(`Consulenza Cefalometrica — ${data.patientName}`);
  doc.setCreator("Metodo MILA");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.TimesRomanBold);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  const margin = 16;
  const width = PAGE_W - margin * 2;
  const gap = 10;
  const leftW = (width - gap) * 0.52;
  const rightW = width - gap - leftW;
  const rightX = margin + leftW + gap;
  type Line = { words: { text: string; bold: boolean }[] };
  function wrap(src: string, w: number, size: number): Line[] {
    const lines: Line[] = [];
    let line: Line = { words: [] };
    let used = 0;
    for (const part of parseInline(sanitize(src.replace(/<br\s*\/?\s*>/gi, " ")))) {
      for (const raw of part.text.split(/\s+/).filter(Boolean)) {
        // Split unusually long tokens so they cannot cross a column boundary.
        let token = "";
        const tokens: string[] = [];
        for (const ch of raw) {
          if ((part.bold ? bold : font).widthOfTextAtSize(token + ch, size) > w && token) { tokens.push(token); token = ""; }
          token += ch;
        }
        if (token) tokens.push(token);
        for (const text of tokens) {
          const tw = (part.bold ? bold : font).widthOfTextAtSize(text + " ", size);
          if (used + tw > w && line.words.length) { lines.push(line); line = { words: [] }; used = 0; }
          line.words.push({ text, bold: !!part.bold }); used += tw;
        }
      }
    }
    if (line.words.length) lines.push(line);
    return lines;
  }
  let fieldN = 0;
  function text(src: string, x: number, top: number, w: number, size = 8.2, color = GREY, draw = true, edit = false): number {
    const lines = wrap(src, w, size);
    if (draw && edit) {
      // Editable form field: the professional can modify the content in any PDF reader.
      const h = lines.length * size * 1.22 + 3;
      const field = doc.getForm().createTextField(`campo_${++fieldN}`);
      field.enableMultiline();
      field.setText(lines.map(l => l.words.map(w2 => w2.text).join(" ")).join(" "));
      field.addToPage(page, { x: x - 2, y: top - h, width: w + 4, height: h + 1, borderWidth: 0, textColor: color, font });
      field.setFontSize(size);
      return lines.length * size * 1.22;
    }
    if (draw) lines.forEach((line, i) => {
      let dx = x;
      for (const word of line.words) {
        const f = word.bold ? bold : font;
        page.drawText(word.text, { x: dx, y: top - size - i * size * 1.22, size, font: f, color });
        dx += f.widthOfTextAtSize(word.text + " ", size);
      }
    });
    return lines.length * size * 1.22;
  }
  function band(label: string, x: number, top: number, w: number, draw = true): number {
    const size = 8.5;
    const h = Math.max(17, wrap(label, w - 12, size).length * size * 1.22 + 7);
    if (draw) {
      page.drawRectangle({ x, y: top - h, width: w, height: h, color: TEAL });
      text(label, x + 6, top - 3, w - 12, size, WHITE);
    }
    return h;
  }
  async function image(bytes: Uint8Array | null | undefined, x: number, top: number, w: number, h: number) {
    if (!bytes) return;
    try {
      const img = await embedImage(doc, bytes);
      const scale = Math.min(w / img.width, h / img.height);
      const iw = img.width * scale, ih = img.height * scale;
      page.drawImage(img, { x: x + (w - iw) / 2, y: top - (h + ih) / 2, width: iw, height: ih });
    } catch { /* Optional media never breaks the clinical document. */ }
  }
  await image(data.logo, margin, PAGE_H - 8, 140, 40);
  text("**Consulenza Cefalometrica**", margin + 151, PAGE_H - 10, 285, 14, TEAL_DARK);
  text(`Analisi Cefalometrica — **${data.patientName}**`, margin + 151, PAGE_H - 31, 285, 8.8);
  page.drawRectangle({ x: PAGE_W - margin - 121, y: PAGE_H - 44, width: 121, height: 33, color: LIGHT });
  text("**Metodo AMCOP**", PAGE_W - margin - 109, PAGE_H - 15, 105, 9, TEAL_DARK);
  text("Funzione · Crescita · Postura", PAGE_W - margin - 116, PAGE_H - 30, 116, 7);
  let top = PAGE_H - 55;
  const baseDisclaimer = (extractDisclaimer(markdown) ?? "La consulenza è uno strumento di supporto al ragionamento clinico e non costituisce diagnosi medica: la responsabilità diagnostica e terapeutica resta interamente in capo al professionista sanitario.")
    .replace(/\*\*/g, "");
  const disclaimer = `${baseDisclaimer} Questa funzionalità è stata pensata in maniera sperimentale e viene fornita come test.`;
  {
    // Editable form field so the professional can modify the disclaimer.
    const dh = text(disclaimer, margin + 7, top - 4, width - 14, 6.8, GREY, false) + 14;
    page.drawRectangle({ x: margin, y: top - dh, width, height: dh, color: AMBER_BG });
    page.drawRectangle({ x: margin, y: top - dh, width: 2, height: dh, color: AMBER_BORDER });
    const field = doc.getForm().createTextField("disclaimer");
    field.enableMultiline();
    field.setText(sanitize(disclaimer));
    field.addToPage(page, { x: margin + 4, y: top - dh + 2, width: width - 8, height: dh - 4, borderWidth: 0, backgroundColor: AMBER_BG, textColor: GREY, font });
    field.setFontSize(7.6);
    top -= dh + 7;
  }
  function valueTable(body: string, x: number, y: number, w: number, size: number, draw: boolean): number {
    const rows = tableRows(body);
    const weights = [0.25, 0.19, 0.29, 0.27];
    let total = 0;
    rows.forEach((row, r) => {
      const sizes = row.slice(0, 4).map((cell, c) => text(cell, 0, 0, w * weights[c] - 8, size, GREY, false));
      const rh = Math.max(21, ...sizes.map(h => h + 9));
      let dx = x;
      for (let c = 0; c < 4; c++) {
        const cw = w * weights[c];
        if (draw) {
          page.drawRectangle({ x: dx, y: y - total - rh, width: cw, height: rh, color: r === 0 ? LIGHT : WHITE, borderColor: GRID, borderWidth: 0.4 });
          text(r === 0 ? `**${row[c] ?? ""}**` : row[c] ?? "", dx + 4, y - total - 4, cw - 8, size, INK, true, r > 0);
        }
        dx += cw;
      }
      total += rh;
    });
    return total;
  }
  function section(num: number, x: number, y: number, w: number, size: number, draw: boolean): number {
    const s = byNum.get(num);
    if (!s) return 0;
    let h = band(`${num}. ${s.title.replace(/\*\*/g, "")}`, x, y, w, draw);
    if (num === 1) {
      h += valueTable(s.body, x, y - h, w, size - 0.5, draw);
      return h + 6;
    }
    const lines = bodyLines(s.body);
    const bodyH = lines.reduce((sum, line, i) => sum + text(line.replace(/^\d+\.\s*/, ""), 0, 0, w - (num === 8 ? 32 : 14), size, GREY, false) + 4, 10);
    if (draw) page.drawRectangle({ x, y: y - h - bodyH, width: w, height: bodyH, color: LIGHT });
    let yy = y - h - 5;
    lines.forEach((line, i) => {
      const content = num === 8 ? line.replace(/^\d+\.\s*/, "") : line;
      if (draw && num === 8) {
        page.drawCircle({ x: x + 12, y: yy - 6, size: 6.5, color: TEAL });
        page.drawText(String(i + 1), { x: x + 10, y: yy - 9, size: 7, font: bold, color: WHITE });
      }
      yy -= text(content, x + (num === 8 ? 25 : 7), yy, w - (num === 8 ? 32 : 14), size, GREY, draw, true) + 4;
    });
    return h + bodyH + 6;
  }
  let bodySize = 9.2;
  const leftHeight = (size: number) => [1, 5, 6, 7, 8].reduce((h, n) => h + section(n, margin, top, leftW, size, false), 0);
  // Prefer one A4 page like the reference, but never discard text to force a fit.
  while (bodySize > 8.4 && leftHeight(bodySize) > 520) bodySize -= 0.2;
  const columnPages = [page];
  let leftPageIndex = 0;
  let ly = top;
  for (const n of [1, 5, 6, 7, 8]) {
    const h = section(n, margin, ly, leftW, bodySize, false);
    if (ly - h < 35) {
      leftPageIndex++;
      page = doc.addPage([PAGE_W, PAGE_H]);
      columnPages.push(page);
      ly = PAGE_H - margin;
    }
    ly -= section(n, margin, ly, leftW, bodySize, true);
  }
  let rightPageIndex = 0;
  page = columnPages[0];
  let ry = top;
  const nextRightPage = () => {
    rightPageIndex++;
    const existing = columnPages[rightPageIndex];
    page = existing ?? doc.addPage([PAGE_W, PAGE_H]);
    if (!existing) columnPages.push(page);
    ry = PAGE_H - margin;
  };
  for (const n of [2, 3]) {
    if (ry - section(n, rightX, ry, rightW, bodySize, false) < 35) nextRightPage();
    ry -= section(n, rightX, ry, rightW, bodySize, true);
  }
  const s4 = byNum.get(4);
  if (s4) {
    const bh = band(`4. ${s4.title}`, rightX, ry, rightW, false);
    const clean = bodyLines(s4.body).filter(l => !l.startsWith("*" ) || l.startsWith("**"));
    const name = data.deviceImageAlt ?? "AMCOP DCM";
    const textW = data.deviceImage ? rightW * 0.47 : rightW - 14;
    const content = clean.filter(l => l.replace(/\*/g, "").trim() !== name).join(" ");
    const titleH = text(`**${name}**`, 0, 0, textW, 17, TEAL_DARK, false);
    const detailsH = text(content, 0, 0, textW, bodySize, GREY, false);
    const photoH = Math.max(132, titleH + detailsH + 16);
    const rangeH = (data.rangeImages ?? []).length ? 116 : 0;
    const panelH = photoH + rangeH + 17;
    if (ry - bh - panelH < 35) nextRightPage();
    band(`4. ${s4.title}`, rightX, ry, rightW);
    ry -= bh;
    page.drawRectangle({ x: rightX, y: ry - panelH, width: rightW, height: panelH, color: AMBER_BG, borderColor: GRID, borderWidth: 0.4 });
    text(`**${name}**`, rightX + 7, ry - 7, textW, 17, TEAL_DARK);
    text(content, rightX + 7, ry - titleH - 11, textW, bodySize, GREY, true, true);
    if (data.deviceImage) await image(data.deviceImage, rightX + textW + 11, ry - 5, rightW - textW - 16, photoH - 10);
    const bytes = data.rangeImages ?? [];
    const labels = data.rangeLabels ?? [];
    const cellW = (rightW - 12) / 5;
    for (let i = 0; i < bytes.length; i++) {
      const row = Math.floor(i / 5), col = i % 5;
      const xx = rightX + 6 + col * cellW, yy = ry - photoH - row * 49;
      await image(bytes[i], xx, yy, cellW - 3, 36);
      text(labels[i] ?? "", xx + 1, yy - 37, cellW - 2, 6.2, TEAL_DARK);
    }
    if (rangeH) text("**GAMMA AMCOP — forme DCM da definire dopo scansione**", rightX + 7, ry - photoH - rangeH + 10, rightW - 14, 6.4, TEAL_DARK);
    ry -= panelH + 6;
  }
  const lastIndex = Math.max(leftPageIndex, rightPageIndex);
  page = columnPages[lastIndex];
  let bottomTop = Math.min(leftPageIndex === lastIndex ? ly : PAGE_H - margin, rightPageIndex === lastIndex ? ry : PAGE_H - margin) - 3;
  const s9 = byNum.get(9);
  const items = s9 ? bodyLines(s9.body) : [];
  const halfW = width / 2;
  const rowHeights: number[] = [];
  for (let i = 0; i < items.length; i += 2) {
    rowHeights.push(Math.max(...items.slice(i, i + 2).map(l => text(l.replace(/^\d+\.\s*/, ""), 0, 0, halfW - 35, 8.5, GREY, false) + 12), 36));
  }
  const needed = rowHeights.reduce((a, b) => a + b, 0) + 22;
  if (bottomTop - needed < 35) { page = doc.addPage([PAGE_W, PAGE_H]); bottomTop = PAGE_H - margin; }
  if (s9) {
    bottomTop -= band(`9. ${s9.title}`, margin, bottomTop, width);
    let yy = bottomTop;
    rowHeights.forEach((rh, row) => {
      for (let col = 0; col < 2; col++) {
        const i = row * 2 + col;
        if (!items[i]) continue;
        const xx = margin + col * halfW;
        page.drawRectangle({ x: xx, y: yy - rh, width: halfW, height: rh, color: LIGHT, borderColor: GRID, borderWidth: 0.3 });
        page.drawCircle({ x: xx + 12, y: yy - 13, size: 7, color: TEAL });
        page.drawText(String(i + 1), { x: xx + 10, y: yy - 16, size: 8, font: bold, color: WHITE });
        text(items[i].replace(/^\d+\.\s*/, ""), xx + 26, yy - 5, halfW - 33, 8.5, GREY, true, true);
      }
      yy -= rh;
    });
    bottomTop = yy;
  }
  text(`Consulenza generata il ${data.date} — Metodo AMCOP · Funzione · Crescita · Postura`, margin, bottomTop - 7, width, 6.5);
  // useObjectStreams: false -> PDF 1.4 "classico", apribile anche da
  // visualizzatori datati (anteprime email/mobile) che rifiutano i file 1.7 compressi.
  return new Uint8Array(await doc.save({ useObjectStreams: false }));
}

export const PDF_MIME = "application/pdf";
