import { NextResponse } from 'next/server';
import { getEngineStatuses } from '@/lib/providers/index';

export async function GET() {
  return NextResponse.json(getEngineStatuses());
}
