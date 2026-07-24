import { NextRequest, NextResponse } from 'next/server';
import { generateDOCX } from '@/lib/report/docx-generator';
import type { ResearchResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = body as ResearchResult;

    if (!result.keyword || !result.information) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 400 });
    }

    const docxBuffer = await generateDOCX(result);

    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="infoquest-${encodeURIComponent(result.keyword)}-${Date.now()}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('DOCX generation error:', error);
    return NextResponse.json({ error: error.message || 'DOCX generation failed' }, { status: 500 });
  }
}
