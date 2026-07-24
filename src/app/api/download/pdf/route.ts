import { NextRequest, NextResponse } from 'next/server';
import { generatePDF } from '@/lib/report/pdf-generator';
import type { ResearchResult } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const result = body as ResearchResult;

    if (!result.keyword || !result.information) {
      return NextResponse.json({ error: 'Invalid report data' }, { status: 400 });
    }

    const pdfBytes = await generatePDF(result);

    return new NextResponse(pdfBytes, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="infoquest-${encodeURIComponent(result.keyword)}-${Date.now()}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: error.message || 'PDF generation failed' }, { status: 500 });
  }
}
