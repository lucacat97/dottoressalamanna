type P = { x: number; y: number };

/**
 * Gonion costruito (vertice dell'angolo mandibolare, metodo di Jarabak):
 * 1) tangente al bordo posteriore del ramo: retta Ar → Go proposto dal modello;
 * 2) tangente al bordo inferiore della mandibola: retta da Me ruotata finché sopra c'è osso chiaro e sotto tessuto scuro;
 * 3) dall'incrocio delle due tangenti si scende lungo la bisettrice fino al contorno osseo.
 * `gray` è l'immagine in scala di grigi (già sfocata), larghezza w e altezza h, nelle stesse coordinate dei punti.
 */
export function constructGonion(gray: ArrayLike<number>, w: number, h: number, Ar: P, Go: P, Me: P): P | null {
  const sub = (a: P, b: P) => ({ x: a.x - b.x, y: a.y - b.y });
  const len = (a: P) => Math.hypot(a.x, a.y);
  const norm = (a: P) => { const l = len(a) || 1; return { x: a.x / l, y: a.y / l }; };
  const at = (p: P) => gray[Math.min(h - 1, Math.max(0, Math.round(p.y))) * w + Math.min(w - 1, Math.max(0, Math.round(p.x)))];
  const scale = len(sub(Me, Ar));
  if (!scale || !len(sub(Go, Ar)) || !len(sub(Go, Me))) return null;
  const d1 = norm(sub(Go, Ar)), base = norm(sub(Go, Me)), off = scale * 0.015;
  const isect = (e: P) => {
    const det = d1.x * -e.y - -e.x * d1.y; if (Math.abs(det) < 1e-9) return null;
    const qx = Me.x - Ar.x, qy = Me.y - Ar.y, t = (qx * -e.y - -e.x * qy) / det;
    return { x: Ar.x + t * d1.x, y: Ar.y + t * d1.y };
  };
  let best: { score: number; X: P } | null = null;
  for (let deg = -20; deg <= 20; deg += 0.5) {
    const a = deg * Math.PI / 180, e = { x: Math.cos(a) * base.x - Math.sin(a) * base.y, y: Math.sin(a) * base.x + Math.cos(a) * base.y };
    const X = isect(e); if (!X) continue;
    const L = len(sub(X, Me)); let n = { x: -e.y, y: e.x }; if (n.y > 0) n = { x: -n.x, y: -n.y };
    let score = 0;
    for (let i = 0; i < 40; i++) {
      const t = 0.45 + 0.45 * i / 39, p = { x: Me.x + e.x * L * t, y: Me.y + e.y * L * t };
      score += at({ x: p.x + n.x * off, y: p.y + n.y * off }) - at({ x: p.x - n.x * off, y: p.y - n.y * off });
    }
    if (!best || score > best.score) best = { score, X };
  }
  if (!best) return null;
  const X = best.X, toMe = norm(sub(Me, X)), b = norm({ x: -d1.x + toMe.x, y: -d1.y + toMe.y });
  const steps = Math.max(5, Math.round(scale * 0.15)), prof: number[] = [];
  for (let t = 0; t < steps; t++) prof.push(at({ x: X.x + b.x * t, y: X.y + b.y * t }));
  const sm = prof.map((_, i) => { let s = 0, c = 0; for (let k = i - 2; k <= i + 2; k++) if (k >= 0 && k < prof.length) { s += prof[k]; c++; } return s / c; });
  let k = 0, g = -Infinity;
  for (let i = 0; i < sm.length - 1; i++) if (sm[i + 1] - sm[i] > g) { g = sm[i + 1] - sm[i]; k = i; }
  const G = { x: X.x + b.x * k, y: X.y + b.y * k };
  return G.x >= 0 && G.y >= 0 && G.x < w && G.y < h ? G : null;
}
