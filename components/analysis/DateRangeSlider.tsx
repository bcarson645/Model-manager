"use client";

import {
  clampDateRange,
  dateToSliderValue,
  formatDisplayDate,
  type DateRange,
  type DateRangeBounds,
  DAY_MS,
} from "@/lib/scorecards/date-range";

type DateRangeSliderProps = {
  bounds: DateRangeBounds;
  value: DateRange;
  onChange: (range: DateRange) => void;
  matchCount: number;
  totalCount: number;
};

export function DateRangeSlider({
  bounds,
  value,
  onChange,
  matchCount,
  totalCount,
}: DateRangeSliderProps) {
  const minTs = dateToSliderValue(bounds.min);
  const maxTs = dateToSliderValue(bounds.max);
  const startTs = dateToSliderValue(value.start);
  const endTs = dateToSliderValue(value.end);

  const onStartChange = (ts: number) => {
    onChange(clampDateRange(ts, endTs, bounds));
  };

  const onEndChange = (ts: number) => {
    onChange(clampDateRange(startTs, ts, bounds));
  };

  const startPct = maxTs > minTs ? ((startTs - minTs) / (maxTs - minTs)) * 100 : 0;
  const endPct = maxTs > minTs ? ((endTs - minTs) / (maxTs - minTs)) * 100 : 100;

  return (
    <div className="mt-4 rounded-xl border border-surface-border bg-surface p-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Date range
          </p>
          <p className="mt-1 text-sm text-white">
            {formatDisplayDate(value.start)}
            <span className="mx-2 text-slate-500">→</span>
            {formatDisplayDate(value.end)}
          </p>
        </div>
        <p className="text-xs text-slate-400">
          <span className="font-mono text-slate-200">{matchCount.toLocaleString()}</span>
          {" / "}
          {totalCount.toLocaleString()} matches
        </p>
      </div>

      <div className="relative mt-6 h-8">
        <div className="absolute left-0 right-0 top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-surface-border" />
        <div
          className="absolute top-1/2 h-1.5 -translate-y-1/2 rounded-full bg-emerald-600/60"
          style={{
            left: `${startPct}%`,
            width: `${Math.max(endPct - startPct, 0)}%`,
          }}
        />
        <input
          type="range"
          min={minTs}
          max={maxTs}
          step={DAY_MS}
          value={startTs}
          onChange={(e) => onStartChange(Number(e.target.value))}
          className="date-range-thumb pointer-events-none absolute inset-0 z-20 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
          aria-label="Start date"
        />
        <input
          type="range"
          min={minTs}
          max={maxTs}
          step={DAY_MS}
          value={endTs}
          onChange={(e) => onEndChange(Number(e.target.value))}
          className="date-range-thumb pointer-events-none absolute inset-0 z-30 h-8 w-full appearance-none bg-transparent [&::-webkit-slider-thumb]:pointer-events-auto"
          aria-label="End date"
        />
      </div>

      <div className="mt-2 flex justify-between text-[10px] text-slate-600">
        <span>{formatDisplayDate(bounds.min)}</span>
        <span>{formatDisplayDate(bounds.max)}</span>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={() => onChange({ start: bounds.min, end: bounds.max })}
          className="text-xs text-emerald-400 hover:text-emerald-300"
        >
          Reset to full range
        </button>
      </div>
    </div>
  );
}
