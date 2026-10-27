import {
  pgTable,
  text,
  timestamp,
  bigint,
  boolean,
  uuid,
  varchar,
  integer,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  username: varchar("username", { length: 100 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  storageQuota: bigint("storage_quota", { mode: "number" }).notNull().default(5368709120), // 5GB
  storageUsed: bigint("storage_used", { mode: "number" }).notNull().default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const files = pgTable("files", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 500 }).notNull(),
  size: bigint("size", { mode: "number" }).notNull(),
  mimeType: varchar("mime_type", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(), // pdf, image, doc, archive, code, video, audio, other
  starred: boolean("starred").notNull().default(false),
  data: text("data").notNull(), // base64
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
