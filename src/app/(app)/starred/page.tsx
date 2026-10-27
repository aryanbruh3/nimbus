"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { formatBytes } from "@/lib/constants";
import { downloadFile } from "@/lib/download";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { EmptyState } from "@/components/EmptyState";
import {
  StarIcon,
  DownloadIcon,
  TrashIcon,
  SearchIcon,
  SpinnerIcon,
} from "@/components/icons";

interface FileItem {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  fileType: string;
  starred: boolean;
  uploadedAt: string;
}

export default function StarredPage() {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadStarredFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        const starred = (data.files || []).filter((f: FileItem) => f.starred);
        startTransition(() => {
          setFiles(starred);
        });
      }
    } catch {
      toast.error("Failed to load starred files");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStarredFiles();
  }, [loadStarredFiles]);

  const handleDownload = useCallback(async (file: FileItem) => {
    setDownloadingId(file.id);
    await downloadFile({
      fileId: file.id,
      fileName: file.name,
      onFinish: () => setDownloadingId(null),
    });
  }, []);

  const handleUnstar = useCallback(async (file: FileItem) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ starred: false }),
      });
      if (res.ok) {
        toast.success(`Removed "${file.name}" from starred`);
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      } else {
        toast.error("Failed to unstar file");
      }
    } catch {
      toast.error("Network error unstarring file");
    }
  }, []);

  const handleDelete = useCallback(async (file: FileItem) => {
    try {
      const res = await fetch(`/api/files/${file.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success(`Deleted "${file.name}"`);
        setFiles((prev) => prev.filter((f) => f.id !== file.id));
      } else {
        toast.error("Failed to delete file");
      }
    } catch {
      toast.error("Network error deleting file");
    }
  }, []);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400 gap-3">
        <SpinnerIcon size={28} className="text-blue-600" />
        <span className="text-sm font-medium text-slate-500">
          Loading starred files...
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Starred Files
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {files.length === 0
              ? "No starred files"
              : `${files.length} favorite file${files.length !== 1 ? "s" : ""} pinned for fast retrieval`}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      {files.length > 0 && (
        <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
          <div className="relative flex-1 max-w-md">
            <SearchIcon
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search starred files..."
              className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
            />
          </div>
          <div className="text-xs font-mono text-slate-500">
            {filteredFiles.length} item{filteredFiles.length !== 1 ? "s" : ""}
          </div>
        </div>
      )}

      {/* Files Display */}
      {filteredFiles.length > 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-4 w-12 text-center">Type</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4 text-right">Uploaded</th>
                  <th className="py-3 px-4 text-right w-36">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.map((file) => {
                  const isDownloading = downloadingId === file.id;
                  return (
                    <tr
                      key={file.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="py-3 px-4 text-center">
                        <FileTypeIcon type={file.fileType} size="sm" />
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <button
                          type="button"
                          onClick={() => handleDownload(file)}
                          className="hover:text-blue-600 hover:underline transition-colors text-left font-medium block truncate max-w-md cursor-pointer"
                          title={file.name}
                        >
                          {file.name}
                        </button>
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                        {formatBytes(file.size)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-xs text-slate-500">
                        {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleDownload(file)}
                            disabled={isDownloading}
                            className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                            title="Download file"
                          >
                            {isDownloading ? (
                              <SpinnerIcon size={16} className="text-blue-600" />
                            ) : (
                              <DownloadIcon size={16} />
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleUnstar(file)}
                            className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                            title="Unstar file"
                          >
                            <StarIcon size={16} filled />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(file)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            title="Delete file"
                          >
                            <TrashIcon size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredFiles.map((file) => {
              const isDownloading = downloadingId === file.id;
              return (
                <div key={file.id} className="p-3.5 space-y-2">
                  <div className="flex items-center gap-3">
                    <FileTypeIcon type={file.fileType} size="md" />
                    <div className="flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(file)}
                        className="text-sm font-medium text-slate-900 truncate hover:text-blue-600 text-left block w-full cursor-pointer"
                      >
                        {file.name}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-400 font-mono">
                        <span>{formatBytes(file.size)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-50">
                    <button
                      type="button"
                      onClick={() => handleDownload(file)}
                      disabled={isDownloading}
                      className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md inline-flex items-center gap-1 cursor-pointer"
                    >
                      {isDownloading ? (
                        <SpinnerIcon size={13} className="text-blue-600" />
                      ) : (
                        <DownloadIcon size={13} />
                      )}
                      <span>Download</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUnstar(file)}
                      className="p-1.5 text-amber-500 bg-amber-50 rounded-md cursor-pointer"
                      title="Unstar"
                    >
                      <StarIcon size={15} filled />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(file)}
                      className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-md cursor-pointer"
                      title="Delete"
                    >
                      <TrashIcon size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : files.length > 0 ? (
        <EmptyState
          title="No starred files match search"
          description={`No starred files match "${searchQuery}".`}
          action={{
            label: "Clear Search",
            onClick: () => setSearchQuery(""),
          }}
        />
      ) : (
        <EmptyState
          title="No starred files yet"
          description="Star any file from All Files to quickly locate it here whenever you need it."
          icon={<StarIcon size={24} className="text-amber-500" filled />}
          action={{
            label: "Go to All Files",
            onClick: () => (window.location.href = "/files"),
          }}
        />
      )}
    </div>
  );
}
