import { useEffect, useState } from "react";

interface ConsultationProgressProps {
  /** Optional label shown under the tooth */
  label?: string;
  /** Optional sub-label */
  hint?: string;
}

/**
 * Tooth-shaped progress indicator for AI consultation generation.
 * Asymptotic curve: never reaches 100% until the parent unmounts it
 * (i.e. when the consultation is actually ready). Slows down over time
 * so the user perceives steady progress even past 2 minutes.
 *
 * Curve: pct(t) = (1 - exp(-t / τ)) * 99
 *   τ = 45s  →  ~73% at 60s, ~93% at 120s, ~98% at 180s
 */
export default function ConsultationProgress({
  label = "Generazione consulenza in corso…",
  hint = "Tempo medio: circa 1–2 minuti",
}: ConsultationProgressProps) {
  const [pct, setPct] = useState(2);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const id = window.setInterval(() => {
      const t = (Date.now() - start) / 1000;
      const value = (1 - Math.exp(-t / 45)) * 99;
      setPct(Math.max(2, value));
      setElapsed(t);
    }, 200);
    return () => window.clearInterval(id);
  }, []);

  const fillY = 100 - pct; // SVG fill rises from bottom to top
  const mm = Math.floor(elapsed / 60);
  const ss = Math.floor(elapsed % 60);
  const timeLabel = `${mm}:${ss.toString().padStart(2, "0")}`;

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-10 px-4 bg-card border border-border rounded-xl">
      <div className="relative w-28 h-32">
        <svg
          viewBox="0 0 100 110"
          className="w-full h-full drop-shadow-sm"
          aria-hidden="true"
        >
          <defs>
            {/* Tooth silhouette as a clip-path so the fill stays inside */}
            <clipPath id="tooth-clip">
              <path d="M50 4 C30 4 14 14 14 34 C14 48 18 58 22 70 C25 80 28 96 34 104 C38 109 44 108 46 100 L48 80 C49 73 51 73 52 80 L54 100 C56 108 62 109 66 104 C72 96 75 80 78 70 C82 58 86 48 86 34 C86 14 70 4 50 4 Z" />
            </clipPath>
            <linearGradient id="tooth-fill" x1="0" y1="1" x2="0" y2="0">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.95" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* Tooth outline (empty background) */}
          <path
            d="M50 4 C30 4 14 14 14 34 C14 48 18 58 22 70 C25 80 28 96 34 104 C38 109 44 108 46 100 L48 80 C49 73 51 73 52 80 L54 100 C56 108 62 109 66 104 C72 96 75 80 78 70 C82 58 86 48 86 34 C86 14 70 4 50 4 Z"
            fill="hsl(var(--muted))"
            stroke="hsl(var(--border))"
            strokeWidth="1.5"
          />

          {/* Animated fill clipped inside the tooth */}
          <g clipPath="url(#tooth-clip)">
            <rect
              x="0"
              y={fillY}
              width="100"
              height={pct + 5}
              fill="url(#tooth-fill)"
              style={{ transition: "y 600ms ease-out, height 600ms ease-out" }}
            />
            {/* "water" wave on top of the fill */}
            <path
              d={`M0 ${fillY} Q 25 ${fillY - 2}, 50 ${fillY} T 100 ${fillY} L 100 ${fillY + 6} L 0 ${fillY + 6} Z`}
              fill="hsl(var(--primary))"
              opacity="0.35"
              style={{ transition: "d 600ms ease-out" }}
            >
              <animateTransform
                attributeName="transform"
                type="translate"
                values="0 0; 6 0; 0 0; -6 0; 0 0"
                dur="3s"
                repeatCount="indefinite"
              />
            </path>
          </g>

          {/* Subtle highlight */}
          <path
            d="M30 18 C 36 12, 48 10, 54 14"
            stroke="hsl(var(--background))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </svg>

        {/* Centered percentage */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-display text-lg font-bold text-foreground drop-shadow-[0_1px_1px_rgba(255,255,255,0.6)]">
            {Math.floor(pct)}%
          </span>
        </div>
      </div>

      <div className="flex flex-col items-center gap-1">
        <p className="font-body text-sm text-foreground font-medium">{label}</p>
        <p className="font-body text-xs text-muted-foreground">
          {hint} · trascorsi {timeLabel}
        </p>
      </div>
    </div>
  );
}
