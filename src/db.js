import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Writable storage: $DATA_DIR in the cloud, ./data locally.
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data');
fs.mkdirSync(dataDir, { recursive: true });

export const dbFile = path.join(dataDir, 'jobnews.db');
export const db = new DatabaseSync(dbFile);

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA busy_timeout = 3000;
  PRAGMA foreign_keys = ON;

  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT NOT NULL UNIQUE,
    slug  TEXT NOT NULL UNIQUE,
    icon  TEXT NOT NULL DEFAULT 'briefcase'
  );

  CREATE TABLE IF NOT EXISTS jobs (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       TEXT NOT NULL,
    company     TEXT NOT NULL,
    categoryId  INTEGER NOT NULL REFERENCES categories(id),
    location    TEXT NOT NULL DEFAULT 'Dhaka',
    jobType     TEXT NOT NULL DEFAULT 'Full-time',
    salary      TEXT NOT NULL DEFAULT 'Negotiable',
    vacancies   INTEGER NOT NULL DEFAULT 1,
    deadline    TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    requirements TEXT NOT NULL DEFAULT '',
    howToApply TEXT NOT NULL DEFAULT '',
    featured    INTEGER NOT NULL DEFAULT 0,
    createdAt   TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_jobs_category ON jobs(categoryId);
  CREATE INDEX IF NOT EXISTS idx_jobs_deadline ON jobs(deadline);

  CREATE TABLE IF NOT EXISTS news (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    title        TEXT NOT NULL,
    category     TEXT NOT NULL DEFAULT 'Career',
    author       TEXT NOT NULL DEFAULT 'JobNews Desk',
    excerpt      TEXT NOT NULL DEFAULT '',
    content      TEXT NOT NULL DEFAULT '',
    emoji        TEXT NOT NULL DEFAULT 'newspaper',
    gradient     TEXT NOT NULL DEFAULT 'grad-1',
    publishedAt  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS applications (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    jobId        INTEGER NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
    fullName     TEXT NOT NULL,
    email        TEXT NOT NULL,
    phone        TEXT NOT NULL,
    coverLetter  TEXT NOT NULL DEFAULT '',
    createdAt    TEXT NOT NULL DEFAULT (datetime('now'))
  );
  CREATE INDEX IF NOT EXISTS idx_applications_job ON applications(jobId);

  CREATE TABLE IF NOT EXISTS subscribers (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    email     TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS admin_users (
    id           INTEGER PRIMARY KEY AUTOINCREMENT,
    username     TEXT NOT NULL UNIQUE,
    passwordHash TEXT NOT NULL,
    salt         TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS sessions (
    token     TEXT PRIMARY KEY,
    userId    INTEGER NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    createdAt TEXT NOT NULL DEFAULT (datetime('now')),
    expiresAt TEXT NOT NULL
  );
`);

/** Run "SELECT COUNT(*) AS n FROM table" quickly. */
export function count(table) {
  return db.prepare(`SELECT COUNT(*) AS n FROM ${table}`).get().n;
}
