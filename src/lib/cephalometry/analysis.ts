import { z } from "zod";
import { LANDMARKS } from "./geometry";

const point = z.object({ x: z.number().finite().nonnegative(), y: z.number().finite().nonnegative() });
export const analysisSchema = z.object({
  version: z.literal(1),
  image: z.string().max(40_000_000).regex(/^data:image\/(png|jpeg);base64,[A-Za-z0-9+/=]+$/),
  width: z.number().int().positive().max(10000), height: z.number().int().positive().max(10000),
  points: z.record(z.enum(LANDMARKS), point),
  calibration: z.number().finite().positive().max(10000).nullable(),
  age: z.string().max(5), sex: z.enum(["M", "F"]),
  report: z.string().max(200000), reportSignature: z.string().max(10000),
}).superRefine((value, ctx) => {
  for (const p of Object.values(value.points)) {
    if (p.x > value.width || p.y > value.height) ctx.addIssue({ code: "custom", message: "Punto esterno all’immagine" });
  }
});
export type Analysis = z.infer<typeof analysisSchema>;

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

/** No generic vision/LLM fallback: connect only a clinically evaluated dedicated model. */
export const LANDMARK_MODEL_STATUS = "not_trained" as const;

export async function readMilaStream(body: ReadableStream<Uint8Array>) {
  const reader = body.getReader(), decoder = new TextDecoder();
  let buffer = "", output = "";
  const consume = (line: string) => {
    if (!line.startsWith("data:")) return;
    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") return;
    const event = JSON.parse(raw);
    if (event.error) throw new Error(typeof event.error === "string" ? event.error : "Generazione interrotta");
    output += event.choices?.[0]?.delta?.content ?? "";
  };
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
      lines.forEach(consume);
    }
    buffer += decoder.decode();
    if (buffer.trim()) consume(buffer);
  } finally { reader.releaseLock(); }
  if (!output.trim()) throw new Error("Nessuna consulenza ricevuta");
  return output;
}