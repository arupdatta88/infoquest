import { NextRequest, NextResponse } from 'next/server';
import { conductResearch } from '@/lib/research';
import type { ResearchRequest } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { keyword, engine, combineWithAI, reportLength } = body as ResearchRequest;

    if (!keyword || keyword.trim().length === 0) {
      return NextResponse.json({ error: 'Keyword is required' }, { status: 400 });
    }

    const result = await conductResearch({
      keyword: keyword.trim(),
      engine: engine || 'web',
      combineWithAI: combineWithAI || false,
      reportLength: reportLength || 'detailed',
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Research error:', error);
    return NextResponse.json(
      { error: error.message || 'Research failed' },
      { status: 500 }
    );
  }
}
