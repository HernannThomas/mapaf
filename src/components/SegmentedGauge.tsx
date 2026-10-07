import React from 'react';

interface SegmentedGaugeProps {
  value: number;
  min: number;
  max: number;
  segmentsCount?: number;
  label?: string;
  unit: string;
  showNumeric?: boolean;
}

export const SegmentedGauge: React.FC<SegmentedGaugeProps> = ({
  value,
  min,
  max,
  segmentsCount = 16,
  label,
  unit,
  showNumeric = true,
}) => {
  const normalized = Math.min(Math.max((value - min) / (max - min), 0), 1);
  const activeSegments = Math.round(normalized * segmentsCount);
  const percentage = Math.round(normalized * 100);

  // Status color calculation
  const getSegmentColor = (index: number) => {
    const segmentRatio = index / segmentsCount;
    if (segmentRatio >= 0.88) {
      return 'bg-[#ef4444] glow-crimson animate-pulse';
    } else if (segmentRatio >= 0.7) {
      return 'bg-[#f59e0b]';
    } else {
      return 'bg-[#00d2ff]';
    }
  };

  return (
    <div className="w-full">
      {(label || showNumeric) && (
        <div className="flex items-center justify-between text-xs font-mono mb-1.5">
          {label && <span className="text-[#859399] tracking-wider uppercase">{label}</span>}
          {showNumeric && (
            <span className="tabular-nums text-white font-semibold">
              {value.toLocaleString('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
              <span className="text-[#859399] font-normal text-[10px] ml-1">{unit}</span>
            </span>
          )}
        </div>
      )}

      {/* Segmented meter blocks */}
      <div className="flex items-center gap-[2px] bg-[#030509] p-1 border border-[#0f172a]">
        {Array.from({ length: segmentsCount }).map((_, i) => {
          const isActive = i < activeSegments;
          return (
            <div
              key={i}
              className={`h-2.5 flex-1 transition-all duration-300 ${
                isActive ? getSegmentColor(i) : 'bg-[#181c24]'
              }`}
            />
          );
        })}
      </div>

      <div className="flex justify-between items-center text-[9px] font-mono text-[#5b6a71] mt-1">
        <span>{min} {unit}</span>
        <span className="tabular-nums">{percentage}%</span>
        <span>{max} {unit}</span>
      </div>
    </div>
  );
};
