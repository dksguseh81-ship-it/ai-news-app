# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project status

Only the bare `create-next-app` scaffold exists (Next.js 16, React 19, TypeScript, Tailwind CSS 4, App Router, `src/` layout, alias `@/*` → `src/*`). No app code has been written yet. [PRD.md](PRD.md) (Korean) is the source of truth for what to build; read it before implementing features.

**Next.js 16 differs from older versions.** [AGENTS.md](AGENTS.md) requires reading the relevant guide in `node_modules/next/dist/docs/` before writing Next.js code, and heeding deprecation notices.

## Commands

- `npm run dev` — dev server (http://localhost:3000)
- `npm run build` / `npm run start` — production build / serve
- `npm run lint` — ESLint (flat config, `eslint.config.mjs`)
- No test runner is configured.

## Planned architecture (from PRD.md, not yet installed)

- **Auth:** Clerk; unauthenticated users are blocked. All data is scoped by Clerk user ID.
- **DB:** Neon Postgres via Drizzle ORM. Tables: `categories` (per user) and `articles` (`url` unique per user, `category_id`, `notion_saved`, `notion_page_url`).
- **Fetch flow:** a user-clicked "뉴스 가져오기" (no scheduled jobs) pulls RSS from TechCrunch AI and The Verge AI (latest N per feed, default 10), skips URLs already stored *before* calling Claude, then makes one Claude call per article returning JSON with Korean title, Korean summary and category (from the user's categories, else "기타").
- **Resilience:** process per article so one failure doesn't abort the batch; report failure counts; keep serverless time limits (Vercel assumed) in mind and show progress.
- **Categories:** user-editable. Changing them does not reclassify existing articles; deleting one moves its articles to "기타".
- **Notion:** save one article at a time via a Notion MCP server (connection method, auth and target page/database are still undecided in the PRD). Prevent duplicate saves.
- **Secrets:** Claude, Notion, Neon and Clerk keys live in server-side env vars only, never exposed to the client.
