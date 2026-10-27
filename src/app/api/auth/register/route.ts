import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq, count } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { createSession } from "@/lib/auth";
import { MAX_USERS, DEFAULT_QUOTA } from "@/lib/constants";

export async function POST(req: NextRequest) {
  try {
    const { email, username, password } = await req.json();

    if (!email || !username || !password) {
      return NextResponse.json(
        { error: "Email, username, and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    // Check user limit
    const [userCount] = await db.select({ value: count() }).from(users);
    if (userCount.value >= MAX_USERS) {
      return NextResponse.json(
        {
          error: `Registration is closed — Nimbus is at capacity (${MAX_USERS} users). Try again later.`,
          code: "LIMIT_REACHED",
        },
        { status: 403 }
      );
    }

    // Check existing
    const existingEmail = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase()))
      .limit(1);
    if (existingEmail.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists" },
        { status: 409 }
      );
    }

    const existingUsername = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.username, username))
      .limit(1);
    if (existingUsername.length > 0) {
      return NextResponse.json(
        { error: "This username is taken" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase(),
        username,
        passwordHash,
        storageQuota: DEFAULT_QUOTA,
        storageUsed: 0,
      })
      .returning({ id: users.id, email: users.email, username: users.username });

    await createSession(newUser.id);

    return NextResponse.json({
      user: { id: newUser.id, email: newUser.email, username: newUser.username },
    });
  } catch {
    return NextResponse.json(
      { error: "Something went wrong during registration" },
      { status: 500 }
    );
  }
}
