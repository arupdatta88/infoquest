import { NextRequest, NextResponse } from "next/server";
import { generateDocxReport } from "@/lib/docx";
import { ResearchResult } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const result = (await req.json()) as ResearchResult;
    if (!result?.keyword) {
      return NextResponse.json({ error: "Missing research result." }, { status: 400 });
    }
    const buffer = await generateDocxReport(result);
    const filename = `InfoQuest-${slugify(result.keyword)}.docx`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": contentDisposition(filename)
      }
    });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Failed to generate DOCX." }, { status: 500 });
  }
}

function contentDisposition(filename: string): string {
  const asciiFallback = filename.replace(/[^\x20-\x7E]/g, "_");
  return `attachment; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(filename)}`;
}

function slugify(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0980-\u09FF]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "report"
  );
}
