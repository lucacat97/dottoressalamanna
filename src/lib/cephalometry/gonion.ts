type P = { x: number; y: number };

/**
 * Gonion costruito (vertice dell'angolo mandibolare, metodo di Jarabak):
 * 1) tangente al bordo inferiore della mandibola: retta da Me ruotata finché sopra c'è osso chiaro e sotto tessuto scuro;
 * 2) tangente al bordo posteriore del ramo: retta da Ar ruotata finché davanti c'è osso chiaro e dietro tessuto scuro
 *    (partendo dalla direzione Ar → Go del modello); i due passaggi vengono ripetuti per affinarsi a vicenda;
 * 3) dall'incrocio delle tangenti si entra lungo la bisettrice per un breve tratto (max 6% di Ar–Me) fino al contorno osseo.
 * `gray` è l'immagine in scala di grigi (già sfocata), larghezza w e altezza h, nelle stesse coordinate dei punti.
 */
export function constructGonion(gray: ArrayLike<number>, w: number, h: number, Ar: P, Go: P, Me: P): P | null {
  const sub = (a: P, b: P) => ({ x: a.x - b.x, y: a.y - b.y });
  const len = (a: P) => Math.hypot(a.x, a.y);
  const norm = (a: P) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
  const rot = (v: P, deg: number) => { const a = deg * Math.PI / 180; return { x: Math.cos(a) * v.x - Math.sin(a) * v.y, y: Math.sin(a) * v.x + Math.cos(a) * v.y }; };
  const at = (p: P) => gray[Math.min(h - 1, Math.max(0, Math.round(p.y))) * w + Math.min(w - 1, Math.max(0, Math.round(p.x)))];
  const scale = len(sub(Me, Ar));
  if (!scale || !len(sub(Go, Ar)) || !len(sub(Go, Me))) return null;
  const off = scale * 0.015;
  const isect = (P1: P, d1: P, P2: P, d2: P) => {
    const det = d1.x * -d2.y + d2.x * d1.y; if (Math.abs(det) < 1e-9) return null;
    const qx = P2.x - P1.x, qy = P2.y - P1.y, t = (qx * -d2.y + d2.x * qy) / det;
    return { x: P1.x + t * d1.x, y: P1.y + t * d1.y };
  };
  /** Contrasto lungo la retta P0→X: lato "toward" (osso) meno lato opposto. */
  const edge = (P0: P, d: P, X: P, toward: P, t0: number, t1: number) => {
    const L = len(sub(X, P0)); let n = { x: -d.y, y: d.x };
    if (n.x * toward.x + n.y * toward.y < 0) n = { x: -n.x, y: -n.y };
    let s = 0;
    for (let i = 0; i < 40; i++) {
      const t = t0 + (t1 - t0) * i / 39, p = { x: P0.x + d.x * L * t, y: P0.y + d.y * L * t };
      s += at({ x: p.x + n.x * off, y: p.y + n.y * off }) - at({ x: p.x - n.x * off, y: p.y - n.y * off });
    }
    return s;
  };
  const d1Start = norm(sub(Go, Ar)), eStart = norm(sub(Go, Me));
  let d1 = d1Start, e = eStart;
  for (let it = 0; it < 3; it++) {
    let best: { s: number; v: P } | null = null;
    for (let deg = -20; deg <= 20; deg += 0.5) {
      const v = rot(eStart, deg), X = isect(Ar, d1, Me, v); if (!X) continue;
      const s = edge(Me, v, X, norm(sub(Ar, X)), 0.45, 0.9);
      if (!best || s > best.s) best = { s, v };
    }
    if (!best) return null; e = best.v; best = null;
    for (let deg = -12; deg <= 12; deg += 0.5) {
      const v = rot(d1Start, deg), X = isect(Ar, v, Me, e); if (!X) continue;
      const s = edge(Ar, v, X, norm(sub(Me, X)), 0.5, 0.92);
      if (!best || s > best.s) best = { s, v };
    }
    if (!best) return null; d1 = best.v;
  }
  const X = isect(Ar, d1, Me, e); if (!X) return null;
  const toMe = norm(sub(Me, X)), toAr = norm(sub(Ar, X)), b = norm({ x: toAr.x + toMe.x, y: toAr.y + toMe.y });
  const steps = Math.max(5, Math.round(scale * 0.06)), prof: number[] = [];
  for (let t = -3; t < steps; t++) prof.push(at({ x: X.x + b.x * t, y: X.y + b.y * t }));
  const sm = prof.map((_, i) => { let s = 0, c = 0; for (let k = i - 2; k <= i + 2; k++) if (k >= 0 && k < prof.length) { s += prof[k]; c++; } return s / c; });
  let k = 0, g = -Infinity;
  for (let i = 0; i < sm.length - 1; i++) if (sm[i + 1] - sm[i] > g) { g = sm[i + 1] - sm[i]; k = i; }
  const G = { x: X.x + b.x * (k - 3), y: X.y + b.y * (k - 3) };
  return G.x >= 0 && G.y >= 0 && G.x < w && G.y < h ? G : null;
}

/** Scala di grigi + sfocatura a box (raggio r, due passate) calcolate a mano: stesso risultato in tutti i browser, Safari incluso. */
export function grayBlur(rgba: ArrayLike<number>, w: number, h: number, r = 2) {
  let a = new Float32Array(w * h);
  for (let i = 0; i < a.length; i++) a[i] = 0.299 * rgba[i * 4] + 0.587 * rgba[i * 4 + 1] + 0.114 * rgba[i * 4 + 2];
  for (let pass = 0; pass < 2; pass++) {
    const t = new Float32Array(w * h), o = new Float32Array(w * h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let k = Math.max(0, x - r); k <= Math.min(w - 1, x + r); k++) { s += a[y * w + k]; c++; } t[y * w + x] = s / c; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0; for (let k = Math.max(0, y - r); k <= Math.min(h - 1, y + r); k++) { s += t[k * w + x]; c++; } o[y * w + x] = s / c; }
    a = o;
  }
  return a;
}
