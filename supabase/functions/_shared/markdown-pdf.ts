// PDF editabile generico (es. Check-Up Ortodontico Posturale): titoli fissi,
// ogni paragrafo/voce/riga di tabella è un campo modulo modificabile.
import { PDFDocument, StandardFonts, rgb } from "npm:pdf-lib@1.17.1";

const TEAL = rgb(0x1f / 255, 0x6e / 255, 0x8c / 255);
const GREY = rgb(0x30 / 255, 0x30 / 255, 0x30 / 255);
const AMBER_BG = rgb(1, 0xf8 / 255, 0xe1 / 255);
const W = 595.28, H = 841.89, M = 48;

export const EXPERIMENTAL_NOTE =
  "Questa funzionalità è stata pensata in maniera sperimentale e viene fornita come test.";

function clean(s: string): string {
  return s
    .replace(/<[^>]+>/g, " ")
    .replace(/\*\*|__|`/g, "").replace(/(^|\s)\*(\S)/g, "$1$2").replace(/(\S)\*(\s|$)/g, "$1$2")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"').replace(/[–—]/g, "-").replace(/…/g, "...")
    .replace(/[•◦·]/g, "-").replace(/≥/g, ">=").replace(/≤/g, "<=").replace(/→/g, "->")
    .replace(/[^\x20-\x7E\xA0-\xFF]/g, "").replace(/\s+/g, " ").trim();
}

export async function buildMarkdownPdf(markdown: string, title: string, disclaimer: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.setTitle(title);
  doc.setCreator("Metodo MILA");
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const form = doc.getForm();
  let page = doc.addPage([W, H]);
  let y = H - M;
  let n = 0;
  const width = W - M * 2;

  const wrapCount = (t: string, f: typeof font, size: number, w: number) => {
    let lines = 1, used = 0;
    for (const word of t.split(" ")) {
      const ww = f.widthOfTextAtSize(word + " ", size);
      if (used + ww > w && used > 0) { lines++; used = 0; }
      used += ww;
    }
    return lines;
  };
  const ensure = (h: number) => { if (y - h < M) { page = doc.addPage([W, H]); y = H - M; } };
  const heading = (t: string, size: number) => {
    const lines = wrapCount(t, bold, size, width);
    ensure(lines * size * 1.3 + 10);
    y -= 6;
    // simple wrap for static titles
    let line = "";
    for (const word of t.split(" ")) {
      if (bold.widthOfTextAtSize(line + word, size) > width && line) {
        y -= size * 1.3; page.drawText(line.trim(), { x: M, y, size, font: bold, color: TEAL }); line = "";
      }
      line += word + " ";
    }
    y -= size * 1.3; page.drawText(line.trim(), { x: M, y, size, font: bold, color: TEAL });
    y -= 4;
  };
  const field = (t: string, size = 10, indent = 0, bg?: typeof AMBER_BG) => {
    const w = width - indent - 6;
    const h = wrapCount(t, font, size, w - 4) * size * 1.25 + 6;
    ensure(h + 4);
    const f = form.createTextField(`campo_${++n}`);
    f.enableMultiline();
    f.setText(t);
    f.addToPage(page, { x: M + indent, y: y - h, width: width - indent, height: h, borderWidth: 0, textColor: GREY, font, ...(bg ? { backgroundColor: bg } : {}) });
    f.setFontSize(size);
    y -= h + 4;
  };
  const image = async (url: string) => {
    try {
      const r = await fetch(url);
      if (!r.ok) return;
      const b = new Uint8Array(await r.arrayBuffer());
      const img = b[0] === 0x89 ? await doc.embedPng(b) : await doc.embedJpg(b);
      const s = Math.min(220 / img.width, 160 / img.height);
      ensure(img.height * s + 8);
      y -= img.height * s;
      page.drawImage(img, { x: M, y, width: img.width * s, height: img.height * s });
      y -= 8;
    } catch { /* immagini facoltative */ }
  };

  heading(clean(title), 18);
  field(`${clean(disclaimer)} ${EXPERIMENTAL_NOTE}`, 8.5, 0, AMBER_BG);

  let para: string[] = [];
  const flush = () => { if (para.length) { field(clean(para.join(" "))); para = []; } };
  for (const raw of markdown.split("\n")) {
    const l = raw.trim();
    if (!l) { flush(); continue; }
    const img = l.match(/!\[[^\]]*\]\(([^)\s]+)\)/);
    if (img) { flush(); if (/^https:\/\//.test(img[1])) await image(img[1]); continue; }
    const h = l.match(/^(#{1,4})\s+(.*)$/);
    if (h) { flush(); heading(clean(h[2]), h[1].length <= 1 ? 16 : h[1].length === 2 ? 13 : 11); continue; }
    if (/^\|[\s:|-]+\|$/.test(l) || /^-{3,}$/.test(l)) { flush(); continue; }
    if (l.startsWith("|")) { flush(); field(clean(l.slice(1, -1).split("|").map(c => c.trim()).join("  |  ")), 9.5); continue; }
    if (/^([-*+]|\d+\.)\s+/.test(l)) { flush(); field(`- ${clean(l.replace(/^([-*+]|\d+\.)\s+/, ""))}`, 10, 10); continue; }
    if (l.startsWith(">")) { flush(); field(clean(l.replace(/^>\s*/, "")), 9, 0, AMBER_BG); continue; }
    para.push(l);
  }
  flush();
  return new Uint8Array(await doc.save());
}
