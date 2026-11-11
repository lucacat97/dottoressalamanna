import * as ort from "onnxruntime-web/wasm";
import { MODEL_URL, INPUT_SIZE, CHANNELS, toTensor, decodeHeatmaps } from "./landmark-model";

ort.env.wasm.wasmPaths = "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.23.2/dist/";
ort.env.wasm.numThreads = 1;
let session: Promise<ort.InferenceSession> | null = null;

async function modelBytes() {
  const cache = typeof caches !== "undefined" ? await caches.open("mila-ceph-model-v1").catch(() => null) : null;
  let response = await cache?.match(MODEL_URL);
  if (!response) {
    response = await fetch(MODEL_URL);
    if (!response.ok) throw new Error("Modello di riconoscimento non scaricabile");
    await cache?.put(MODEL_URL, response.clone()).catch(() => undefined);
  }
  return new Uint8Array(await response.arrayBuffer());
}

self.onmessage = async (event: MessageEvent<{ rgba: Uint8ClampedArray }>) => {
  try {
    session ??= modelBytes().then(bytes => ort.InferenceSession.create(bytes, { executionProviders: ["wasm"] }));
    const s = await session;
    const input = new ort.Tensor("float32", toTensor(event.data.rgba), [1, 3, INPUT_SIZE, INPUT_SIZE]);
    const out = (await s.run({ [s.inputNames[0]]: input }))[s.outputNames[0]];
    const [, n, h, w] = out.dims as number[];
    if (n !== CHANNELS.length) throw new Error("Uscita del modello inattesa");
    self.postMessage({ cells: decodeHeatmaps(out.data as Float32Array, n, h, w) });
  } catch (e) {
    session = null;
    self.postMessage({ error: e instanceof Error ? e.message : "Riconoscimento non riuscito" });
  }
};
