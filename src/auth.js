import crypto from 'node:crypto';
import { db } from './db.js';

const SESSION_TTL_HOURS = 24;

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password, salt, expectedHash) {
  const actual = crypto.scryptSync(String(password), salt, 64);
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_HOURS * 3600 * 1000)
    .toISOString()
    .replace('T', ' ')
    .slice(0, 19);
  db.prepare('INSERT INTO sessions (token, userId, expiresAt) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return token;
}

/** Returns { userId, username } for a valid Bearer token, else null. */
export function getUser(req) {
  const header = req.headers['authorization'] || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const row = db.prepare(`
    SELECT s.token, s.expiresAt, u.id AS userId, u.username
    FROM sessions s JOIN admin_users u ON u.id = s.userId
    WHERE s.token = ?
  `).get(token);
  if (!row) return null;
  if (row.expiresAt <= new Date().toISOString().replace('T', ' ').slice(0, 19)) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
    return null;
  }
  return { userId: row.userId, username: row.username, token: row.token };
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
}
