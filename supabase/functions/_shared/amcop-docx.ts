// Genera il .docx della consulenza cefalometrica con il layout grafico
// "Metodo AMCOP": intestazione con logo, due colonne con bande colorate,
// tabella valori, foto dispositivo, gamma colori e istruzioni d'uso.
import {
  AlignmentType,
  BorderStyle,
  Document,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
} from "npm:docx@9.5.1";

const TEAL = "1F6E8C"; // bande sezione
const TEAL_DARK = "155263";
const LIGHT = "EAF3F8"; // sfondo badge intestazione
const GRID = "C9D8E0";
const PAGE_W = 11906; // A4
const MARGIN = 850;
const CONTENT_W = PAGE_W - MARGIN * 2; // ~10206
const COL_LEFT = 5600;
const COL_RIGHT = CONTENT_W - COL_LEFT;

type Inline = { text: string; bold?: boolean; italics?: boolean };

function parseInline(src: string): Inline[] {
  const out: Inline[] = [];
  const re = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*)/g;
  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    if (m.index > last) out.push({ text: src.slice(last, m.index) });
    if (m[2] !== undefined) out.push({ text: m[2], bold: true, italics: true });
    else if (m[3] !== undefined) out.push({ text: m[3], bold: true });
    else if (m[4] !== undefined) out.push({ text: m[4], italics: true });
    last = re.lastIndex;
  }
  if (last < src.length) out.push({ text: src.slice(last) });
  return out.filter((i) => i.text.length > 0);
}

function runs(src: string, opts: { bold?: boolean; color?: string; size?: number } = {}): TextRun[] {
  return parseInline(src).map(
    (i) =>
      new TextRun({
        text: i.text,
        bold: opts.bold || i.bold || undefined,
        italics: i.italics || undefined,
        color: opts.color ?? (i.bold ? TEAL_DARK : undefined),
        size: opts.size,
      })
  );
}

/** Banda colorata con il titolo della sezione (es. "1. Tabella dei Valori..."). */
function sectionBand(title: string): Paragraph {
  return new Paragraph({
    spacing: { before: 160, after: 120 },
    shading: { type: ShadingType.CLEAR, fill: TEAL },
    children: [new TextRun({ text: ` ${title}`, bold: true, color: "FFFFFF", size: 21 })],
  });
}

function bodyParagraph(text: string, spacingAfter = 100): Paragraph {
  return new Paragraph({
    spacing: { before: 20, after: spacingAfter, line: 300 },
    children: runs(text, { size: 20 }),
  });
}

function numberedItem(index: number, text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 60, after: 60, line: 300 },
    indent: { left: 360, hanging: 360 },
    children: [
      new TextRun({ text: `${index}  `, bold: true, color: TEAL, size: 20 }),
      ...runs(text, { size: 20 }),
    ],
  });
}

// ── Dimensioni immagine dai byte (PNG/JPEG) ──
function imageSize(b: Uint8Array): { w: number; h: number; type: "png" | "jpg" } | null {
  if (b[0] === 0x89 && b[1] === 0x50) {
    return {
      w: (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19],
      h: (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23],
      type: "png",
    };
  }
  if (b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i < b.length) {
      if (b[i] !== 0xff) { i++; continue; }
      const marker = b[i + 1];
      const len = (b[i + 2] << 8) | b[i + 3];
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
        return { h: (b[i + 5] << 8) | b[i + 6], w: (b[i + 7] << 8) | b[i + 8], type: "jpg" };
      }
      i += 2 + len;
    }
  }
  return null;
}

function imagePara(bytes: Uint8Array, alt: string, maxWidth: number, center = true): Paragraph | null {
  const size = imageSize(bytes);
  if (!size || !size.w || !size.h) return null;
  const w = Math.min(maxWidth, size.w);
  const h = Math.round((size.h * w) / size.w);
  return new Paragraph({
    alignment: center ? AlignmentType.CENTER : undefined,
    spacing: { before: 80, after: 80 },
    children: [
      new ImageRun({
        type: size.type,
        data: bytes,
        transformation: { width: w, height: h },
        altText: { title: alt, description: alt, name: alt },
      }),
    ],
  });
}

// ── Parsing del markdown in sezioni numerate ──
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

function sectionTitle(s: Section): string {
  return `${s.num}. ${s.title.replace(/\*\*/g, "")}`;
}

// Righe di testo "semplici" di una sezione (senza tabelle/immagini)
function bodyLines(body: string): string[] {
  return body
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("|") && !l.startsWith("!["));
}

// ── Tabella valori (sezione 1) ──
function valuesTable(body: string, width: number): Table | null {
  const lines = body.split("\n").map((l) => l.trim()).filter((l) => /^\|.*\|$/.test(l));
  const rows = lines
    .filter((l) => !/^\|[\s:|-]+\|$/.test(l))
    .map((l) => l.slice(1, -1).split("|").map((c) => c.trim()));
  if (rows.length < 2) return null;
  const cols = Math.max(...rows.map((r) => r.length));
  const weights = cols === 4 ? [0.30, 0.18, 0.28, 0.24] : Array.from({ length: cols }, () => 1 / cols);
  const columnWidths = weights.map((w, i) =>
    i === cols - 1 ? width - Math.floor(width * weights.slice(0, -1).reduce((a, b) => a + b, 0)) : Math.floor(width * w)
  );
  const border = { style: BorderStyle.SINGLE, size: 4, color: GRID };
  const borders = { top: border, bottom: border, left: border, right: border };
  return new Table({
    width: { size: width, type: WidthType.DXA },
    columnWidths,
    rows: rows.map(
      (cells, rIdx) =>
        new TableRow({
          tableHeader: rIdx === 0,
          children: Array.from({ length: cols }, (_, cIdx) => {
            const isHeader = rIdx === 0;
            return new TableCell({
              borders,
              width: { size: columnWidths[cIdx], type: WidthType.DXA },
              margins: { top: 50, bottom: 50, left: 80, right: 80 },
              shading: isHeader ? { type: ShadingType.CLEAR, fill: LIGHT } : undefined,
              children: [
                new Paragraph({
                  alignment: cIdx > 0 ? AlignmentType.CENTER : undefined,
                  spacing: { before: 10, after: 10 },
                  children: runs(cells[cIdx] ?? "", { bold: isHeader, size: 18 }),
                }),
              ],
            });
          }),
        })
    ),
  });
}

const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};

export interface AmcopDocxData {
  patientName: string;
  date: string; // es. "15 ottobre 2026"
  logo?: Uint8Array | null;
  deviceImage?: Uint8Array | null;
  deviceImageAlt?: string;
  rangeImage?: Uint8Array | null;
  rangeCaption?: string;
}

/**
 * Costruisce il .docx con layout AMCOP. Restituisce null se il markdown
 * non contiene le sezioni attese (il chiamante fa fallback al layout semplice).
 */
export async function buildAmcopDocx(markdown: string, data: AmcopDocxData): Promise<Uint8Array | null> {
  const sections = parseSections(markdown);
  const byNum = new Map(sections.map((s) => [s.num, s]));
  // Servono almeno le sezioni 1-4 e 8 per il layout a due colonne
  if (!byNum.has(1) || !byNum.has(2) || !byNum.has(3) || !byNum.has(4) || !byNum.has(8)) return null;

  // ── Intestazione: logo | titolo | badge Metodo AMCOP ──
  const logoPara = data.logo ? imagePara(data.logo, "AMCOP", 130, false) : null;
  const header = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [2600, 4600, 3006],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: 2600, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              ...(logoPara ? [logoPara] : []),
              new Paragraph({ children: [new TextRun({ text: "Armonizzatore Multifunzionale", size: 14, color: "555555" })] }),
              new Paragraph({ children: [new TextRun({ text: "Cranio-Occluso-Posturale", size: 14, color: "555555" })] }),
            ],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 4600, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Consulenza Cefalometrica", bold: true, size: 36, color: "1A1A2E" })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 60 },
                children: [new TextRun({ text: `Analisi Cefalometrica — ${data.patientName}`, size: 22, color: "444444" })],
              }),
            ],
          }),
          new TableCell({
            borders: noBorders,
            width: { size: 3006, type: WidthType.DXA },
            verticalAlign: VerticalAlign.CENTER,
            shading: { type: ShadingType.CLEAR, fill: LIGHT },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: "Metodo AMCOP", bold: true, size: 22, color: TEAL_DARK })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 40 },
                children: [new TextRun({ text: "Funzione · Crescita · Postura", size: 18, color: TEAL_DARK })],
              }),
            ],
          }),
        ],
      }),
    ],
  });

  // ── Colonna sinistra: 1, 5, 6, 7, 8 ──
  const leftChildren: (Paragraph | Table)[] = [];
  const s1 = byNum.get(1)!;
  leftChildren.push(sectionBand(sectionTitle(s1)));
  const tbl = valuesTable(s1.body, COL_LEFT - 120);
  if (tbl) leftChildren.push(tbl);
  for (const l of bodyLines(s1.body)) leftChildren.push(bodyParagraph(l));

  for (const num of [5, 6, 7]) {
    const s = byNum.get(num);
    if (!s) continue;
    leftChildren.push(sectionBand(sectionTitle(s)));
    for (const l of bodyLines(s.body)) leftChildren.push(bodyParagraph(l));
  }

  const s8 = byNum.get(8)!;
  leftChildren.push(sectionBand(sectionTitle(s8)));
  let n = 0;
  for (const l of bodyLines(s8.body)) {
    const ord = l.match(/^(\d+)\.\s+(.+)$/);
    if (ord) leftChildren.push(numberedItem(Number(ord[1]), ord[2]));
    else leftChildren.push(numberedItem(++n, l));
  }

  // ── Colonna destra: 2, 3, 4 ──
  const rightChildren: (Paragraph | Table)[] = [];
  for (const num of [2, 3]) {
    const s = byNum.get(num)!;
    rightChildren.push(sectionBand(sectionTitle(s)));
    for (const l of bodyLines(s.body)) rightChildren.push(bodyParagraph(l));
  }
  const s4 = byNum.get(4)!;
  rightChildren.push(sectionBand(sectionTitle(s4)));
  for (const l of bodyLines(s4.body)) rightChildren.push(bodyParagraph(l));
  if (data.deviceImage) {
    const p = imagePara(data.deviceImage, data.deviceImageAlt ?? "Dispositivo AMCOP", 300);
    if (p) rightChildren.push(p);
  }
  if (data.rangeImage) {
    const p = imagePara(data.rangeImage, "Gamma dispositivi AMCOP", Math.min(420, COL_RIGHT - 160));
    if (p) rightChildren.push(p);
    rightChildren.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 40 },
        children: [new TextRun({ text: data.rangeCaption ?? "GAMMA DISPOSITIVI AMCOP — Bio Attivatori DCM", bold: true, size: 16, color: TEAL_DARK })],
      })
    );
  }

  const twoColumns = new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [COL_LEFT, COL_RIGHT],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: noBorders,
            width: { size: COL_LEFT, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 0, right: 120 },
            verticalAlign: VerticalAlign.TOP,
            children: leftChildren,
          }),
          new TableCell({
            borders: noBorders,
            width: { size: COL_RIGHT, type: WidthType.DXA },
            margins: { top: 0, bottom: 0, left: 120, right: 0 },
            verticalAlign: VerticalAlign.TOP,
            children: rightChildren,
          }),
        ],
      }),
    ],
  });

  // ── Sezione 9 a tutta larghezza: 8 istruzioni su 2 colonne ──
  const bottomChildren: (Paragraph | Table)[] = [];
  const s9 = byNum.get(9);
  if (s9) {
    bottomChildren.push(sectionBand(sectionTitle(s9)));
    const items: string[] = [];
    for (const l of bodyLines(s9.body)) {
      const ord = l.match(/^\d+\.\s+(.+)$/);
      if (ord) items.push(ord[1]);
    }
    const half = Math.ceil(items.length / 2);
    const colW = Math.floor(CONTENT_W / 2);
    const cellFor = (list: string[], offset: number): TableCell =>
      new TableCell({
        borders: noBorders,
        width: { size: colW, type: WidthType.DXA },
        margins: { top: 40, bottom: 40, left: 60, right: 160 },
        verticalAlign: VerticalAlign.TOP,
        children: list.map((it, i) => numberedItem(offset + i + 1, it)),
      });
    bottomChildren.push(
      new Table({
        width: { size: CONTENT_W, type: WidthType.DXA },
        columnWidths: [colW, CONTENT_W - colW],
        rows: [new TableRow({ children: [cellFor(items.slice(0, half), 0), cellFor(items.slice(half), half)] })],
      })
    );
  }

  // Nota finale con data
  bottomChildren.push(
    new Paragraph({
      spacing: { before: 240 },
      border: { top: { style: BorderStyle.SINGLE, size: 6, color: GRID, space: 4 } },
      children: [new TextRun({ text: `Consulenza generata il ${data.date} — Metodo AMCOP · Funzione · Crescita · Postura`, size: 16, color: "777777", italics: true })],
    })
  );

  const doc = new Document({
    title: `Consulenza Cefalometrica — ${data.patientName}`,
    creator: "Metodo MILA",
    styles: { default: { document: { run: { font: "Calibri", size: 20, color: "222222" } } } },
    sections: [
      {
        properties: {
          page: { size: { width: PAGE_W, height: 16838 }, margin: { top: MARGIN, right: MARGIN, bottom: MARGIN, left: MARGIN } },
        },
        children: [header, twoColumns, ...bottomChildren],
      },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}
