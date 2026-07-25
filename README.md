# InfoQuest by Arup

A bilingual (Bengali + English) research and news-discovery tool. Type a keyword, pick a
search engine (live web search or one of four AI providers), and get a beautifully
formatted, downloadable report split into **"What We Found"** (যা জানা গেল) and
**"Latest News"** (সাম্প্রতিক সংবাদ).

Built with Next.js 14 (App Router) + TypeScript + Tailwind CSS. Ready to deploy on Vercel.

---

## 1. Features

- **Auto language detection** — no toggle. Bengali is detected via the Unicode Bengali
  block (U+0980–U+09FF); the whole UI, search results, and reports switch language
  accordingly.
- **Search Engine dropdown** — Web Search (default) or AI: Gemini / Claude / Grok / Z.ai.
  Any engine without a configured API key is shown disabled with an
  "API key not configured" tooltip.
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

## 2. Project structure

```
src/
  app/
    page.tsx                  # main UI (search, engine picker, results, history)
    layout.tsx, globals.css
    api/
      search/route.ts         # orchestrates web + AI providers
      providers/status/route.ts
      report/pdf/route.ts     # PDF generation endpoint
      report/docx/route.ts    # DOCX generation endpoint
  components/                 # SearchBar, EngineDropdown, ResultsPreview, etc.
  lib/
    language.ts                # language detection + all UI strings (en/bn)
    types.ts                   # shared ResearchResult / NewsItem / provider types
    pdf.ts, docx.ts            # report generators
    providers/
      webSearch.ts             # Serper.dev (+ optional NewsAPI merge)
      gemini.ts, claude.ts, grok.ts, zai.ts   # one file per AI provider
      aiShared.ts               # shared prompt + JSON-parsing helpers
public/
  fonts/SolaimanLipi.ttf
```

Every provider (web search or AI) normalizes its response into the same
`{ information, newsItems[] }` shape (see `src/lib/types.ts`), so the report generators
and UI never need to know which source produced the content. Add a new AI provider by
creating one more file in `src/lib/providers/` that implements `AIResearchProvider`.

## 3. Local development

```bash
npm install
cp .env.example .env.local   # then fill in whichever API keys you have
npm run dev
```

Open http://localhost:3000.

Everything works with **zero keys configured** — the app builds and runs, and the
Search Engine dropdown will simply show every option disabled until you add keys.

## 4. Environment variables

Set these in `.env.local` for local dev, or in **Vercel → Project → Settings →
Environment Variables** for deployment. Each is independent — leave any of them blank to
disable that option in the dropdown.

| Variable | Powers | Get a key |
|---|---|---|
| `SERPER_API_KEY` | Web Search (organic + news) | https://serper.dev |
| `NEWSAPI_KEY` *(optional)* | Extra news results merged into Web Search | https://newsapi.org |
| `GEMINI_API_KEY` | AI: Gemini | https://ai.google.dev |
| `ANTHROPIC_API_KEY` | AI: Claude | https://console.anthropic.com |
| `GROK_API_KEY` | AI: Grok | https://x.ai/api |
| `ZAI_API_KEY` | AI: Z.ai | https://z.ai |

All keys are read server-side only (in API routes) and are never sent to the browser.

## 5. Deploying to Vercel

**Option A — Vercel CLI**
```bash
npm i -g vercel
vercel            # first deploy, follow the prompts
vercel --prod     # promote to production
```

**Option B — Git integration**
1. Push this project to a GitHub/GitLab/Bitbucket repo.
2. In Vercel, "Add New Project" → import the repo. Framework preset auto-detects
   **Next.js**; no build command changes are needed (`next build` / `npm install` are
   already set in `vercel.json`).
3. Add the environment variables from the table above under
   Project → Settings → Environment Variables (for Production, Preview, and
   Development as needed).
4. Deploy.

The `vercel.json` in this repo raises `maxDuration` to 30s for the search and report
routes, since a "Combine Web + AI" request or a large web search can take a few seconds
longer than the default.

## 6. Notes & known limitations

- **DOCX font embedding**: Word documents reference the SolaimanLipi font by name rather
  than embedding its glyph data (true OOXML font embedding requires font-obfuscation that
  the `docx` npm package does not support). For guaranteed Bengali rendering on any
  machine, use the PDF export, which embeds the font directly. If you want the Word file
  to look correct without installing the font, either install `public/fonts/SolaimanLipi.ttf`
  on the machine opening it, or switch `bodyFontName`/`headingFontName` in `src/lib/docx.ts`
  to `"Noto Sans Bengali"` if that's more commonly installed in your audience's environment.
- **Web Search language**: Serper.dev supports Bengali (`hl=bn`, `gl=bd`); NewsAPI.org does
  not have a Bengali locale, so its results (when merged) are requested in English.
- **AI provider models**: the model IDs used (`gemini-2.0-flash`, `claude-sonnet-4-6`,
  `grok-2-latest`, `glm-4.6`) are set in each provider file under `src/lib/providers/` —
  update them there if a provider changes its model lineup.
- Puppeteer/headless-Chrome was intentionally avoided for PDF generation (heavier and
  more fragile on serverless) in favor of `pdf-lib`, which draws text directly and embeds
  fonts natively — faster cold starts on Vercel's serverless functions.

## 7. License

Provided as-is for the requester's use. SolaimanLipi is a freely distributed Bengali font;
verify its license terms before commercial redistribution.
