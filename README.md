# InfoQuest by Arup

A bilingual (Bengali + English) research and news-discovery tool. Type a keyword, pick a
search engine (live web search or AI search powered by free models via OpenRouter), and
get a beautifully formatted, downloadable report split into **"What We Found"**
(যা জানা গেল) and **"Latest News"** (সাম্প্রতিক সংবাদ).

Built with Next.js 14 (App Router) + TypeScript + Tailwind CSS. Ready to deploy on Vercel.

---

## 1. Features

- **Auto language detection** — no toggle. Bengali is detected via the Unicode Bangla
  block (U+0980–U+09FF); the whole UI, search results, and reports switch language
  accordingly.
- **Search Engine dropdown** — Web Search (default) or AI Search (OpenRouter). AI Search
  comes with a second dropdown listing every currently-free model available on
  OpenRouter (fetched live from their API, cached 30 minutes), so it never goes stale as
  their free lineup changes. Any engine without a configured API key is shown disabled
  with an "API key not configured" tooltip.
- **Combine Web + AI** — when an AI engine is selected, optionally merge in live web
  results, de-duplicated by link.
- **Downloadable reports** — PDF (default) or Word (.docx), each with a cover page,
  the two required sections, a numbered news reference list, and page footers.
- **Bengali font embedding** — SolaimanLipi is bundled at `public/fonts/SolaimanLipi.ttf`
  and embedded directly into every generated PDF via `pdf-lib` + `fontkit`, so Bengali
  text renders correctly wherever the PDF is opened. The DOCX export references the same
  font family (Word uses it if installed locally; otherwise it falls back to a system
  Bengali-capable font — the PDF export is the guaranteed-rendering option).
- **Report length** (brief/detailed) and **news date range** filters.
- **In-browser preview** before downloading, plus a **shareable link** that pre-fills the
  keyword and engine.
- **Search history** stored in `localStorage`, with one-click re-open.
- **Dark mode** with an inverted navy/gold palette.
- Fully responsive, keyboard-focus-visible, and built without any external font fetch at
  build time (Bengali is self-hosted; Latin type uses a system-font stack), so the build
  never depends on network access to Google Fonts.

| Variable | Powers | Get a key |
|---|---|---|
| `SERPER_API_KEY` | Web Search (organic + news) | https://serper.dev |
| `NEWSAPI_KEY` *(optional)* | Extra news results merged into Web Search | https://newsapi.org |
| `OPENROUTER_API_KEY` | AI Search (free models) | https://openrouter.ai/keys |
| `NEXT_PUBLIC_SITE_URL` *(optional)* | Sent as the `HTTP-Referer` header on OpenRouter requests (used for their public attribution/leaderboard, not required for the app to work) | — |

All keys are read server-side only (in API routes) and are never sent to the browser.
