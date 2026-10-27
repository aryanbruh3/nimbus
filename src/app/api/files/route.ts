import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, desc, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";
import { MAX_FILE_SIZE, classifyFile, formatBytes } from "@/lib/constants";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const allFiles = await db
    .select({
      id: files.id,
      name: files.name,
      size: files.size,
      mimeType: files.mimeType,
      fileType: files.fileType,
      starred: files.starred,
      uploadedAt: files.uploadedAt,
    })
    .from(files)
    .where(eq(files.userId, session.userId))
    .orderBy(desc(files.uploadedAt));

  return NextResponse.json({ files: allFiles });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Check single file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          error: `File too large — "${file.name}" is ${formatBytes(file.size)}, but the maximum is ${formatBytes(MAX_FILE_SIZE)}.`,
        },
        { status: 413 }
      );
    }

    // Check remaining quota
    const remaining = session.storageQuota - session.storageUsed;
    if (file.size > remaining) {
      return NextResponse.json(
        {
          error: `Storage full — you have ${formatBytes(remaining)} left of ${formatBytes(session.storageQuota)}, but "${file.name}" is ${formatBytes(file.size)}.`,
        },
        { status: 413 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const base64 = buffer.toString("base64");
    const fileType = classifyFile(file.type, file.name);

    const [newFile] = await db
      .insert(files)
      .values({
        userId: session.userId,
        name: file.name,
        size: file.size,
        mimeType: file.type || "application/octet-stream",
        fileType,
        data: base64,
      })
      .returning({
        id: files.id,
        name: files.name,
        size: files.size,
        mimeType: files.mimeType,
        fileType: files.fileType,
        starred: files.starred,
        uploadedAt: files.uploadedAt,
      });

    // Update user storage
    await db
      .update(users)
      .set({ storageUsed: sql`${users.storageUsed} + ${file.size}` })
      .where(eq(users.id, session.userId));

    return NextResponse.json({ file: newFile });
  } catch {
    return NextResponse.json(
      { error: "Upload failed — please try again" },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  await db.delete(files).where(eq(files.userId, session.userId));
  await db
    .update(users)
    .set({ storageUsed: 0 })
    .where(eq(users.id, session.userId));

  return NextResponse.json({ ok: true });
}
