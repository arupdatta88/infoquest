import type { AIResearchProvider, SearchEngine, EngineStatus } from '@/lib/types';
import { ZaiProvider } from './zai-provider';

// AI provider instances - Z.ai is always available
const providers = new Map<string, AIResearchProvider>([
  ['zai', new ZaiProvider()],
]);

export function getProvider(id: SearchEngine): AIResearchProvider | null {
  return providers.get(id) || null;
}

export function getEngineStatuses(): EngineStatus[] {
  const statuses: EngineStatus[] = [
    {
      id: 'web',
      name: 'Web Search',
      icon: '🔍',
      available: true,
    },
    {
      id: 'zai',
      name: 'AI: Z.ai',
      icon: '🤖',
      available: true,
    },
    {
      id: 'gemini',
      name: 'AI: Gemini',
      icon: '✨',
      available: false,
      reason: 'API key not configured',
    },
    {
      id: 'claude',
      name: 'AI: Claude',
      icon: '🧠',
      available: false,
      reason: 'API key not configured',
    },
    {
      id: 'grok',
      name: 'AI: Grok',
      icon: '⚡',
      available: false,
      reason: 'API key not configured',
    },
  ];

  return statuses;
}

export function getEngineName(id: SearchEngine): string {
  const names: Record<SearchEngine, string> = {
    web: 'Web Search',
    zai: 'Z.ai',
    gemini: 'Gemini',
    claude: 'Claude',
    grok: 'Grok',
  };
  return names[id];
}
