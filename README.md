# job-news

A full-stack job news portal for Bangladesh — job circulars, exam notices and career news, with a working apply flow and admin panel.

**Live site:** https://jobnews-s6dq.zai-ai.site

## Tech stack

- **Backend:** Node.js HTTP server (`server.js`) + REST API (`src/api.js`) — **zero npm dependencies**
- **Database:** SQLite via Node's built-in `node:sqlite` (Node 22.5+), auto-created and seeded on first start
- **Frontend:** vanilla HTML/CSS/JS (6 pages: home, jobs, job detail + apply, news, article, admin)

## Features

- Browse/search jobs by keyword, category and location; deadline countdown per circular
- Job detail pages with description, requirements, salary and an application form (validated, duplicate-blocked)
- Career news & article reader
- Newsletter subscription
- Admin dashboard (`/admin.html`): post/delete jobs, review/delete applications, see subscribers — session-token auth with scrypt password hashing

## Run locally

```bash
node server.js
# → http://127.0.0.1:3000
```

Requires Node.js 22.5+ (tested on 24). The SQLite file is created in `data/` (override with the `DATA_DIR` env var).

## Admin login (demo)

- Username: `admin`
- Password: `admin123`

> Change these in `src/seed.js` before using in production.

## API overview

| Method | Route | Description |
|---|---|---|
| GET | `/api/stats` | Site statistics |
| GET | `/api/categories` | Categories with live job counts |
| GET | `/api/jobs` | List/filter jobs (`?q=&category=&location=&limit=`) |
| GET | `/api/jobs/:id` | Job detail |
| GET | `/api/news` · `/api/news/:id` | News list / article |
| POST | `/api/apply` | Submit an application |
| POST | `/api/subscribe` | Newsletter subscribe |
| POST | `/api/auth/login` · `/api/auth/logout` · GET `/api/auth/me` | Admin session auth |
| GET/POST/DELETE | `/api/admin/*` | Admin: stats, applications, subscribers, jobs (Bearer token required) |

## Deployment

Deploys as a self-contained Node server (ZCode Sites): the stage in `.zcode-site/stage/` is `start.sh` + `server.js` + `src/` + `public/` — no `node_modules` needed since there are no dependencies. The cloud database starts fresh and re-seeds itself on first boot.

## Project structure

```
jobnews/
├── server.js        # HTTP server: static files + API dispatch
├── src/
│   ├── db.js        # SQLite schema (jobs, categories, news, applications, subscribers, sessions…)
│   ├── api.js       # REST API routes
│   ├── auth.js      # scrypt hashing + bearer-token sessions
│   └── seed.js      # demo data (15 jobs, 6 articles)
└── public/          # frontend (HTML/CSS/JS)
```
