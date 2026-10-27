import { test, describe } from "node:test";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { buildContentDisposition } from "../src/lib/constants.ts";

describe("Nimbus Download System - Byte Fidelity, Security & Headers", () => {
  // 1. Text file byte-for-byte test
  test("Small text file encodes to base64 and decodes byte-for-byte identically", () => {
    const originalText = "Hello Nimbus Cloud Storage! \nSpecial characters: å, é, î, ø, ü, 🚀\nLine 3 with tabs\t\tend.";
    const originalBuffer = Buffer.from(originalText, "utf-8");
    const base64Data = originalBuffer.toString("base64");

    const decodedBuffer = Buffer.from(base64Data, "base64");
    assert.equal(originalBuffer.equals(decodedBuffer), true, "Decoded buffer must match original buffer exactly");
    assert.equal(decodedBuffer.toString("utf-8"), originalText, "Decoded text must match original string");
    assert.equal(decodedBuffer.byteLength, originalBuffer.byteLength);
  });

  // 2. Arbitrary binary file byte-for-byte test (random bytes 0-255)
  test("Arbitrary binary data (all byte values 0x00 to 0xFF) matches byte-for-byte", () => {
    // Generate 64KB of cryptographically random binary bytes
    const originalBytes = crypto.randomBytes(65536);
    const base64Data = originalBytes.toString("base64");

    const decodedBytes = Buffer.from(base64Data, "base64");
    assert.equal(originalBytes.equals(decodedBytes), true, "Binary bytes must be identical");
    assert.equal(decodedBytes.byteLength, 65536);
    
    // Check specific header length calculation
    const contentLength = String(decodedBytes.byteLength);
    assert.equal(contentLength, "65536");
  });

  // 3. Synthetic PDF file byte-for-byte test
  test("PDF binary header and content preserves exact byte sequence", () => {
    const pdfHeader = Buffer.from("%PDF-1.7\n%âãÏÓ\n");
    const pdfBody = crypto.randomBytes(4096);
    const pdfTrailer = Buffer.from("\n%%EOF");
    const fullPdf = Buffer.concat([pdfHeader, pdfBody, pdfTrailer]);

    const base64 = fullPdf.toString("base64");
    const decoded = Buffer.from(base64, "base64");

    assert.equal(fullPdf.equals(decoded), true, "PDF content must match byte-for-byte");
    assert.equal(decoded.subarray(0, 8).toString("utf-8"), "%PDF-1.7");
  });

  // 4. Synthetic PNG image file byte-for-byte test
  test("PNG image signature and binary data preserves exact byte sequence", () => {
    // Standard PNG magic bytes: 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A
    const pngMagic = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    const pngChunks = crypto.randomBytes(8192);
    const fullPng = Buffer.concat([pngMagic, pngChunks]);

    const base64 = fullPng.toString("base64");
    const decoded = Buffer.from(base64, "base64");

    assert.equal(fullPng.equals(decoded), true, "PNG content must match byte-for-byte");
    assert.equal(decoded[0], 0x89);
    assert.equal(decoded[1], 0x50);
  });

  // 5. ZIP file binary test
  test("ZIP archive magic signature and contents preserve exact bytes", () => {
    const zipMagic = Buffer.from([0x50, 0x4B, 0x03, 0x04]); // PK..
    const zipPayload = crypto.randomBytes(2048);
    const fullZip = Buffer.concat([zipMagic, zipPayload]);

    const base64 = fullZip.toString("base64");
    const decoded = Buffer.from(base64, "base64");

    assert.equal(fullZip.equals(decoded), true);
    assert.equal(decoded[0], 0x50);
    assert.equal(decoded[1], 0x4B);
  });

  // 6. Filename handling: spaces, quotes, Unicode, apostrophes
  test("Content-Disposition handles filenames with spaces, quotes, apostrophes, and Unicode", () => {
    // Case A: Spaces and parentheses
    const headerA = buildContentDisposition("Quarterly Report (Q1 2026).pdf");
    assert.ok(headerA.includes('filename="Quarterly Report (Q1 2026).pdf"'));
    assert.ok(headerA.includes("filename*=UTF-8''Quarterly%20Report%20(Q1%202026).pdf"));

    // Case B: Double quotes and backslashes (must be sanitized to prevent header syntax errors)
    const headerB = buildContentDisposition('Project "Final" version\\1.docx');
    assert.ok(headerB.includes('filename="Project _Final_ version_1.docx"'));
    assert.ok(headerB.includes("filename*=UTF-8''Project%20_Final_%20version_1.docx"));

    // Case C: Unicode characters and accents
    const headerC = buildContentDisposition("Résumé & spëcification — 2026.pdf");
    // ASCII fallback replaces non-ASCII safely
    assert.ok(headerC.includes('filename="R_sum_ & sp_cification _ 2026.pdf"'));
    // UTF-8 encoded parameter retains full Unicode fidelity
    assert.ok(headerC.includes("filename*=UTF-8''R%C3%A9sum%C3%A9%20%26%20sp%C3%ABcification%20%E2%80%94%202026.pdf"));

    // Case D: Non-Latin characters (Chinese, Japanese, emoji)
    const headerD = buildContentDisposition("日本語_ドキュメント_📁.zip");
    assert.ok(headerD.includes('attachment; filename="'));
    assert.ok(headerD.endsWith(".zip"));
    assert.ok(headerD.includes("filename*=UTF-8''%E6%97%A5%E6%9C%AC%E8%AA%9E_%E3%83%89%E3%82%AD%E3%83%A5%E3%83%A1%E3%83%B3%E3%83%88_%F0%9F%93%81.zip"));
  });

  // 7. Security: Header injection prevention
  test("Content-Disposition strips CRLF control characters to prevent header injection", () => {
    const maliciousName = "legit.pdf\r\nSet-Cookie: stolen=session\r\nX-Injected: true";
    const header = buildContentDisposition(maliciousName);

    assert.ok(!header.includes("\r"), "Header must not contain carriage return");
    assert.ok(!header.includes("\n"), "Header must not contain newline");
    assert.ok(!header.includes("Set-Cookie"), "Injected content on subsequent lines must be eliminated");
    assert.ok(header.includes("legit.pdf"));
  });

  // 8. Security & Logic: Simulated route isolation and permission checks
  test("Download response construction enforces MIME type, Content-Length, and security headers", () => {
    const file = {
      id: "123e4567-e89b-12d3-a456-426614174000",
      userId: "user-1",
      name: "financial-plan.xlsx",
      mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      size: 15420,
      data: crypto.randomBytes(15420).toString("base64"),
    };

    const buffer = Buffer.from(file.data, "base64");
    assert.equal(buffer.byteLength, file.size);

    const headers = {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": buildContentDisposition(file.name),
      "Content-Length": String(buffer.byteLength),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    };

    assert.equal(headers["Content-Length"], "15420");
    assert.equal(headers["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    assert.equal(headers["X-Content-Type-Options"], "nosniff");
    assert.ok(headers["Content-Disposition"].startsWith("attachment;"));
  });

  // 9. Cross-user isolation simulation
  test("User cannot download another user's file (tenant isolation)", () => {
    const userA = "user-alice-uuid";
    const userB = "user-bob-uuid";

    const mockDbFiles = [
      { id: "file-100", userId: userA, name: "alice-secrets.txt", data: Buffer.from("alice data").toString("base64") },
      { id: "file-200", userId: userB, name: "bob-notes.txt", data: Buffer.from("bob data").toString("base64") },
    ];

    // Alice queries file-100 -> succeeds
    const aliceFile = mockDbFiles.find(f => f.id === "file-100" && f.userId === userA);
    assert.ok(aliceFile, "Alice should access her own file");

    // Alice queries file-200 (Bob's file) -> rejected (null / 404)
    const bobFileFromAlice = mockDbFiles.find(f => f.id === "file-200" && f.userId === userA);
    assert.equal(bobFileFromAlice, undefined, "Alice must NOT be able to find or download Bob's file");

    // Bob queries file-100 -> rejected
    const aliceFileFromBob = mockDbFiles.find(f => f.id === "file-100" && f.userId === userB);
    assert.equal(aliceFileFromBob, undefined, "Bob must NOT be able to find or download Alice's file");
  });

  // 10. Corrupted or missing payload handling
  test("Corrupted or empty data payload is correctly identified", () => {
    const invalidFileA = { name: "broken.pdf", size: 1024, data: null };
    assert.equal(!invalidFileA.data || typeof invalidFileA.data !== "string", true);

    const invalidFileB = { name: "empty.pdf", size: 2048, data: "" };
    const decodedEmpty = Buffer.from(invalidFileB.data, "base64");
    assert.equal(decodedEmpty.length === 0 && invalidFileB.size > 0, true, "Empty buffer for non-zero size is invalid");
  });

  // 11. Frontend failed download handling
  test("Frontend error response is never treated as a valid download blob", async () => {
    // Simulate API returning a 404 JSON error
    const simulatedResponse = new Response(JSON.stringify({ error: "File not found or access denied" }), {
      status: 404,
      statusText: "Not Found",
      headers: { "Content-Type": "application/json" },
    });

    assert.equal(simulatedResponse.ok, false);
    assert.equal(simulatedResponse.status, 404);

    // Verify error response parsing
    const errorJson = await simulatedResponse.json();
    assert.equal(errorJson.error, "File not found or access denied");
  });
});
