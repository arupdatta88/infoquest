# InfoQuest by Arup

A bilingual (Bengali + English) research and news-discovery tool.
Search any keyword and generate beautifully formatted, downloadable reports (PDF & Word).

## Deploy to Vercel

1. Extract this zip
2. Push to a Git repo (GitHub / GitLab / Bitbucket)
3. Import in [Vercel Dashboard](https://vercel.com/new)
4. Vercel auto-detects Next.js — click **Deploy**

### Bengali Font
The app bundles **SolaimanLipi** (`public/fonts/SolaimanLipi.ttf`) for correct
Bengali rendering on-screen, in PDF exports, and in Word documents.

### Optional AI Provider Keys

| Variable | Purpose |
|----------|---------|
| `GEMINI_API_KEY` | Enable Google Gemini |
| `CLAUDE_API_KEY` | Enable Anthropic Claude |
| `GROK_API_KEY` | Enable xAI Grok |
