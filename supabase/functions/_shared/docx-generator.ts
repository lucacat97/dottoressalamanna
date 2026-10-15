// Genera un vero file .docx (OOXML) a partire dal markdown della consulenza.
// Sostituisce la vecchia tecnica "HTML-as-Word" (.doc HTML) che Pages/macOS non apre.
import {
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "npm:docx@9.5.1";

const TEAL = "2A6F6F";
const AMBER_BG = "FFF8E1";
const AMBER_BORDER = "F0B400";
const TABLE_WIDTH = 9638; // A4 con margini 2cm

type Inline = { text: string; bold?: boolean; italics?: boolean };

// Parsing inline minimale: **grassetto**, *corsivo*, ***entrambi***
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

function runs(src: string, baseBold = false): TextRun[] {
  return parseInline(src).map(
    (i) =>
      new TextRun({
        text: i.text,
        bold: baseBold || i.bold || undefined,
        italics: i.italics || undefined,
        color: i.bold ? TEAL : undefined,
      })
  );
}

function heading(text: string, level: 1 | 2 | 3 | 4): Paragraph {
  const sizes: Record<number, number> = { 1: 36, 2: 28, 3: 24, 4: 22 };
  return new Paragraph({
    heading:
      level === 1
        ? HeadingLevel.HEADING_1
        : level === 2
          ? HeadingLevel.HEADING_2
          : level === 3
            ? HeadingLevel.HEADING_3
            : HeadingLevel.HEADING_4,
    spacing: { before: level === 1 ? 360 : 280, after: 140 },
    children: [
      new TextRun({
        text,
        bold: true,
        size: sizes[level],
        color: level <= 2 ? TEAL : "333333",
        font: level <= 2 ? "Georgia" : "Calibri",
      }),
    ],
  });
}

function blockquoteParagraph(text: string): Paragraph {
  return new Paragraph({
    spacing: { before: 120, after: 120 },
    shading: { type: ShadingType.CLEAR, fill: AMBER_BG },
    border: {
      left: { style: BorderStyle.SINGLE, size: 24, color: AMBER_BORDER, space: 8 },
    },
    children: runs(text),
  });
}

function bulletParagraph(text: string, ordered: boolean, index: number): Paragraph {
  return new Paragraph({
    spacing: { before: 40, after: 40 },
    indent: { left: 480, hanging: 240 },
    children: [
      new TextRun({ text: ordered ? `${index}. ` : "• ", bold: true, color: TEAL }),
      ...runs(text),
    ],
  });
}

// ── Tabelle markdown (| a | b |) ──
function isTableLine(line: string): boolean {
  return /^\|.*\|$/.test(line.trim());
}
function isSeparatorRow(line: string): boolean {
  return /^\|[\s:|-]+\|$/.test(line.trim());
}
function splitRow(line: string): string[] {
  return line.trim().slice(1, -1).split("|").map((c) => c.trim());
}

const cellBorder = { style: BorderStyle.SINGLE, size: 4, color: "CCCCCC" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };

function buildTable(tableLines: string[]): Table {
  const rows = tableLines.filter((l) => !isSeparatorRow(l)).map(splitRow);
  const colCount = Math.max(...rows.map((r) => r.length), 1);
  const colWidth = Math.floor(TABLE_WIDTH / colCount);
  const columnWidths = Array.from({ length: colCount }, (_, i) =>
    i === colCount - 1 ? TABLE_WIDTH - colWidth * (colCount - 1) : colWidth
  );

  return new Table({
    width: { size: TABLE_WIDTH, type: WidthType.DXA },
    columnWidths,
    rows: rows.map(
      (cells, rIdx) =>
        new TableRow({
          tableHeader: rIdx === 0,
          children: Array.from({ length: colCount }, (_, cIdx) => {
            const isHeader = rIdx === 0;
            return new TableCell({
              borders: cellBorders,
              width: { size: columnWidths[cIdx], type: WidthType.DXA },
              margins: { top: 60, bottom: 60, left: 100, right: 100 },
              shading: isHeader ? { type: ShadingType.CLEAR, fill: "F0F7F7" } : undefined,
              children: [
                new Paragraph({
                  spacing: { before: 20, after: 20 },
                  children: runs(cells[cIdx] ?? "", isHeader),
                }),
              ],
            });
          }),
        })
    ),
  });
}

/**
 * Converte il markdown della consulenza in un buffer .docx reale.
 * Gestisce: #/##/###/####, paragrafi, **grassetto**, *corsivo*,
 * liste puntate e numerate, tabelle, blockquote (disclaimer), --- (separatore).
 */
// Dimensioni immagine (PNG/JPEG) lette dai byte, per mantenere le proporzioni.
function imageSize(b: Uint8Array): { w: number; h: number; type: "png" | "jpg" } | null {
  if (b[0] === 0x89 && b[1] === 0x50) {
    const w = (b[16] << 24) | (b[17] << 16) | (b[18] << 8) | b[19];
    const h = (b[20] << 24) | (b[21] << 16) | (b[22] << 8) | b[23];
    return { w, h, type: "png" };
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

function imageParagraph(bytes: Uint8Array, alt: string, maxWidth = 420): Paragraph | null {
  const size = imageSize(bytes);
  if (!size || !size.w || !size.h) return null;
  const w = Math.min(maxWidth, size.w);
  const h = Math.round((size.h * w) / size.w);
  return new Paragraph({
    spacing: { before: 120, after: 120 },
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

export interface DocxOptions {
  /** Immagini già scaricate, indicizzate per URL usato nel markdown `![alt](url)`. */
  images?: Record<string, Uint8Array>;
  /** Logo opzionale in testa al documento. */
  headerLogo?: Uint8Array | null;
  /** Riga sotto il logo (es. "Metodo AMCOP — Funzione · Crescita · Postura"). */
  headerTagline?: string;
}

export async function markdownToDocx(markdown: string, title: string, options: DocxOptions = {}): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];
  if (options.headerLogo) {
    const logo = imageParagraph(options.headerLogo, "Logo", 200);
    if (logo) children.push(logo);
  }
  if (options.headerTagline) {
    children.push(new Paragraph({
      spacing: { after: 200 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: TEAL, space: 4 } },
      children: [new TextRun({ text: options.headerTagline, bold: true, color: TEAL, size: 22 })],
    }));
  }
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let orderedIndex = 0;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (!trimmed) {
      orderedIndex = 0;
      i++;
      continue;
    }

    // Blocco tabella: righe consecutive che iniziano e finiscono con |
    if (isTableLine(trimmed)) {
      const tableLines: string[] = [];
      while (i < lines.length && isTableLine(lines[i].trim())) {
        tableLines.push(lines[i]);
        i++;
      }
      if (tableLines.length >= 2) children.push(buildTable(tableLines));
      else children.push(...tableLines.map((l) => new Paragraph({ children: runs(l.trim()) })));
      continue;
    }

    if (/^---+$/.test(trimmed)) {
      children.push(
        new Paragraph({
          spacing: { before: 160, after: 160 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "DDDDDD", space: 1 } },
          children: [],
        })
      );
      i++;
      continue;
    }

    const img = trimmed.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (img) {
      const bytes = options.images?.[img[2]];
      const p = bytes ? imageParagraph(bytes, img[1] || "Immagine") : null;
      if (p) children.push(p);
      i++;
      continue;
    }

    const h = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      children.push(heading(h[2].replace(/\*\*/g, ""), h[1].length as 1 | 2 | 3 | 4));
      i++;
      continue;
    }

    if (trimmed.startsWith(">")) {
      children.push(blockquoteParagraph(trimmed.replace(/^>\s*/, "")));
      i++;
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      children.push(bulletParagraph(bullet[1], false, 0));
      i++;
      continue;
    }

    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (ordered) {
      orderedIndex += 1;
      children.push(bulletParagraph(ordered[2], true, orderedIndex));
      i++;
      continue;
    }

    orderedIndex = 0;
    children.push(
      new Paragraph({ spacing: { before: 60, after: 120, line: 340 }, children: runs(trimmed) })
    );
    i++;
  }

  const doc = new Document({
    title,
    creator: "Metodo MILA",
    styles: {
      default: {
        document: { run: { font: "Calibri", size: 22, color: "222222" } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            size: { width: 11906, height: 16838 }, // A4
            margin: { top: 1134, right: 1134, bottom: 1134, left: 1134 }, // 2cm
          },
        },
        children,
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return new Uint8Array(buffer);
}

export const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
