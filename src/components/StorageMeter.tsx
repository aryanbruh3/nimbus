import React from "react";
import { formatBytes } from "@/lib/constants";

interface StorageMeterProps {
  usedBytes: number;
  quotaBytes: number;
  compact?: boolean;
  className?: string;
}

export function StorageMeter({
  usedBytes,
  quotaBytes,
  compact = false,
  className = "",
}: StorageMeterProps) {
  const percentage = quotaBytes > 0
    ? Math.min(Math.round((usedBytes / quotaBytes) * 100), 100)
    : 0;

  // Refined status colors based on real quota capacity
  const barColor =
    percentage >= 95
      ? "bg-red-600"
      : percentage >= 80
      ? "bg-amber-500"
      : "bg-blue-600";

  if (compact) {
    return (
      <div className={`space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-600">Storage</span>
          <span className="font-mono text-slate-500">{percentage}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200/80 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${barColor}`}
            style={{ width: `${Math.max(percentage, 2)}%` }}
          />
        </div>
        <div className="flex justify-between items-center text-[11px] font-mono text-slate-500">
          <span>{formatBytes(usedBytes)} used</span>
          <span>{formatBytes(quotaBytes)}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 bg-white border border-slate-200/80 rounded-xl ${className}`}>
      <div className="flex items-center justify-between mb-2.5">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Storage Capacity
          </span>
          <div className="text-lg font-semibold text-slate-900 mt-0.5">
            {formatBytes(usedBytes)}{" "}
            <span className="text-sm font-normal text-slate-500">
              of {formatBytes(quotaBytes)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-mono font-medium bg-slate-100 text-slate-700">
            {percentage}% full
          </span>
        </div>
      </div>

      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>{formatBytes(Math.max(quotaBytes - usedBytes, 0))} available</span>
        <span>5 GB limit</span>
      </div>
    </div>
  );
}
