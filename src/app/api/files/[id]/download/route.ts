import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { files } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { buildContentDisposition } from "@/lib/constants";

export { buildContentDisposition };

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json(
        { error: "Authentication required to download this file" },
        { status: 401 }
      );
    }

    const { id } = await params;
    if (!id || typeof id !== "string" || id.trim().length === 0) {
      return NextResponse.json(
        { error: "Invalid file identifier" },
        { status: 400 }
      );
    }

    const [file] = await db
      .select()
      .from(files)
      .where(and(eq(files.id, id.trim()), eq(files.userId, session.userId)))
      .limit(1);

    if (!file) {
      return NextResponse.json(
        { error: "File not found or access denied" },
        { status: 404 }
      );
    }

    if (!file.data || typeof file.data !== "string") {
      return NextResponse.json(
        { error: "Stored file payload is missing or corrupted" },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(file.data, "base64");
    if (buffer.length === 0 && file.size > 0) {
      return NextResponse.json(
        { error: "Failed to decode stored file data" },
        { status: 500 }
      );
    }

    const mimeType = file.mimeType?.trim() || "application/octet-stream";
    const contentDisposition = buildContentDisposition(file.name);

    return new Response(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": contentDisposition,
        "Content-Length": String(buffer.byteLength),
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (err) {
    console.error("Error generating file download:", err);
    return NextResponse.json(
      { error: "Internal server error generating download" },
      { status: 500 }
    );
  }
}
