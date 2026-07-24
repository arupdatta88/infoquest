import ZAI from 'z-ai-web-dev-sdk';
import type { NewsItem, AppLanguage, ReportLength } from '@/lib/types';

export async function webSearch(keyword: string, language: AppLanguage, reportLength: ReportLength) {
  const zai = await ZAI.create();

  // Search for general information
  const infoQuery = language === 'bn'
    ? `${keyword} তথ্য উইকিপিডিয়া`
    : `${keyword} information overview wikipedia`;

  const infoLimit = reportLength === 'detailed' ? 10 : 5;

  const infoResults = await zai.functions.invoke('web_search', {
    query: infoQuery,
    num: infoLimit,
  });

  // Search for news
  const newsQuery = language === 'bn'
    ? `${keyword} সাম্প্রতিক সংবাদ`
    : `${keyword} latest news`;

  const newsResults = await zai.functions.invoke('web_search', {
    query: newsQuery,
    num: 15,
  });

  // Use LLM to synthesize information from search results
  const information = await synthesizeInfo(keyword, infoResults, language, reportLength);

  // Build news items
  const newsItems: NewsItem[] = newsResults
    .filter((r: any) => r.name && r.snippet)
    .slice(0, reportLength === 'detailed' ? 10 : 5)
    .map((r: any) => ({
      title: r.name || '',
      source: r.host_name || '',
      date: r.date || 'N/A',
      summary: r.snippet || '',
      link: r.url || '',
    }));

  return { information, newsItems };
}

async function synthesizeInfo(keyword: string, results: any[], language: AppLanguage, reportLength: ReportLength): Promise<string> {
  const zai = await ZAI.create();

  const context = results
    .slice(0, 5)
    .map((r: any, i: number) => `${i + 1}. ${r.name}\n${r.snippet}`)
    .join('\n\n');

  const langInstruction = language === 'bn'
    ? 'Write the response entirely in Bengali (Bangla script).'
    : 'Write the response in English.';

  const lengthInstruction = reportLength === 'detailed'
    ? 'Provide a comprehensive, detailed explanation with multiple paragraphs, key facts, background context, and relevant details.'
    : 'Provide a concise but informative summary in 2-3 paragraphs covering the key points.';

  const completion = await zai.chat.completions.create({
    messages: [
      {
        role: 'assistant',
        content: `You are a research assistant. ${langInstruction} ${lengthInstruction} Organize information clearly with proper structure.`,
      },
      {
        role: 'user',
        content: `Research topic: "${keyword}"\n\nHere are the top search results:\n${context}\n\nPlease synthesize this into a well-organized informational summary about "${keyword}".`,
      },
    ],
    thinking: { type: 'disabled' },
  });

  return completion.choices[0]?.message?.content || 'No information could be gathered.';
}
