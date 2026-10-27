"use client";

import { useEffect, useState, useCallback, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { formatBytes } from "@/lib/constants";
import { downloadFile } from "@/lib/download";
import { FileTypeIcon } from "@/components/FileTypeIcon";
import { UploadDropzone } from "@/components/UploadDropzone";
import { ConfirmModal } from "@/components/ConfirmModal";
import { EmptyState } from "@/components/EmptyState";
import {
  DownloadIcon,
  StarIcon,
  TrashIcon,
  SearchIcon,
  SpinnerIcon,
  FilesIcon,
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

export default function FilesPage() {
  const searchParams = useSearchParams();
  const queryParam = searchParams.get("q") || "";

  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgressText, setUploadProgressText] = useState("");
  const [userQuery, setUserQuery] = useState<string | null>(null);
  const searchQuery = userQuery !== null ? userQuery : queryParam;
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const loadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (res.ok) {
        const data = await res.json();
        startTransition(() => {
          setFiles(data.files || []);
        });
      } else if (res.status === 401) {
        toast.error("Session expired — please log in again");
        window.location.href = "/login";
      }
    } catch {
      toast.error("Failed to load files from server");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  const uploadSingle = async (file: File): Promise<boolean> => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/files", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || `Failed to upload "${file.name}"`);
        return false;
      }
      return true;
    } catch {
      toast.error(`Upload error on "${file.name}"`);
      return false;
    }
  };

  const handleFilesSelected = useCallback(
    async (selectedFiles: File[]) => {
      if (selectedFiles.length === 0) return;
      setUploading(true);

      let successCount = 0;
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgressText(
          selectedFiles.length > 1
            ? `Uploading ${i + 1} of ${selectedFiles.length}: "${file.name}"...`
            : `Uploading "${file.name}"...`
        );
        const ok = await uploadSingle(file);
        if (ok) successCount++;
      }

      setUploading(false);
      setUploadProgressText("");

      if (successCount > 0) {
        toast.success(
          successCount === 1
            ? "File uploaded successfully"
            : `Uploaded ${successCount} files successfully`
        );
        loadFiles();
      }
    },
    [loadFiles]
  );

  const handleDownload = useCallback(
    async (file: FileItem) => {
      setDownloadingId(file.id);
      await downloadFile({
        fileId: file.id,
        fileName: file.name,
        onFinish: () => setDownloadingId(null),
      });
    },
    []
  );

  const toggleStar = useCallback(
    async (file: FileItem) => {
      try {
        const res = await fetch(`/api/files/${file.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ starred: !file.starred }),
        });
        if (res.ok) {
          toast.success(
            file.starred
              ? `Removed "${file.name}" from starred`
              : `Added "${file.name}" to starred`
          );
          setFiles((prev) =>
            prev.map((f) =>
              f.id === file.id ? { ...f, starred: !f.starred } : f
            )
          );
        } else {
          toast.error("Failed to update star");
        }
      } catch {
        toast.error("Network error updating star");
      }
    },
    []
  );

  const deleteSingle = useCallback(
    async (file: FileItem) => {
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
    },
    []
  );

  const confirmDeleteAll = useCallback(async () => {
    setIsDeletingAll(true);
    try {
      const res = await fetch("/api/files", { method: "DELETE" });
      if (res.ok) {
        toast.success("All files permanently deleted");
        setFiles([]);
        setShowDeleteAllModal(false);
      } else {
        toast.error("Failed to delete all files");
      }
    } catch {
      toast.error("Network error deleting files");
    } finally {
      setIsDeletingAll(false);
    }
  }, []);

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[360px] text-slate-400 gap-3">
        <SpinnerIcon size={28} className="text-blue-600" />
        <span className="text-sm font-medium text-slate-500">Loading your files...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            All Files
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            {files.length === 0
              ? "No files in your cloud storage"
              : `${files.length} file${files.length !== 1 ? "s" : ""} stored`}
          </p>
        </div>

        {files.length > 0 && (
          <button
            onClick={() => setShowDeleteAllModal(true)}
            className="self-start sm:self-auto text-xs font-medium text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100/70 border border-red-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer inline-flex items-center gap-1.5"
          >
            <TrashIcon size={14} />
            <span>Delete All Files</span>
          </button>
        )}
      </div>

      {/* Upload Zone */}
      <UploadDropzone
        onFilesSelected={handleFilesSelected}
        isUploading={uploading}
        uploadProgressText={uploadProgressText}
      />

      {/* Search and Filters Bar */}
      <div className="flex items-center justify-between gap-3 bg-white p-3 border border-slate-200/80 rounded-xl shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <SearchIcon
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setUserQuery(e.target.value)}
            placeholder="Filter files by name..."
            className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:outline-none transition-colors"
          />
        </div>
        <div className="text-xs font-mono text-slate-500 shrink-0">
          Showing {filteredFiles.length} of {files.length}
        </div>
      </div>

      {/* Files Display */}
      {filteredFiles.length > 0 ? (
        <div className="bg-white border border-slate-200/80 rounded-xl shadow-2xs overflow-hidden">
          {/* Desktop Table */}
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
                          title={`Click to download "${file.name}"`}
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
                            aria-label={`Download ${file.name}`}
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
                            onClick={() => toggleStar(file)}
                            className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                              file.starred
                                ? "text-amber-500 hover:text-amber-600 hover:bg-amber-50"
                                : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
                            }`}
                            aria-label={file.starred ? "Unstar" : "Star"}
                            title={file.starred ? "Remove star" : "Star file"}
                          >
                            <StarIcon size={16} filled={file.starred} />
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteSingle(file)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors cursor-pointer"
                            aria-label={`Delete ${file.name}`}
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

          {/* Mobile List View */}
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
                        <span>•</span>
                        <span>
                          {new Date(file.uploadedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
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
                      onClick={() => toggleStar(file)}
                      className={`p-1.5 rounded-md ${
                        file.starred
                          ? "text-amber-500 bg-amber-50"
                          : "text-slate-400 bg-slate-50"
                      }`}
                      aria-label="Star"
                    >
                      <StarIcon size={15} filled={file.starred} />
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteSingle(file)}
                      className="p-1.5 text-slate-400 hover:text-red-600 bg-slate-50 rounded-md"
                      aria-label="Delete"
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
          title="No matching files found"
          description={`No files match your search query "${searchQuery}". Try a different keyword.`}
          action={{
            label: "Clear Search",
            onClick: () => setUserQuery(""),
          }}
        />
      ) : (
        <EmptyState
          title="No files in your cloud"
          description="Your storage is ready. Drag and drop any files into the upload box above to safely store them."
          icon={<FilesIcon size={24} />}
        />
      )}

      {/* Confirmation Modal for Bulk Delete */}
      <ConfirmModal
        isOpen={showDeleteAllModal}
        title="Delete all files?"
        description={`This action will permanently delete all ${files.length} files from your Nimbus cloud storage and restore your free space. This cannot be undone.`}
        confirmLabel="Permanently Delete All"
        cancelLabel="Keep Files"
        isDestructive
        isLoading={isDeletingAll}
        onConfirm={confirmDeleteAll}
        onCancel={() => setShowDeleteAllModal(false)}
      />
    </div>
  );
}
