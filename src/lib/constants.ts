// Max number of registered users
export const MAX_USERS = 50;

// Max single file upload size: 100MB
export const MAX_FILE_SIZE = 100 * 1024 * 1024;

// Default storage quota: 5GB
export const DEFAULT_QUOTA = 5 * 1024 * 1024 * 1024;

// File type classification
export function classifyFile(mimeType: string, fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";

  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (mimeType.startsWith("image/")) return "image";
  if (mimeType.startsWith("video/")) return "video";
  if (mimeType.startsWith("audio/")) return "audio";
  if (
    mimeType.includes("zip") ||
    mimeType.includes("tar") ||
    mimeType.includes("rar") ||
    mimeType.includes("7z") ||
    mimeType.includes("gzip") ||
    mimeType.includes("compress") ||
    ["zip", "tar", "gz", "rar", "7z", "bz2"].includes(ext)
  )
    return "archive";
  if (
    mimeType.includes("word") ||
    mimeType.includes("document") ||
    mimeType.includes("spreadsheet") ||
    mimeType.includes("presentation") ||
    mimeType.includes("excel") ||
    mimeType.includes("powerpoint") ||
    mimeType === "text/plain" ||
    mimeType === "text/rtf" ||
    ["doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "rtf", "txt", "csv"].includes(ext)
  )
    return "doc";
  if (
    mimeType.includes("javascript") ||
    mimeType.includes("json") ||
    mimeType.includes("xml") ||
    mimeType.includes("html") ||
    mimeType.includes("css") ||
    mimeType.includes("typescript") ||
    mimeType.includes("python") ||
    mimeType === "application/x-sh" ||
    ["js", "ts", "tsx", "jsx", "py", "rb", "go", "rs", "java", "c", "cpp", "h", "hpp", "cs", "php", "sh", "bash", "yaml", "yml", "toml", "ini", "cfg", "sql", "md", "html", "css", "scss", "less", "json", "xml", "svg"].includes(ext)
  )
    return "code";

  return "other";
}

// Human-readable file size
export function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const value = bytes / Math.pow(1024, i);
  return `${value < 10 ? value.toFixed(1) : Math.round(value)} ${units[i]}`;
}

/**
 * Builds an RFC 6266 / RFC 5987 compliant Content-Disposition header.
 * Handles Unicode, spaces, quotes, apostrophes, and prevents header injection.
 */
export function buildContentDisposition(rawFilename: string): string {
  // Take only the first line to prevent any CRLF injection completely
  const firstLine = (rawFilename || "download").split(/[\r\n\x00]/)[0].trim() || "download";

  // Clean characters that could break headers: remove double quotes and backslashes
  const cleanName = firstLine.replace(/["\\]/g, "_");

  // Create an ASCII-only fallback filename for older clients
  const asciiFallback = cleanName
    .replace(/[^\x20-\x7E]/g, "_")
    .replace(/\s+/g, " ")
    .trim() || "download";

  // UTF-8 encoded filename for modern browsers supporting RFC 5987 / RFC 6266
  const utf8Encoded = encodeURIComponent(cleanName);

  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${utf8Encoded}`;
}

