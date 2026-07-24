import ZAI from 'z-ai-web-dev-sdk';
import type { AIResearchProvider, NewsItem, AppLanguage, ReportLength } from '@/lib/types';

export class ZaiProvider implements AIResearchProvider {
  id = 'zai' as const;
  name = 'Z.ai';

  isAvailable(): boolean {
    return true; // Always available via z-ai-web-dev-sdk
  }

  async research(keyword: string, language: AppLanguage, reportLength: ReportLength) {
    const zai = await ZAI.create();

    const langInstruction = language === 'bn'
      ? 'Write the ENTIRE response in Bengali (Bangla script). All section titles, all content, everything must be in Bengali.'
      : 'Write the response in English.';

    const lengthInstruction = reportLength === 'detailed'
      ? 'Provide a comprehensive, detailed explanation with multiple paragraphs, key facts, background context, definitions, and relevant details.'
      : 'Provide a concise but informative summary in 2-3 paragraphs covering the key points.';

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'assistant',
          content: `You are an expert research assistant. ${langInstruction} ${lengthInstruction}

You MUST return your response in this exact JSON format (no markdown, no code fences, just raw JSON):
{
  "information": "A well-organized informational summary here with paragraphs...",
  "newsItems": [
    {
      "title": "News article title",
      "source": "Source name",
      "date": "YYYY-MM-DD or approximate date",
      "summary": "Brief summary of the news",
      "link": "https://example.com/article"
    }
  ]
}

Include 5-10 recent, relevant news items if ${reportLength === 'detailed'} else 3-5. If you don't know exact URLs, use empty string for link. Make dates as accurate as possible.`,
        },
        {
          role: 'user',
          content: `Research this topic thoroughly: "${keyword}"`,
        },
      ],
      thinking: { type: 'disabled' },
    });

    const raw = completion.choices[0]?.message?.content || '';

    try {
      // Try to parse JSON, handling possible markdown code fences
      let jsonStr = raw.trim();
      const fenceMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) {
        jsonStr = fenceMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      const newsItems: NewsItem[] = (parsed.newsItems || []).map((item: any) => ({
        title: item.title || '',
        source: item.source || '',
        date: item.date || 'N/A',
        summary: item.summary || '',
        link: item.link || '',
      }));

      return {
        information: parsed.information || 'No information available.',
        newsItems,
      };
    } catch {
      // If JSON parsing fails, return raw text as information
      return {
        information: raw,
        newsItems: [],
      };
    }
  }
}
