import { NextResponse } from "next/server";
import { getEngineOptions } from "@/lib/providers";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ engines: getEngineOptions() });
}
