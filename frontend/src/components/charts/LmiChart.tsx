'use client';

import { useMemo, useState } from 'react';

export interface LmiPoint {
  label: string;
  /** Sort key such as 2025.2 for Q2 2025. */
  key: number;
  value: number | null;
  sourceUrl?: string | null;
}

const W = 760;
const H = 300;
const PAD = { top: 20, right: 20, bottom: 44, left: 44 };

/**
 * Ghana LMI headline values over time. Only stored values are plotted; quarters without a
 * published value leave a gap rather than being interpolated. Hover or focus a point for details;
 * the accompanying table is the accessible view of the same data.
 */
export function LmiChart({ points }: { points: LmiPoint[] }) {
  const [active, setActive] = useState<number | null>(null);
  const sorted = useMemo(() => [...points].sort((a, b) => a.key - b.key), [points]);
  const values = sorted.map((p) => p.value).filter((v): v is number => v != null);
  if (values.length < 2) return null;

  const min = Math.min(40, Math.floor(Math.min(...values) / 5) * 5);
  const max = Math.max(75, Math.ceil(Math.max(...values) / 5) * 5);
  const plotW = W - PAD.left - PAD.right;
  const plotH = H - PAD.top - PAD.bottom;
  // Position by time (quarter index), not by list position, so missing quarters keep their space.
  const qIndex = (p: LmiPoint) => Math.round(Math.floor(p.key) * 4 + ((p.key % 1) * 10 || 1) - 1);
  const first = qIndex(sorted[0]);
  const span = Math.max(1, qIndex(sorted[sorted.length - 1]) - first);
  const x = (i: number) => PAD.left + ((qIndex(sorted[i]) - first) / span) * plotW;
  const y = (v: number) => PAD.top + (1 - (v - min) / (max - min)) * plotH;
  const ticks: number[] = [];
  for (let t = min; t <= max; t += 5) ticks.push(t);

  // Split into contiguous segments so missing quarters show as gaps.
  const segments: string[] = [];
  let current: string[] = [];
  sorted.forEach((p, i) => {
    const skipsQuarter = i > 0 && qIndex(p) - qIndex(sorted[i - 1]) > 1;
    if (p.value == null || skipsQuarter) {
      if (current.length) segments.push(current.join(' '));
      current = [];
    }
    if (p.value != null) current.push(`${current.length ? 'L' : 'M'}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`);
  });
  if (current.length) segments.push(current.join(' '));

  const activePoint = active != null ? sorted[active] : null;

  return (
    <figure className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Line chart of the Ghana Logistics Managers Index by quarter. The data is listed in the table below.">
        {/* Grid & axis (recessive) */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="#e4e9f1" strokeWidth={1} />
            <text x={PAD.left - 8} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={12} fill="#566178">
              {t}
            </text>
          </g>
        ))}
        {/* Growth threshold */}
        {min <= 50 && max >= 50 && (
          <g>
            <line x1={PAD.left} x2={W - PAD.right} y1={y(50)} y2={y(50)} stroke="#566178" strokeWidth={1.5} strokeDasharray="6 5" />
            <text x={W - PAD.right} y={y(50) - 6} textAnchor="end" fontSize={12} fill="#2a3247">
              50 = no change
            </text>
          </g>
        )}
        {sorted.map((p, i) => {
          const isLast = i === sorted.length - 1;
          if (!(i % Math.ceil(sorted.length / 7) === 0 || isLast)) return null;
          // Skip a label that would collide with the always-shown last label.
          if (!isLast && x(sorted.length - 1) - x(i) < 60) return null;
          return (
            <text key={p.key} x={x(i)} y={H - PAD.bottom + 20} textAnchor={isLast ? 'end' : i === 0 ? 'start' : 'middle'} fontSize={12} fill="#566178">
              {p.label}
            </text>
          );
        })}
        {segments.map((d, i) => (
          <path key={i} d={d} fill="none" stroke="#0f3b8f" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
        ))}
        {activePoint && activePoint.value != null && (
          <line x1={x(active!)} x2={x(active!)} y1={PAD.top} y2={H - PAD.bottom} stroke="#87a5dc" strokeWidth={1} />
        )}
        {sorted.map((p, i) =>
          p.value == null ? null : (
            <g key={p.key}>
              {/* Generous invisible hit target */}
              <circle
                cx={x(i)}
                cy={y(p.value)}
                r={14}
                fill="transparent"
                tabIndex={0}
                role="img"
                aria-label={`${p.label}: ${p.value.toFixed(1)}`}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className="cursor-pointer outline-none"
              />
              <circle cx={x(i)} cy={y(p.value)} r={active === i ? 6 : 4.5} fill="#0f3b8f" stroke="#ffffff" strokeWidth={2} pointerEvents="none" />
            </g>
          ),
        )}
        {/* Direct label on the latest value only */}
        {(() => {
          const lastIdx = sorted.map((p) => p.value).lastIndexOf(values[values.length - 1]);
          const last = sorted[lastIdx];
          return last?.value != null ? (
            <text x={x(lastIdx) - 10} y={y(last.value) + 18} textAnchor="end" fontSize={13} fontWeight={600} fill="#16163f">
              {last.value.toFixed(1)}
            </text>
          ) : null;
        })()}
      </svg>
      {activePoint && activePoint.value != null && (
        <div
          className="pointer-events-none absolute rounded border border-line bg-white px-3 py-2 text-sm shadow-(--shadow-raised)"
          style={{ left: `${(x(active!) / W) * 100}%`, top: `${(y(activePoint.value) / H) * 100}%`, transform: 'translate(-50%, calc(-100% - 14px))' }}
          role="status"
        >
          <p className="font-semibold text-ink">{activePoint.label}</p>
          <p className="text-body">LMI {activePoint.value.toFixed(1)}</p>
        </div>
      )}
      <figcaption className="meta mt-2">
        Headline index values as stated in CARISCA’s quarterly releases. Gaps mark quarters whose value has not been entered.
      </figcaption>
    </figure>
  );
}
