import React, { useRef, useState, useCallback } from "react";
import { UploadIcon, SpinnerIcon } from "./icons";

interface UploadDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isUploading: boolean;
  uploadProgressText?: string;
  className?: string;
}

export function UploadDropzone({
  onFilesSelected,
  isUploading,
  uploadProgressText = "Uploading files...",
  className = "",
}: UploadDropzoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFiles = Array.from(e.dataTransfer.files || []);
      if (droppedFiles.length > 0 && !isUploading) {
        onFilesSelected(droppedFiles);
      }
    },
    [onFilesSelected, isUploading]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    },
    [onFilesSelected]
  );

  const handleClick = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Upload files by clicking or dropping them here"
      className={`
        relative border-2 border-dashed rounded-xl p-6 sm:p-7 text-center transition-all cursor-pointer
        ${
          isDragOver
            ? "border-blue-500 bg-blue-50/70"
            : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50"
        }
        ${isUploading ? "opacity-80 pointer-events-none" : ""}
        ${className}
      `}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleInputChange}
      />

      <div className="flex flex-col items-center justify-center">
        {isUploading ? (
          <div className="flex flex-col items-center gap-2.5 py-1">
            <SpinnerIcon size={24} className="text-blue-600" />
            <span className="text-sm font-medium text-slate-700">
              {uploadProgressText}
            </span>
            <span className="text-xs text-slate-400">
              Transferring directly to your storage
            </span>
          </div>
        ) : (
          <>
            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 mb-2.5">
              <UploadIcon size={20} />
            </div>
            <div className="text-sm font-medium text-slate-800">
              <span className="text-blue-600 hover:underline">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Supports documents, photos, audio, code, and archives up to 100 MB each
            </p>
          </>
        )}
      </div>
    </div>
  );
}
