import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  if (typeof body.starred !== "boolean") {
    return NextResponse.json({ error: "Invalid update" }, { status: 400 });
  }

  const [updated] = await db
    .update(files)
    .set({ starred: body.starred })
    .where(and(eq(files.id, id), eq(files.userId, session.userId)))
    .returning({
      id: files.id,
      name: files.name,
      size: files.size,
      mimeType: files.mimeType,
      fileType: files.fileType,
      starred: files.starred,
      uploadedAt: files.uploadedAt,
    });

  if (!updated) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return NextResponse.json({ file: updated });
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { id } = await params;

  const [deleted] = await db
    .delete(files)
    .where(and(eq(files.id, id), eq(files.userId, session.userId)))
    .returning({ size: files.size, name: files.name });

  if (!deleted) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  await db
    .update(users)
    .set({ storageUsed: sql`GREATEST(${users.storageUsed} - ${deleted.size}, 0)` })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ ok: true, name: deleted.name });
}
