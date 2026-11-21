import { db, count } from './db.js';
import { verifyPassword, createSession, getUser, destroySession } from './auth.js';

const json = (res, status, data) => {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(data));
};

const bad = (res, status, message) => json(res, status, { error: message });

const readBody = (req) => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', (c) => { size += c.length; if (size > 200_000) { reject(new Error('payload too large')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => {
    try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); }
    catch { reject(new Error('invalid JSON')); }
  });
  req.on('error', reject);
});

const trim = (v, max = 500) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const today = () => new Date().toISOString().slice(0, 10);

// ---------- public endpoints ----------

function listJobs(req, res, url) {
  const q = trim(url.searchParams.get('q'), 100);
  const category = trim(url.searchParams.get('category'), 60);
  const location = trim(url.searchParams.get('location'), 60);
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit'), 10) || 24, 1), 100);
  const offset = Math.min(Math.max(parseInt(url.searchParams.get('offset'), 10) || 0, 0), 5000);
  const sort = trim(url.searchParams.get('sort'), 20);
  const orderBy = sort === 'newest' ? 'j.id DESC'
    : sort === 'salary' ? 'j.featured DESC, j.id ASC'
    : 'j.featured DESC, j.deadline ASC';

  const where = []; const params = [];
  if (q) { where.push('(j.title LIKE ? OR j.company LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (category) { where.push('c.slug = ?'); params.push(category); }
  if (location) { where.push('j.location LIKE ?'); params.push(`%${location}%`); }

  const sql = `
    SELECT j.id, j.title, j.company, c.name AS category, c.slug AS categorySlug,
           j.location, j.jobType, j.salary, j.vacancies, j.deadline, j.description,
           j.featured, j.createdAt,
           (j.deadline >= ?) AS open,
           (SELECT COUNT(*) FROM applications a WHERE a.jobId = j.id) AS applications
    FROM jobs j JOIN categories c ON c.id = j.categoryId
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY ${orderBy}
    LIMIT ? OFFSET ?`;
  params.push(today(), limit, offset);
  const jobs = db.prepare(sql).all(...params);
  json(res, 200, { jobs, total: jobs.length });
}

function getJob(req, res, url, id) {
  const job = db.prepare(`
    SELECT j.*, c.name AS category, c.slug AS categorySlug,
           (j.deadline >= ?) AS open,
           (SELECT COUNT(*) FROM applications a WHERE a.jobId = j.id) AS applications
    FROM jobs j JOIN categories c ON c.id = j.categoryId WHERE j.id = ?
  `).get(today(), id);
  if (!job) return bad(res, 404, 'Job not found');
  json(res, 200, { job });
}

function listNews(req, res, url) {
  const limit = Math.min(Math.max(parseInt(url.searchParams.get('limit'), 10) || 20, 1), 100);
  const news = db.prepare(
    `SELECT id, title, category, author, excerpt, emoji, gradient, publishedAt
     FROM news ORDER BY publishedAt DESC, id DESC LIMIT ?`
  ).all(limit);
  json(res, 200, { news });
}

function getNews(req, res, url, id) {
  const article = db.prepare('SELECT * FROM news WHERE id = ?').get(id);
  if (!article) return bad(res, 404, 'Article not found');
  json(res, 200, { article });
}

function listCategories(res) {
  const categories = db.prepare(`
    SELECT c.id, c.name, c.slug, c.icon,
           (SELECT COUNT(*) FROM jobs j WHERE j.categoryId = c.id AND j.deadline >= ?) AS jobCount
    FROM categories c ORDER BY c.id`).all(today());
  json(res, 200, { categories });
}

function getStats(res) {
  json(res, 200, {
    activeJobs: db.prepare('SELECT COUNT(*) AS n FROM jobs WHERE deadline >= ?').get(today()).n,
    companies: db.prepare('SELECT COUNT(DISTINCT company) AS n FROM jobs').get().n,
    applications: count('applications'),
    subscribers: count('subscribers'),
    articles: count('news'),
  });
}

// ---------- apply / subscribe ----------

async function apply(req, res) {
  const b = await readBody(req);
  const jobId = parseInt(b.jobId, 10);
  const fullName = trim(b.fullName, 120);
  const email = trim(b.email, 120);
  const phone = trim(b.phone, 30);
  const coverLetter = trim(b.coverLetter, 4000);

  if (!jobId) return bad(res, 400, 'jobId is required');
  if (!fullName || fullName.length < 2) return bad(res, 400, 'Full name is required (min 2 chars)');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad(res, 400, 'A valid email is required');
  if (!/^[+\d][\d\s\-()]{5,29}$/.test(phone)) return bad(res, 400, 'A valid phone number is required');

  const job = db.prepare('SELECT id FROM jobs WHERE id = ?').get(jobId);
  if (!job) return bad(res, 404, 'Job not found');
  if (db.prepare('SELECT COUNT(*) AS n FROM applications WHERE jobId = ? AND email = ?').get(jobId, email).n > 0)
    return bad(res, 409, 'You have already applied to this job with this email');

  const r = db.prepare(
    'INSERT INTO applications (jobId, fullName, email, phone, coverLetter) VALUES (?, ?, ?, ?, ?)'
  ).run(jobId, fullName, email, phone, coverLetter);
  json(res, 201, { ok: true, applicationId: Number(r.lastInsertRowid) });
}

async function subscribe(req, res) {
  const b = await readBody(req);
  const email = trim(b.email, 120).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return bad(res, 400, 'A valid email is required');
  if (db.prepare('SELECT 1 FROM subscribers WHERE email = ?').get(email))
    return json(res, 200, { ok: true, message: 'Already subscribed' });
  db.prepare('INSERT INTO subscribers (email) VALUES (?)').run(email);
  json(res, 201, { ok: true, message: 'Subscribed' });
}

// ---------- auth ----------

async function login(req, res) {
  const b = await readBody(req);
  const username = trim(b.username, 60);
  const password = typeof b.password === 'string' ? b.password : '';
  if (!username || !password) return bad(res, 400, 'Username and password are required');
  const user = db.prepare('SELECT * FROM admin_users WHERE username = ?').get(username);
  if (!user || !verifyPassword(password, user.salt, user.passwordHash))
    return bad(res, 401, 'Invalid username or password');
  const token = createSession(user.id);
  json(res, 200, { ok: true, token, username: user.username });
}

function logout(req, res) {
  const user = getUser(req);
  if (user) destroySession(user.token);
  json(res, 200, { ok: true });
}

function me(req, res) {
  const user = getUser(req);
  if (!user) return bad(res, 401, 'Not authenticated');
  json(res, 200, { username: user.username });
}

function requireAuth(req, res) {
  const user = getUser(req);
  if (!user) { bad(res, 401, 'Admin authentication required'); return null; }
  return user;
}

// ---------- admin endpoints ----------

async function adminCreateJob(req, res) {
  if (!requireAuth(req, res)) return;
  const b = await readBody(req);
  const title = trim(b.title, 150);
  const company = trim(b.company, 100);
  const categoryId = parseInt(b.categoryId, 10);
  const location = trim(b.location, 100) || 'Dhaka';
  const jobType = trim(b.jobType, 30) || 'Full-time';
  const salary = trim(b.salary, 100) || 'Negotiable';
  const vacancies = Math.max(parseInt(b.vacancies, 10) || 1, 1);
  const deadline = trim(b.deadline, 10);
  const description = trim(b.description, 5000);
  const requirements = trim(b.requirements, 5000);
  const howToApply = trim(b.howToApply, 2000);
  const featured = b.featured ? 1 : 0;

  if (!title || !company) return bad(res, 400, 'Title and company are required');
  if (!db.prepare('SELECT 1 FROM categories WHERE id = ?').get(categoryId)) return bad(res, 400, 'Valid categoryId is required');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(deadline) || deadline < today()) return bad(res, 400, 'Deadline must be a future date (YYYY-MM-DD)');

  const r = db.prepare(`INSERT INTO jobs
    (title, company, categoryId, location, jobType, salary, vacancies, deadline, description, requirements, howToApply, featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(title, company, categoryId, location, jobType, salary, vacancies, deadline, description, requirements, howToApply, featured);
  json(res, 201, { ok: true, jobId: Number(r.lastInsertRowid) });
}

async function adminDeleteJob(req, res, id) {
  if (!requireAuth(req, res)) return;
  const r = db.prepare('DELETE FROM jobs WHERE id = ?').run(id);
  if (!r.changes) return bad(res, 404, 'Job not found');
  json(res, 200, { ok: true });
}

function adminApplications(req, res) {
  const user = requireAuth(req, res); if (!user) return;
  const rows = db.prepare(`
    SELECT a.id, a.fullName, a.email, a.phone, a.coverLetter, a.createdAt,
           j.title AS jobTitle, j.company
    FROM applications a JOIN jobs j ON j.id = a.jobId
    ORDER BY a.id DESC LIMIT 500`).all();
  json(res, 200, { applications: rows });
}

async function adminDeleteApplication(req, res, id) {
  if (!requireAuth(req, res)) return;
  const r = db.prepare('DELETE FROM applications WHERE id = ?').run(id);
  if (!r.changes) return bad(res, 404, 'Application not found');
  json(res, 200, { ok: true });
}

function adminSubscribers(req, res) {
  if (!requireAuth(req, res)) return;
  json(res, 200, { subscribers: db.prepare('SELECT id, email, createdAt FROM subscribers ORDER BY id DESC LIMIT 500').all() });
}

function adminStats(req, res) {
  if (!requireAuth(req, res)) return;
  json(res, 200, {
    jobs: count('jobs'), applications: count('applications'),
    subscribers: count('subscribers'), news: count('news'),
  });
}

// ---------- router ----------

export async function handleApi(req, res, url) {
  const p = url.pathname.replace(/\/+$/, '') || '/api';
  const seg = p.split('/').filter(Boolean); // ['api', ...]
  const m = req.method;

  try {
    if (m === 'GET' && p === '/api/stats') return getStats(res);
    if (m === 'GET' && p === '/api/categories') return listCategories(res);
    if (m === 'GET' && p === '/api/jobs') return listJobs(req, res, url);
    if (m === 'GET' && seg[1] === 'jobs' && seg[2]) return getJob(req, res, url, Number(seg[2]));
    if (m === 'GET' && p === '/api/news') return listNews(req, res, url);
    if (m === 'GET' && seg[1] === 'news' && seg[2]) return getNews(req, res, url, Number(seg[2]));
    if (m === 'POST' && p === '/api/apply') return await apply(req, res);
    if (m === 'POST' && p === '/api/subscribe') return await subscribe(req, res);
    if (m === 'POST' && p === '/api/auth/login') return await login(req, res);
    if (m === 'POST' && p === '/api/auth/logout') return logout(req, res);
    if (m === 'GET' && p === '/api/auth/me') return me(req, res);
    if (m === 'GET' && p === '/api/admin/stats') return adminStats(req, res);
    if (m === 'GET' && p === '/api/admin/applications') return adminApplications(req, res);
    if (m === 'DELETE' && seg[1] === 'admin' && seg[2] === 'applications' && seg[3]) return await adminDeleteApplication(req, res, Number(seg[3]));
    if (m === 'GET' && p === '/api/admin/subscribers') return adminSubscribers(req, res);
    if (m === 'POST' && p === '/api/admin/jobs') return await adminCreateJob(req, res);
    if (m === 'DELETE' && seg[1] === 'admin' && seg[2] === 'jobs' && seg[3]) return await adminDeleteJob(req, res, Number(seg[3]));
    return bad(res, 404, 'Unknown API route');
  } catch (err) {
    if (err.message === 'invalid JSON') return bad(res, 400, 'Invalid JSON body');
    if (err.message === 'payload too large') return bad(res, 413, 'Payload too large');
    console.error('API error:', err);
    return bad(res, 500, 'Internal server error');
  }
}
