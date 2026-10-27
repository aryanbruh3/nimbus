import { toast } from "sonner";

// Active download tracker to prevent duplicate concurrent downloads of the same file
const activeDownloads = new Set<string>();

export interface DownloadOptions {
  fileId: string;
  fileName: string;
  onStart?: () => void;
  onFinish?: () => void;
}

/**
 * Downloads a file safely via fetch, verifying response.ok, decoding as Blob,
 * creating an object URL, and automatically cleaning up memory.
 * Never saves an API error response as a file.
 */
export async function downloadFile({
  fileId,
  fileName,
  onStart,
  onFinish,
}: DownloadOptions): Promise<boolean> {
  if (!fileId) {
    toast.error("Invalid file ID");
    return false;
  }

  if (activeDownloads.has(fileId)) {
    toast.info(`"${fileName}" is already downloading...`);
    return false;
  }

  activeDownloads.add(fileId);
  onStart?.();

  try {
    const res = await fetch(`/api/files/${encodeURIComponent(fileId)}/download`);

    if (!res.ok) {
      let errorMessage = "Download failed";
      try {
        const errorData = await res.json();
        if (errorData?.error) {
          errorMessage = errorData.error;
        }
      } catch {
        // Response was not JSON
        if (res.status === 401) {
          errorMessage = "Session expired — please log in again";
        } else if (res.status === 404) {
          errorMessage = "File not found or access denied";
        } else {
          errorMessage = `Download failed (HTTP ${res.status})`;
        }
      }

      toast.error(errorMessage);

      if (res.status === 401 && typeof window !== "undefined") {
        window.location.href = "/login";
      }
      return false;
    }

    // Response is valid binary content
    const blob = await res.blob();
    const objectUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = objectUrl;
    link.download = fileName || "download";
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up object URL safely after the browser download has initiated
    setTimeout(() => {
      window.URL.revokeObjectURL(objectUrl);
    }, 1500);

    return true;
  } catch (err) {
    console.error("Network error downloading file:", err);
    toast.error("Network error — check your connection");
    return false;
  } finally {
    activeDownloads.delete(fileId);
    onFinish?.();
  }
}
