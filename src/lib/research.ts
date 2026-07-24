import type { ResearchRequest, ResearchResult, NewsItem } from '@/lib/types';
import { detectLanguage } from '@/lib/language';
import { webSearch } from './providers/web-search';
import { getProvider, getEngineName } from './providers/index';

export async function conductResearch(req: ResearchRequest): Promise<ResearchResult> {
  const language = detectLanguage(req.keyword);
  const reportLength = req.reportLength || 'detailed';
  const engine = req.engine;

  let information = '';
  let newsItems: NewsItem[] = [];
  let actualEngine = engine;

  if (engine === 'web') {
    // Pure web search
    const result = await webSearch(req.keyword, language, reportLength);
    information = result.information;
    newsItems = result.newsItems;
  } else {
    // AI provider
    const provider = getProvider(engine);
    if (provider && provider.isAvailable()) {
      const result = await provider.research(req.keyword, language, reportLength);
      information = result.information;
      newsItems = result.newsItems;
    }

    // Combine with web search if checkbox is on
    if (req.combineWithAI) {
      const webResult = await webSearch(req.keyword, language, reportLength);
      // Merge: use AI info as primary, append web news (dedup by link)
      if (webResult.information && webResult.information.length > information.length) {
        information = webResult.information;
      }
      const existingLinks = new Set(newsItems.map(n => n.link));
      const dedupedNews = webResult.newsItems.filter(n => !existingLinks.has(n.link));
      newsItems = [...newsItems, ...dedupedNews];
      actualEngine = engine; // Badge shows primary engine
    }
  }

  return {
    information,
    newsItems: newsItems.slice(0, reportLength === 'detailed' ? 15 : 8),
    engine: actualEngine,
    keyword: req.keyword,
    language,
    reportLength,
    timestamp: new Date().toISOString(),
  };
}
