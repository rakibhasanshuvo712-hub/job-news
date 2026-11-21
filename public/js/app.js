// ---------- shared helpers ----------

async function api(path, opts = {}) {
  const headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  const token = localStorage.getItem('jn_token');
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(path, { ...opts, headers });
  let data = {};
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

function qs(sel, root = document) { return root.querySelector(sel); }
function qsa(sel, root = document) { return [...root.querySelectorAll(sel)]; }

function toast(msg, ms = 2600) {
  let t = qs('#toast');
  if (!t) { t = document.createElement('div'); t.id = 'toast'; t.className = 'toast'; document.body.appendChild(t); }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), ms);
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
function fmtDate(s) {
  if (!s) return '';
  const d = new Date(s.includes('T') || s.includes(' ') ? s.replace(' ', 'T') + 'Z' : s + 'T00:00:00Z');
  if (isNaN(d)) return s;
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}, ${d.getUTCFullYear()}`;
}

function daysLeft(deadline) {
  const d = new Date(deadline + 'T00:00:00Z');
  return Math.ceil((d - Date.now()) / 86400000);
}

function deadlineChip(deadline) {
  const left = daysLeft(deadline);
  if (left < 0) return `<span class="chip" style="background:#fee2e2;color:#b91c1c">Closed</span>`;
  if (left <= 5) return `<span class="chip warn">⏳ ${left} day${left === 1 ? '' : 's'} left</span>`;
  return `<span class="chip hl">Open until ${fmtDate(deadline)}</span>`;
}

const LOGO_COLORS = ['#1d4ed8', '#047857', '#b45309', '#7c3aed', '#be185d', '#0e7490', '#dc2626', '#15803d'];
function logoFor(company) {
  const initials = company.split(/\s+/).filter(w => /[a-zA-Z0-9]/.test(w)).map(w => w[0]).join('').slice(0, 2).toUpperCase()
    || company.slice(0, 2).toUpperCase();
  let h = 0;
  for (const ch of company) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const color = LOGO_COLORS[h % LOGO_COLORS.length];
  return `<div class="company-logo" style="background:${color}">${initials}</div>`;
}

const CAT_ICONS = {
  landmark: '🏛️', 'building-columns': '🏦', 'laptop-code': '💻', briefcase: '💼',
  handshake: '🤝', 'graduation-cap': '🎓', 'heart-pulse': '🩺', 'shield-halved': '🛡️',
};
const CAT_FALLBACK_ICONS = { Government: '🏛️', Banking: '🏦', 'IT & Software': '💻', 'Private Company': '💼', 'NGO & Development': '🤝', Teaching: '🎓', Health: '🩺', Insurance: '🛡️' };

function jobCard(j) {
  const icon = CAT_FALLBACK_ICONS[j.category] || '💼';
  return `
  <article class="job-card">
    ${j.featured ? '<span class="badge-featured">Featured</span>' : ''}
    <div class="company-row">
      ${logoFor(j.company)}
      <div>
        <h3><a href="/job.html?id=${j.id}">${esc(j.title)}</a></h3>
        <div class="job-company">${esc(j.company)} · ${esc(j.category)}</div>
      </div>
    </div>
    <div class="job-meta">
      <span class="chip">📍 ${esc(j.location)}</span>
      <span class="chip">🕒 ${esc(j.jobType)}</span>
      <span class="chip">👥 ${j.vacancies} vacancy${j.vacancies === 1 ? '' : 's'}</span>
      ${deadlineChip(j.deadline)}
    </div>
    <div class="job-foot">
      <span class="salary">${esc(j.salary)}</span>
      <a class="btn btn-outline btn-sm" href="/job.html?id=${j.id}">View & Apply →</a>
    </div>
  </article>`;
}

function newsCard(n) {
  return `
  <article class="news-card">
    <div class="news-thumb ${n.gradient}">${CAT_ICONS[n.emoji] || '📰'}</div>
    <div class="news-body">
      <span class="news-tag">${esc(n.category)}</span>
      <h3><a href="/article.html?id=${n.id}">${esc(n.title)}</a></h3>
      <p>${esc(n.excerpt.slice(0, 130))}${n.excerpt.length > 130 ? '…' : ''}</p>
      <span class="news-date">📰 JobNews Desk · ${fmtDate(n.publishedAt)}</span>
    </div>
  </article>`;
}

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function setMsg(el, type, text) {
  el.className = `form-msg ${type}`;
  el.textContent = text;
}

// ---------- skeleton loading placeholders ----------
function skeletonCards(n = 6, wide = false) {
  const gridCls = wide ? 'skeleton-grid' : 'skeleton-grid';
  const card = `<div class="skel">
    <div class="skel-avatar"></div>
    <div class="skel-line w-60"></div>
    <div class="skel-line w-80"></div>
    <div class="skel-line w-40"></div>
  </div>`;
  return `<div class="${gridCls}">${card.repeat(n)}</div>`;
}

// ---------- reveal on scroll + back-to-top ----------
function initUiMotion() {
  const revealEls = qsa('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (e.isIntersecting) { e.target.classList.add('reveal-visible'); io.unobserve(e.target); }
      }
    }, { threshold: 0.08 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('reveal-visible'));
  }

  const btn = document.createElement('button');
  btn.className = 'back-top';
  btn.setAttribute('aria-label', 'Back to top');
  btn.innerHTML = '↑';
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  document.body.appendChild(btn);
  window.addEventListener('scroll', () => {
    btn.classList.toggle('show', window.scrollY > 480);
  }, { passive: true });
}

// Active nav highlighting
document.addEventListener('DOMContentLoaded', () => {
  const here = location.pathname.split('/').pop() || 'index.html';
  qsa('.nav-links a').forEach(a => {
    const target = (a.getAttribute('href') || '').split('/').pop();
    if (target === here) a.classList.add('active');
  });
  const toggle = qs('.menu-toggle');
  if (toggle) toggle.addEventListener('click', () => qs('.nav-links').classList.toggle('open'));
  initUiMotion();
});
