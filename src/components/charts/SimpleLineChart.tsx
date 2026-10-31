import React, { useState } from 'react';

export interface ChartDataPoint {
  date: string;
  value: number;
  secondaryValue?: number;
}

interface Props {
  data: ChartDataPoint[];
  title?: string;
  valuePrefix?: string;
  valueSuffix?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  height?: number;
}

export const SimpleLineChart: React.FC<Props> = ({
  data,
  title,
  valuePrefix = '',
  valueSuffix = '',
  primaryLabel = 'Price',
  secondaryLabel,
  height = 240
}) => {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-aurum-card/40 rounded-xl border border-aurum-border text-slate-400 text-sm">
        No historical chart points available.
      </div>
    );
  }

  const values = data.map(d => d.value);
  const minVal = Math.min(...values);
  const maxVal = Math.max(...values);
  const range = maxVal - minVal || 1;
  const padding = range * 0.08;
  const yMin = Math.max(0, minVal - padding);
  const yMax = maxVal + padding;
  const yRange = yMax - yMin;

  const width = 600;
  const plotH = height - 40;
  const topPad = 15;
  const bottomPad = 25;

  const getX = (idx: number) => (idx / (data.length - 1 || 1)) * (width - 40) + 20;
  const getY = (val: number) => plotH - ((val - yMin) / yRange) * (plotH - topPad) + topPad;

  // Generate SVG path for primary line
  const points = data.map((d, i) => `${getX(i)},${getY(d.value)}`);
  const pathD = `M ${points.join(' L ')}`;

  // Area under path
  const areaD = `${pathD} L ${getX(data.length - 1)},${plotH + bottomPad} L ${getX(0)},${plotH + bottomPad} Z`;

  // Secondary line (e.g. Moving Average) if available
  const hasSecondary = data.some(d => d.secondaryValue !== undefined);
  let secPathD = '';
  if (hasSecondary) {
    const secPoints = data
      .map((d, i) => d.secondaryValue !== undefined ? `${getX(i)},${getY(d.secondaryValue)}` : null)
      .filter(Boolean);
    if (secPoints.length > 0) {
      secPathD = `M ${secPoints.join(' L ')}`;
    }
  }

  const hoveredPoint = hoveredIdx !== null ? data[hoveredIdx] : data[data.length - 1];

  return (
    <div className="w-full bg-aurum-card/50 border border-aurum-border rounded-xl p-4">
      <div className="flex items-center justify-between mb-3 text-xs">
        <div>
          {title && <span className="font-semibold text-slate-200 uppercase tracking-wider">{title}</span>}
          {hoveredPoint && (
            <div className="text-aurum-gold font-mono font-medium text-sm mt-0.5">
              {valuePrefix}{hoveredPoint.value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{valueSuffix}
              <span className="text-slate-400 text-xs font-sans ml-2">({hoveredPoint.date})</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-aurum-gold inline-block" />
            {primaryLabel}
          </span>
          {hasSecondary && (
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-0.5 bg-sky-400 border-dashed inline-block" />
              {secondaryLabel || 'SMA'}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIdx(null)}
        >
          <defs>
            <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#D4AF37" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Grid lines */}
          {[0, 0.33, 0.66, 1].map((pct, i) => {
            const y = plotH - pct * (plotH - topPad) + topPad;
            const gridVal = yMin + pct * yRange;
            return (
              <g key={i}>
                <line x1="20" y1={y} x2={width - 20} y2={y} stroke="#233052" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x="24" y={y - 4} fill="#64748B" fontSize="9" fontFamily="monospace">
                  {valuePrefix}{Math.round(gridVal).toLocaleString()}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path d={areaD} fill="url(#goldGradient)" />

          {/* Primary Line */}
          <path d={pathD} fill="none" stroke="#D4AF37" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />

          {/* Secondary Line */}
          {secPathD && (
            <path d={secPathD} fill="none" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="4 3" strokeLinecap="round" />
          )}

          {/* Hover Crosshair & Dot */}
          {hoveredIdx !== null && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={topPad}
                x2={getX(hoveredIdx)}
                y2={plotH + bottomPad}
                stroke="#94A3B8"
                strokeWidth="1"
                strokeDasharray="2 2"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(data[hoveredIdx].value)}
                r="4.5"
                fill="#D4AF37"
                stroke="#0B1120"
                strokeWidth="2"
              />
            </g>
          )}

          {/* Interactive touch/hover overlay */}
          {data.map((_, idx) => {
            const x = getX(idx);
            const stepW = (width - 40) / data.length;
            return (
              <rect
                key={idx}
                x={x - stepW / 2}
                y={0}
                width={stepW}
                height={height}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIdx(idx)}
                onTouchStart={() => setHoveredIdx(idx)}
              />
            );
          })}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono mt-1 px-1">
        <span>{data[0]?.date}</span>
        <span>{data[Math.floor(data.length / 2)]?.date}</span>
        <span>{data[data.length - 1]?.date}</span>
      </div>
    </div>
  );
};

