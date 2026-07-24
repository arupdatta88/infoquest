// ====================================
// InfoQuest - Core Types
// ====================================

export type SearchEngine = 'web' | 'gemini' | 'claude' | 'grok' | 'zai';
export type AppLanguage = 'en' | 'bn';
export type ReportLength = 'brief' | 'detailed';
export type DownloadFormat = 'pdf' | 'docx';

export interface NewsItem {
  title: string;
  source: string;
  date: string;
  summary: string;
  link: string;
}

export interface ResearchResult {
  information: string;
  newsItems: NewsItem[];
  engine: SearchEngine;
  keyword: string;
  language: AppLanguage;
  reportLength: ReportLength;
  timestamp: string;
}

export interface ResearchRequest {
  keyword: string;
  engine: SearchEngine;
  combineWithAI?: boolean;
  aiEngine?: SearchEngine;
  reportLength?: ReportLength;
}

export interface EngineStatus {
  id: SearchEngine;
  name: string;
  icon: string;
  available: boolean;
  reason?: string;
}

export interface DownloadRequest {
  result: ResearchResult;
  format: DownloadFormat;
}

export interface SearchHistoryItem {
  id: string;
  keyword: string;
  engine: SearchEngine;
  language: AppLanguage;
  createdAt: string;
}

// Provider interface shared by all AI research providers
export interface AIResearchProvider {
  id: SearchEngine;
  name: string;
  isAvailable(): boolean;
  research(keyword: string, language: AppLanguage, reportLength: ReportLength): Promise<{ information: string; newsItems: NewsItem[] }>;
}