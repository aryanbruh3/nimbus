import React from "react";

interface FileTypeIconProps {
  type: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function FileTypeIcon({ type, size = "md", className = "" }: FileTypeIconProps) {
  const normType = type?.toLowerCase() || "other";

  const sizeClasses = {
    sm: "w-7 h-7 text-xs rounded",
    md: "w-9 h-9 text-xs rounded-md",
    lg: "w-11 h-11 text-sm rounded-lg",
  }[size];

  // Restrained, professional SaaS color badges
  const styleConfig: Record<string, { label: string; bg: string; text: string; border: string }> = {
    pdf: { label: "PDF", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" },
    image: { label: "IMG", bg: "bg-amber-50", text: "text-amber-800", border: "border-amber-200" },
    doc: { label: "DOC", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" },
    archive: { label: "ZIP", bg: "bg-purple-50", text: "text-purple-700", border: "border-purple-200" },
    code: { label: "DEV", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
    video: { label: "VID", bg: "bg-indigo-50", text: "text-indigo-700", border: "border-indigo-200" },
    audio: { label: "AUD", bg: "bg-pink-50", text: "text-pink-700", border: "border-pink-200" },
    other: { label: "FILE", bg: "bg-slate-100", text: "text-slate-700", border: "border-slate-200" },
  };

  const config = styleConfig[normType] || styleConfig.other;

  return (
    <div
      className={`inline-flex items-center justify-center font-mono font-medium tracking-wide uppercase border shrink-0 ${sizeClasses} ${config.bg} ${config.text} ${config.border} ${className}`}
      title={config.label}
    >
      {config.label}
    </div>
  );
}
