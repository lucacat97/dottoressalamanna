// Genera un vero file .docx (OOXML) a partire dal markdown della consulenza.
// Sostituisce la vecchia tecnica "HTML-as-Word" (.doc HTML) che Pages/macOS non apre.
import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  TextRun,
} from "npm:docx@9.5.1";

const TEAL = "2A6F6F";
const AMBER_BG = "FFF8E1";
const AMBER_BORDER = "F0B400";

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

/**
 * Converte il markdown della consulenza in un buffer .docx reale.
 * Gestisce: #/##/###/####, paragrafi, **grassetto**, *corsivo*,
 * liste puntate e numerate, blockquote (disclaimer), --- (separatore).
 */
export async function markdownToDocx(markdown: string, title: string): Promise<Uint8Array> {
  const children: Paragraph[] = [];
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  let orderedIndex = 0;

  for (const raw of lines) {
    const line = raw.trimEnd();
    const trimmed = line.trim();

    if (!trimmed) {
      orderedIndex = 0;
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
      continue;
    }

    const h = trimmed.match(/^(#{1,4})\s+(.+)$/);
    if (h) {
      children.push(heading(h[2].replace(/\*\*/g, ""), h[1].length as 1 | 2 | 3 | 4));
      continue;
    }

    if (trimmed.startsWith(">")) {
      children.push(blockquoteParagraph(trimmed.replace(/^>\s*/, "")));
      continue;
    }

    const bullet = trimmed.match(/^[-*]\s+(.+)$/);
    if (bullet) {
      children.push(bulletParagraph(bullet[1], false, 0));
      continue;
    }

    const ordered = trimmed.match(/^(\d+)\.\s+(.+)$/);
    if (ordered) {
      orderedIndex += 1;
      children.push(bulletParagraph(ordered[2], true, orderedIndex));
      continue;
    }

    orderedIndex = 0;
    children.push(
      new Paragraph({ spacing: { before: 60, after: 120, line: 340 }, children: runs(trimmed) })
    );
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
