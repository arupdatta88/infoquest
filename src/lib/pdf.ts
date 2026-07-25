import "regenerator-runtime/runtime";
import { PDFDocument, PDFFont, PDFPage, rgb, StandardFonts } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import fs from "fs";
import path from "path";
import { ResearchResult } from "./types";
import { UI_STRINGS, UiStrings } from "./language";

const NAVY = rgb(0x06 / 255, 0x3d / 255, 0x2e / 255);
const GOLD = rgb(0x22 / 255, 0xa1 / 255, 0x74 / 255);
const CHARCOAL = rgb(0x20 / 255, 0x2e / 255, 0x28 / 255);
const PARCHMENT = rgb(0xf1 / 255, 0xfa / 255, 0xf5 / 255);
const MUTED = rgb(0x5f / 255, 0x76 / 255, 0x6c / 255);
const LINK_COLOR = rgb(0x0e / 255, 0x6b / 255, 0x5c / 255);
const SOFT_MINT = rgb(0xe8 / 255, 0xf5 / 255, 0xee / 255);

const PAGE_W = 595.28; // A4
const PAGE_H = 841.89;
const MARGIN = 56;

export async function generatePdfReport(result: ResearchResult): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);

  const isBengali = result.language === "bn";
  const t = UI_STRINGS[result.language];

  const fontBytes = fs.readFileSync(path.join(process.cwd(), "public/fonts/SolaimanLipi.ttf"));
  const bengaliFont = await doc.embedFont(fontBytes, { subset: true });
  const helvetica = await doc.embedFont(StandardFonts.Helvetica);
  const helveticaBold = await doc.embedFont(StandardFonts.HelveticaBold);
  const timesBold = await doc.embedFont(StandardFonts.TimesRomanBold);

  // Body/heading fonts chosen per detected language so Bengali always renders correctly.
  const bodyFont = isBengali ? bengaliFont : helvetica;
  const headingFont = isBengali ? bengaliFont : timesBold;
  const boldFont = isBengali ? bengaliFont : helveticaBold;

  const ctx: PdfCtx = {
    doc,
    bodyFont,
    headingFont,
    boldFont,
    pageIndex: 0,
    footerNote: t.footer
  };

  drawCoverPage(ctx, result, t);
  drawInformationSection(ctx, result, t);
  drawNewsSection(ctx, result, t);

  finalizeFooters(ctx);

  return doc.save();
}

interface PdfCtx {
  doc: PDFDocument;
  bodyFont: PDFFont;
  headingFont: PDFFont;
  boldFont: PDFFont;
  pageIndex: number;
  footerNote: string;
}

function drawCoverPage(ctx: PdfCtx, result: ResearchResult, t: UiStrings) {
  const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PARCHMENT });

  // Logo mark: magnifying glass merged with an open-book / globe motif.
  const cx = PAGE_W / 2;
  const logoY = PAGE_H - 200;
  page.drawCircle({ x: cx - 8, y: logoY, size: 34, borderColor: NAVY, borderWidth: 3.5 });
  page.drawLine({
    start: { x: cx + 15, y: logoY - 24 },
    end: { x: cx + 44, y: logoY - 53 },
    thickness: 6,
    color: NAVY
  });
  page.drawCircle({ x: cx - 8, y: logoY, size: 6, color: GOLD });

  page.drawText("InfoQuest", {
    x: cx - ctx.headingFont.widthOfTextAtSize("InfoQuest", 40) / 2,
    y: logoY - 90,
    size: 40,
    font: ctx.headingFont,
    color: NAVY
  });
  page.drawText("by Arup", {
    x: cx - ctx.bodyFont.widthOfTextAtSize("by Arup", 15) / 2,
    y: logoY - 115,
    size: 15,
    font: ctx.bodyFont,
    color: GOLD
  });

  // divider
  page.drawLine({
    start: { x: cx - 90, y: logoY - 140 },
    end: { x: cx + 90, y: logoY - 140 },
    thickness: 1.5,
    color: GOLD
  });

  const keywordLines = wrapText(result.keyword, ctx.boldFont, 22, PAGE_W - MARGIN * 2 - 40);
  let ky = logoY - 190;
  for (const line of keywordLines) {
    page.drawText(line, {
      x: cx - ctx.boldFont.widthOfTextAtSize(line, 22) / 2,
      y: ky,
      size: 22,
      font: ctx.boldFont,
      color: CHARCOAL
    });
    ky -= 28;
  }

  const dateStr = new Date(result.generatedAt).toLocaleDateString(result.language === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
  page.drawText(dateStr, {
    x: cx - ctx.bodyFont.widthOfTextAtSize(dateStr, 11) / 2,
    y: ky - 10,
    size: 11,
    font: ctx.bodyFont,
    color: MUTED
  });

  // "Researched via" badge
  const badgeText = `${t.researchedVia}: ${result.engineLabel}`;
  const badgeWidth = ctx.bodyFont.widthOfTextAtSize(badgeText, 10.5) + 28;
  const badgeX = cx - badgeWidth / 2;
  const badgeY = 90;
  page.drawRectangle({
    x: badgeX,
    y: badgeY,
    width: badgeWidth,
    height: 26,
    color: NAVY,
    borderColor: GOLD,
    borderWidth: 1
  });
  page.drawText(badgeText, {
    x: badgeX + 14,
    y: badgeY + 8,
    size: 10.5,
    font: ctx.bodyFont,
    color: rgb(1, 1, 1)
  });
}

function drawInformationSection(ctx: PdfCtx, result: ResearchResult, t: UiStrings) {
  let { page, y } = newContentPage(ctx);
  y = drawSectionHeading(page, ctx, t.keywordSummary, y);

  const paragraphs = result.information.split(/\n\s*\n/).filter((p) => p.trim());
  for (const para of paragraphs) {
    const lines = wrapText(para.trim(), ctx.bodyFont, 11.5, PAGE_W - MARGIN * 2);
    for (const line of lines) {
      if (y < MARGIN + 40) {
        ({ page, y } = newContentPage(ctx));
      }
      page.drawText(line, { x: MARGIN, y, size: 11.5, font: ctx.bodyFont, color: CHARCOAL });
      y -= 17;
    }
    y -= 10;
  }
}

interface TableColumn {
  key: "serial" | "title" | "description" | "link";
  label: string;
  x: number;
  width: number;
}

const CELL_PAD = 6;
const HEADER_ROW_H = 24;
const TABLE_LINE_H = 11.5;

function buildTableColumns(t: UiStrings): TableColumn[] {
  const totalWidth = PAGE_W - MARGIN * 2;
  const serialW = 30;
  const titleW = 118;
  const descW = 195;
  const linkW = totalWidth - serialW - titleW - descW;

  let x = MARGIN;
  const defs: Array<[TableColumn["key"], string, number]> = [
    ["serial", t.serialLabel, serialW],
    ["title", t.newsTitleLabel, titleW],
    ["description", t.briefDescriptionLabel, descW],
    ["link", t.fullNewsLinkLabel, linkW]
  ];
  return defs.map(([key, label, width]) => {
    const col = { key, label, x, width };
    x += width;
    return col;
  });
}

function drawTableHeaderRow(page: PDFPage, ctx: PdfCtx, cols: TableColumn[], y: number): number {
  const totalWidth = cols.reduce((s, c) => s + c.width, 0);
  page.drawRectangle({ x: MARGIN, y: y - HEADER_ROW_H, width: totalWidth, height: HEADER_ROW_H, color: NAVY });
  for (const col of cols) {
    page.drawText(col.label, {
      x: col.x + CELL_PAD,
      y: y - HEADER_ROW_H + 8,
      size: 10,
      font: ctx.boldFont,
      color: rgb(1, 1, 1)
    });
  }
  return y - HEADER_ROW_H;
}

interface CellLine {
  text: string;
  font: PDFFont;
  size: number;
  color: ReturnType<typeof rgb>;
}

function drawNewsSection(ctx: PdfCtx, result: ResearchResult, t: UiStrings) {
  let { page, y } = newContentPage(ctx);
  y = drawSectionHeading(page, ctx, t.latestNews, y);

  if (result.newsItems.length === 0) {
    page.drawText(t.noResults, { x: MARGIN, y, size: 11, font: ctx.bodyFont, color: MUTED });
    return;
  }

  const cols = buildTableColumns(t);
  const totalWidth = cols.reduce((s, c) => s + c.width, 0);
  y = drawTableHeaderRow(page, ctx, cols, y);

  result.newsItems.forEach((item, idx) => {
    const dateStr = formatDate(item.date, result.language);
    const meta = [item.source, dateStr].filter(Boolean).join("  •  ");

    const serialLines: CellLine[] = [{ text: String(idx + 1), font: ctx.bodyFont, size: 9.5, color: CHARCOAL }];

    const titleLines: CellLine[] = wrapText(item.title || "(untitled)", ctx.boldFont, 9.5, cols[1].width - CELL_PAD * 2).map(
      (line) => ({ text: line, font: ctx.boldFont, size: 9.5, color: NAVY })
    );
    const metaLines: CellLine[] = meta
      ? wrapText(meta, ctx.bodyFont, 8, cols[1].width - CELL_PAD * 2).map((line) => ({
          text: line,
          font: ctx.bodyFont,
          size: 8,
          color: GOLD
        }))
      : [];

    const descLines: CellLine[] = wrapText(item.summary || "—", ctx.bodyFont, 9, cols[2].width - CELL_PAD * 2).map(
      (line) => ({ text: line, font: ctx.bodyFont, size: 9, color: CHARCOAL })
    );

    const linkLines: CellLine[] = wrapText(item.link || "—", ctx.bodyFont, 8, cols[3].width - CELL_PAD * 2).map(
      (line) => ({ text: line, font: ctx.bodyFont, size: 8, color: item.link ? LINK_COLOR : MUTED })
    );

    const colLineSets: CellLine[][] = [serialLines, [...titleLines, ...metaLines], descLines, linkLines];
    const rowHeight = Math.max(...colLineSets.map((lines) => lines.length * TABLE_LINE_H)) + CELL_PAD * 2;

    if (y - rowHeight < MARGIN + 30) {
      ({ page, y } = newContentPage(ctx));
      y = drawTableHeaderRow(page, ctx, cols, y);
    }

    if (idx % 2 === 1) {
      page.drawRectangle({ x: MARGIN, y: y - rowHeight, width: totalWidth, height: rowHeight, color: SOFT_MINT });
    }

    colLineSets.forEach((lines, colIdx) => {
      const col = cols[colIdx];
      let lineY = y - CELL_PAD - 8;
      for (const line of lines) {
        page.drawText(line.text, { x: col.x + CELL_PAD, y: lineY, size: line.size, font: line.font, color: line.color });
        lineY -= TABLE_LINE_H;
      }
    });

    // Row grid lines
    page.drawLine({
      start: { x: MARGIN, y: y - rowHeight },
      end: { x: MARGIN + totalWidth, y: y - rowHeight },
      thickness: 0.75,
      color: GOLD
    });
    let vx = MARGIN;
    for (const col of cols) {
      page.drawLine({ start: { x: vx, y }, end: { x: vx, y: y - rowHeight }, thickness: 0.5, color: SOFT_MINT });
      vx += col.width;
    }
    page.drawLine({ start: { x: vx, y }, end: { x: vx, y: y - rowHeight }, thickness: 0.5, color: SOFT_MINT });

    y -= rowHeight;
  });
}

function newContentPage(ctx: PdfCtx): { page: PDFPage; y: number } {
  const page = ctx.doc.addPage([PAGE_W, PAGE_H]);
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: PAGE_H, color: PARCHMENT });
  ctx.pageIndex += 1;
  return { page, y: PAGE_H - MARGIN };
}

function drawSectionHeading(page: PDFPage, ctx: PdfCtx, title: string, y: number): number {
  page.drawText(title, { x: MARGIN, y, size: 20, font: ctx.headingFont, color: NAVY });
  const width = ctx.headingFont.widthOfTextAtSize(title, 20);
  page.drawLine({
    start: { x: MARGIN, y: y - 10 },
    end: { x: MARGIN + Math.max(width, 120), y: y - 10 },
    thickness: 2.5,
    color: GOLD
  });
  return y - 40;
}

function finalizeFooters(ctx: PdfCtx) {
  const pages = ctx.doc.getPages();
  pages.forEach((page, i) => {
    const label = `${ctx.footerNote}  ·  ${i + 1} / ${pages.length}`;
    page.drawText(label, {
      x: MARGIN,
      y: 28,
      size: 8.5,
      font: ctx.bodyFont,
      color: MUTED
    });
  });
}

function formatDate(iso: string, language: "bn" | "en"): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(language === "bn" ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

/** Greedy word-wrap using the actual font metrics so Bengali (and English) both wrap correctly. */
function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  if (!text) return [];
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";

  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    const width = safeWidth(font, candidate, size);
    if (width <= maxWidth || !current) {
      current = candidate;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

function safeWidth(font: PDFFont, text: string, size: number): number {
  try {
    return font.widthOfTextAtSize(text, size);
  } catch {
    return text.length * size * 0.55;
  }
}
