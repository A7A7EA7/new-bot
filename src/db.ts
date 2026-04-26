import { drizzle } from "drizzle-orm/better-sqlite3";
import Database, { type Database as BetterSqlite3Database } from "better-sqlite3";
import { existsSync, mkdirSync } from "node:fs";
import { dirname, isAbsolute, resolve } from "node:path";
import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const linksTable = sqliteTable("links", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  position: integer("position").notNull(),
  title: text("title").notNull(),
  url: text("url").notNull(),
  clicks: integer("clicks").notNull().default(0),
  abTest: text("ab_test"),
  imageFileId: text("image_file_id"),
});

export const statsTable = sqliteTable("stats", {
  id: integer("id").primaryKey().default(1),
  totalStarts: integer("total_starts").notNull().default(0),
  totalLinkOpens: integer("total_link_opens").notNull().default(0),
  totalWarnings: integer("total_warnings").notNull().default(0),
  totalBans: integer("total_bans").notNull().default(0),
  totalKicks: integer("total_kicks").notNull().default(0),
  totalMutes: integer("total_mutes").notNull().default(0),
});

export const knownUsersTable = sqliteTable("known_users", {
  telegramId: integer("telegram_id", { mode: "number" }).primaryKey(),
});

export const warningsTable = sqliteTable(
  "warnings",
  {
    chatId: integer("chat_id", { mode: "number" }).notNull(),
    userId: integer("user_id", { mode: "number" }).notNull(),
    count: integer("count").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.chatId, t.userId] })],
);

export const scheduledBroadcastsTable = sqliteTable("scheduled_broadcasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  postId: integer("post_id"),
  scheduledAt: integer("scheduled_at", { mode: "timestamp_ms" }).notNull(),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  status: text("status").notNull().default("pending"),
  delivered: integer("delivered").notNull().default(0),
  failed: integer("failed").notNull().default(0),
  sentAt: integer("sent_at", { mode: "timestamp_ms" }),
});

export const settingsTable = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const postsTable = sqliteTable("posts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  title: text("title").notNull(),
  text: text("text"),
  photoFileId: text("photo_file_id"),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
  lastSentAt: integer("last_sent_at", { mode: "timestamp_ms" }),
  sendCount: integer("send_count").notNull().default(0),
});

export const recurringBroadcastsTable = sqliteTable("recurring_broadcasts", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  message: text("message").notNull(),
  postId: integer("post_id"),
  kind: text("kind").notNull(),
  hour: integer("hour").notNull(),
  minute: integer("minute").notNull(),
  dayOfWeek: integer("day_of_week"),
  active: integer("active", { mode: "boolean" }).notNull().default(true),
  nextFireAt: integer("next_fire_at", { mode: "timestamp_ms" }).notNull(),
  lastFiredAt: integer("last_fired_at", { mode: "timestamp_ms" }),
  totalSent: integer("total_sent").notNull().default(0),
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

const schema = {
  linksTable,
  statsTable,
  knownUsersTable,
  warningsTable,
  scheduledBroadcastsTable,
  settingsTable,
  postsTable,
  recurringBroadcastsTable,
};

export function resolveDbPath(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (raw && !/^postgres(ql)?:\/\//i.test(raw)) {
    return isAbsolute(raw) ? raw : resolve(process.cwd(), raw);
  }
  return resolve(process.cwd(), "data", "bot.db");
}

const dbPath = resolveDbPath();
mkdirSync(dirname(dbPath), { recursive: true });

const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");

export const db = drizzle(sqlite, { schema });
export const sqliteConnection: BetterSqlite3Database = sqlite;

function ensureBaseSchema(): void {
  sqliteConnection.exec(`
    CREATE TABLE IF NOT EXISTS links (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      position INTEGER NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      clicks INTEGER NOT NULL DEFAULT 0,
      ab_test TEXT,
      image_file_id TEXT
    );
    CREATE TABLE IF NOT EXISTS stats (
      id INTEGER PRIMARY KEY DEFAULT 1,
      total_starts INTEGER NOT NULL DEFAULT 0,
      total_link_opens INTEGER NOT NULL DEFAULT 0,
      total_warnings INTEGER NOT NULL DEFAULT 0,
      total_bans INTEGER NOT NULL DEFAULT 0,
      total_kicks INTEGER NOT NULL DEFAULT 0,
      total_mutes INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS known_users (
      telegram_id INTEGER PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS warnings (
      chat_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      count INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (chat_id, user_id)
    );
    CREATE TABLE IF NOT EXISTS scheduled_broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      post_id INTEGER,
      scheduled_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      status TEXT NOT NULL DEFAULT 'pending',
      delivered INTEGER NOT NULL DEFAULT 0,
      failed INTEGER NOT NULL DEFAULT 0,
      sent_at INTEGER
    );
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      text TEXT,
      photo_file_id TEXT,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000),
      last_sent_at INTEGER,
      send_count INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS recurring_broadcasts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message TEXT NOT NULL,
      post_id INTEGER,
      kind TEXT NOT NULL,
      hour INTEGER NOT NULL,
      minute INTEGER NOT NULL,
      day_of_week INTEGER,
      active INTEGER NOT NULL DEFAULT 1,
      next_fire_at INTEGER NOT NULL,
      last_fired_at INTEGER,
      total_sent INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL DEFAULT (unixepoch() * 1000)
    );
  `);
}

ensureBaseSchema();
