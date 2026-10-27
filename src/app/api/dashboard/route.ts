import { NextResponse } from "next/server";
import { db } from "@/db";
import { files, users } from "@/db/schema";
import { eq, desc, count, sum, sql } from "drizzle-orm";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  // Get fresh user data
  const [user] = await db
    .select({
      storageUsed: users.storageUsed,
      storageQuota: users.storageQuota,
    })
    .from(users)
    .where(eq(users.id, session.userId));

  // Total and starred counts
  const [totalCount] = await db
    .select({ value: count() })
    .from(files)
    .where(eq(files.userId, session.userId));

  const [starredCount] = await db
    .select({ value: count() })
    .from(files)
    .where(sql`${files.userId} = ${session.userId} AND ${files.starred} = true`);

  // Breakdown by type
  const typeBreakdown = await db
    .select({
      fileType: files.fileType,
      count: count(),
      totalSize: sum(files.size),
    })
    .from(files)
    .where(eq(files.userId, session.userId))
    .groupBy(files.fileType);

  // Recent files (last 5)
  const recentFiles = await db
    .select({
      id: files.id,
      name: files.name,
      size: files.size,
      fileType: files.fileType,
      starred: files.starred,
      uploadedAt: files.uploadedAt,
    })
    .from(files)
    .where(eq(files.userId, session.userId))
    .orderBy(desc(files.uploadedAt))
    .limit(5);

  return NextResponse.json({
    storageUsed: user.storageUsed,
    storageQuota: user.storageQuota,
    totalFiles: totalCount.value,
    starredFiles: starredCount.value,
    typeBreakdown: typeBreakdown.map((t) => ({
      type: t.fileType,
      count: t.count,
      size: Number(t.totalSize || 0),
    })),
    recentFiles,
  });
}
