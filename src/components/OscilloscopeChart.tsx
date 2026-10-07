import React, { useState } from 'react';
import { TelemetryPoint } from '../types/scada';

interface OscilloscopeChartProps {
  data: TelemetryPoint[];
  metricKey: keyof TelemetryPoint;
  label: string;
  unit: string;
  minRange?: number;
  maxRange?: number;
  strokeColor?: string;
}

export const OscilloscopeChart: React.FC<OscilloscopeChartProps> = ({
  data,
  metricKey,
  label,
  unit,
  minRange,
  maxRange,
  strokeColor = '#00d2ff',
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="h-44 flex items-center justify-center bg-[#030509] border border-[#1e293b] text-xs font-mono text-[#859399]">
        Sin datos de serie de tiempo
      </div>
    );
  }

  const values = data.map((d) => (d[metricKey] as number) ?? 0);
  const minVal = minRange !== undefined ? minRange : Math.min(...values) * 0.95;
  const maxVal = maxRange !== undefined ? maxRange : Math.max(...values) * 1.05;
  const range = maxVal - minVal || 1;

  const width = 640;
  const height = 180;
  const padding = { top: 20, right: 30, bottom: 25, left: 55 };

  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  // Calculate coordinates
  const points = data.map((d, index) => {
    const val = (d[metricKey] as number) ?? 0;
    const x = padding.left + (index / (data.length - 1)) * chartWidth;
    const y = padding.top + chartHeight - ((val - minVal) / range) * chartHeight;
    return { x, y, val, time: d.timestamp };
  });

  const pathD = points.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`;

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="w-full bg-[#030509] border border-[#1e293b] p-3 font-mono">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-none" style={{ backgroundColor: strokeColor }} />
          <span className="text-xs font-semibold text-white uppercase tracking-wider">{label}</span>
          <span className="text-[10px] text-[#859399]">STREAM 30-PUNTOS</span>
        </div>
        <div className="text-right">
          {hoveredPoint ? (
            <span className="text-xs text-[#00d2ff] font-semibold tabular-nums">
              {hoveredPoint.val.toFixed(1)} {unit}
              <span className="text-[#859399] ml-2 font-normal text-[10px]">[{hoveredPoint.time}]</span>
            </span>
          ) : (
            <span className="text-xs text-white font-semibold tabular-nums">
              {(data[data.length - 1][metricKey] as number)?.toFixed(1)} {unit}
            </span>
          )}
        </div>
      </div>

      <div className="relative w-full aspect-[640/180]">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-full overflow-visible"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id={`grad-${metricKey}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={strokeColor} stopOpacity="0.25" />
              <stop offset="100%" stopColor={strokeColor} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = padding.top + chartHeight * ratio;
            const gridVal = maxVal - ratio * range;
            return (
              <g key={ratio}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="#151d2d"
                  strokeWidth="1"
                  strokeDasharray="2 2"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="#5b6a71"
                  fontSize="9"
                  fontFamily="JetBrains Mono"
                  className="tabular-nums"
                >
                  {gridVal.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* Area fill */}
          <path d={areaD} fill={`url(#grad-${metricKey})`} />

          {/* Line stroke */}
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data point dots & hover regions */}
          {points.map((pt, idx) => (
            <g key={idx}>
              <circle
                cx={pt.x}
                cy={pt.y}
                r={hoveredIndex === idx ? '4' : '2'}
                fill={hoveredIndex === idx ? '#ffffff' : strokeColor}
                stroke="#030509"
                strokeWidth="1"
              />
              {/* Invisible touch/hover trigger hitboxes */}
              <rect
                x={pt.x - 10}
                y={padding.top}
                width={20}
                height={chartHeight}
                fill="transparent"
                className="cursor-crosshair"
                onMouseEnter={() => setHoveredIndex(idx)}
              />
            </g>
          ))}

          {/* Vertical Crosshair Guide */}
          {hoveredPoint && (
            <line
              x1={hoveredPoint.x}
              y1={padding.top}
              x2={hoveredPoint.x}
              y2={padding.top + chartHeight}
              stroke="#00d2ff"
              strokeWidth="1"
              strokeDasharray="3 3"
            />
          )}
        </svg>
      </div>

      <div className="flex justify-between items-center text-[9px] text-[#5b6a71] mt-1 pt-1 border-t border-[#151d2d]">
        <span>T -25 min</span>
        <span>MUESTREO: 2s INTERPOLADO</span>
        <span>TIEMPO REAL (T0)</span>
      </div>
    </div>
  );
};
