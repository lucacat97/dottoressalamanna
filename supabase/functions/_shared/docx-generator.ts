// Genera un vero file .docx (OOXML) a partire dal markdown della consulenza.
// Sostituisce la vecchia tecnica "HTML-as-Word" (.doc HTML) che Pages/macOS non apre.
import {
  BorderStyle,
  Document,
  HeadingLevel,
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
export async function markdownToDocx(markdown: string, title: string): Promise<Uint8Array> {
  const children: (Paragraph | Table)[] = [];
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
