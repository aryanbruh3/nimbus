"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { formatBytes } from "@/lib/constants";
import { downloadFile } from "@/lib/download";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { StorageMeter } from "@/components/StorageMeter";
import { EmptyState } from "@/components/EmptyState";
import {
  DownloadIcon,
  StarIcon,
  UploadIcon,
  SpinnerIcon,
  HardDriveIcon,
  FilesIcon,
} from "@/components/icons";

interface DashboardData {
  storageUsed: number;
  storageQuota: number;
  totalFiles: number;
  starredFiles: number;
  typeBreakdown: { type: string; count: number; size: number }[];
  recentFiles: {
    id: string;
    name: string;
    size: number;
    fileType: string;
    starred: boolean;
    uploadedAt: string;
  }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => {
        if (d && !d.error) {
          setData(d);
        }
      })
      .catch((err) => console.error("Error fetching dashboard:", err))
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = useCallback(async (file: { id: string; name: string }) => {
    setDownloadingId(file.id);
    await downloadFile({
      fileId: file.id,
      fileName: file.name,
      onFinish: () => setDownloadingId(null),
    });
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400 gap-3">
        <SpinnerIcon size={28} className="text-blue-600" />
        <span className="text-sm font-medium text-slate-500">
          Loading dashboard overview...
        </span>
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        title="Could not load dashboard"
        description="Unable to connect to your cloud storage data. Please refresh or check your connection."
        action={{
          label: "Retry",
          onClick: () => window.location.reload(),
        }}
      />
    );
  }

  const { storageUsed, storageQuota, totalFiles, starredFiles, typeBreakdown, recentFiles } = data;
  const usagePercent =
    storageQuota > 0
      ? Math.min(Math.round((storageUsed / storageQuota) * 100), 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200/80">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Storage Dashboard
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Overview of your cloud quota, file distribution, and recent activity
          </p>
        </div>
        <Link
          href="/files"
          className="self-start sm:self-auto inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          <UploadIcon size={16} />
          <span>Upload Files</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Files Card */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Total Files
            </span>
            <FilesIcon size={18} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">{totalFiles}</div>
          <p className="text-xs text-slate-500 mt-1">
            Stored in personal vault
          </p>
        </div>

        {/* Starred Files Card */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Starred Files
            </span>
            <StarIcon size={18} className="text-amber-500" filled />
          </div>
          <div className="text-2xl font-bold text-slate-900">{starredFiles}</div>
          <p className="text-xs text-slate-500 mt-1">
            Pinned for quick access
          </p>
        </div>

        {/* Storage Quota Card */}
        <div className="p-4 bg-white border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">
              Storage Used
            </span>
            <HardDriveIcon size={18} className="text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-slate-900">
            {formatBytes(storageUsed)}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {usagePercent}% of {formatBytes(storageQuota)} capacity
          </p>
        </div>
      </div>

      {/* Storage Breakdown Visualization */}
      <StorageMeter usedBytes={storageUsed} quotaBytes={storageQuota} />

      {/* Split Row: Type Breakdown & Recent Files */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* File Types Summary */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Files by Category
            </h2>
            <span className="text-xs text-slate-400">
              {typeBreakdown.length} categor{typeBreakdown.length === 1 ? "y" : "ies"}
            </span>
          </div>

          {typeBreakdown.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {typeBreakdown
                .sort((a, b) => b.size - a.size)
                .map((cat) => (
                  <div
                    key={cat.type}
                    className="py-2.5 flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5">
                      <FileTypeIcon type={cat.type} size="sm" />
                      <div>
                        <span className="text-sm font-medium text-slate-800 capitalize">
                          {cat.type}
                        </span>
                        <span className="text-xs text-slate-400 ml-2">
                          ({cat.count} file{cat.count !== 1 ? "s" : ""})
                        </span>
                      </div>
                    </div>
                    <span className="font-mono text-xs text-slate-600 font-medium">
                      {formatBytes(cat.size)}
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No files uploaded yet. Categories will appear as files are added.
            </p>
          )}
        </div>

        {/* Recent Uploads */}
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-700">
              Recent Uploads
            </h2>
            <Link
              href="/files"
              className="text-xs font-medium text-blue-600 hover:text-blue-700"
            >
              View All Files →
            </Link>
          </div>

          {recentFiles.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {recentFiles.map((file) => {
                const isDownloading = downloadingId === file.id;
                return (
                  <div
                    key={file.id}
                    className="py-2.5 flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileTypeIcon type={file.fileType} size="sm" />
                      <div className="min-w-0">
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="text-sm font-medium text-slate-900 truncate hover:text-blue-600 text-left block max-w-[200px] sm:max-w-xs cursor-pointer"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {formatBytes(file.size)}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {file.starred && (
                        <StarIcon size={14} className="text-amber-500" filled />
                      )}
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        disabled={isDownloading}
                        className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                        title="Download file"
                      >
                        {isDownloading ? (
                          <SpinnerIcon size={14} className="text-blue-600" />
                        ) : (
                          <DownloadIcon size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-xs text-slate-500 py-6 text-center">
              No recent uploads. Head to{" "}
              <Link href="/files" className="text-blue-600 underline font-medium">
                All Files
              </Link>{" "}
              to store your first file.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
