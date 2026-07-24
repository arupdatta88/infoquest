import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ResearchResult } from '@/lib/types';
import { getLabels } from '@/lib/language';
import { getEngineName } from '@/lib/providers/index';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function generatePDF(result: ResearchResult): Promise<Uint8Array> {
  const labels = getLabels(result.language);
  const isBengali = result.language === 'bn';

  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontItalic = await pdfDoc.embedFont(StandardFonts.HelveticaOblique);

  // Embed SolaimanLipi for Bengali text
  let bengaliFont: any = font;
  try {
    const fontBytes = readFileSync(join(process.cwd(), 'public', 'fonts', 'SolaimanLipi.ttf'));
    bengaliFont = await pdfDoc.embedFont(fontBytes);
  } catch {
    // Fallback to Helvetica if font file not found
    bengaliFont = font;
  }

  // Helper: pick the correct font based on language context
  const bodyFont = isBengali ? bengaliFont : font;
  const headingFont = isBengali ? bengaliFont : fontBold;
  const labelFont = isBengali ? bengaliFont : fontItalic;

  const pageWidth = 595.28; // A4
  const pageHeight = 841.89;
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  const navyColor = rgb(0.106, 0.165, 0.290);
  const goldColor = rgb(0.851, 0.643, 0.255);
  const charcoalColor = rgb(0.176, 0.176, 0.176);
  const mutedColor = rgb(0.42, 0.42, 0.42);
  let currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;
  const lineHeight = isBengali ? 20 : 16;
  const bodyFontSize = isBengali ? 12 : 11;

  function addPage() {
    currentPage = pdfDoc.addPage([pageWidth, pageHeight]);
    y = pageHeight - margin;
    stampFooter(pdfDoc.getPageCount());
  }

  function stampFooter(num: number) {
    const total = pdfDoc.getPageCount();
    currentPage.drawText(`${num} / ${total}`, {
      x: pageWidth / 2 - 20, y: 25, size: 9, font, color: mutedColor,
    });
    currentPage.drawText(labels.footerText, {
      x: margin, y: 25, size: 8, font, color: mutedColor,
    });
  }

  function wrapText(text: string, maxWidth: number, size: number, f: any): string[] {
    const lines: string[] = [];
    let currentLine = '';
    for (const char of text) {
      const testLine = currentLine + char;
      const width = f.widthOfTextAtSize(testLine, size);
      if (width > maxWidth && currentLine.length > 0) {
        lines.push(currentLine);
        currentLine = char;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);
    return lines;
  }

  function drawWrapped(text: string, x: number, size: number, f: any, color: any, maxW?: number) {
    const w = maxW || contentWidth;
    for (const line of wrapText(text, w, size, f)) {
      if (y < margin + 40) addPage();
      currentPage.drawText(line, { x, y, size, font: f, color });
      y -= lineHeight;
    }
  }

  // ===== COVER PAGE =====
  currentPage.drawRectangle({
    x: 0, y: pageHeight - 200, width: pageWidth, height: 200,
    color: navyColor,
  });
  currentPage.drawRectangle({
    x: margin, y: pageHeight - 205, width: contentWidth, height: 3,
    color: goldColor,
  });

  // App name on cover
  y = pageHeight - 100;
  currentPage.drawText(labels.appName, {
    x: margin, y, size: 32, font: fontBold, color: rgb(1, 1, 1),
  });
  y -= 25;
  currentPage.drawText(labels.subtitle, {
    x: margin, y, size: 14, font, color: goldColor,
  });

  y = pageHeight - 240;
  currentPage.drawText(labels.coverTitle, {
    x: margin, y, size: 18, font: fontBold, color: navyColor,
  });
  y -= 30;
  currentPage.drawText(`${labels.coverSearched} ${result.keyword}`, {
    x: margin, y, size: 14, font: bodyFont, color: charcoalColor,
  });
  y -= 22;
  const dateStr = new Date(result.timestamp).toLocaleDateString(
    isBengali ? 'bn-BD' : 'en-US',
    { year: 'numeric', month: 'long', day: 'numeric' },
  );
  currentPage.drawText(`${labels.coverDate} ${dateStr}`, {
    x: margin, y, size: 12, font, color: mutedColor,
  });
  y -= 22;
  currentPage.drawText(`${labels.coverEngine} ${getEngineName(result.engine)}`, {
    x: margin, y, size: 12, font, color: goldColor,
  });

  // ===== SECTION 1: What We Found =====
  y -= 40;
  if (y < margin + 80) addPage();

  currentPage.drawRectangle({
    x: margin, y: y - 4, width: 50, height: 3, color: goldColor,
  });
  y -= 30;
  currentPage.drawText(labels.sectionInfo, {
    x: margin, y, size: 20, font: headingFont, color: navyColor,
  });
  y -= 30;

  for (const para of result.information.split('\n\n')) {
    if (para.trim()) {
      drawWrapped(para.trim(), margin, bodyFontSize, bodyFont, charcoalColor);
      y -= 8;
    }
  }

  // ===== SECTION 2: Latest News =====
  y -= 30;
  if (y < margin + 80) addPage();

  currentPage.drawRectangle({
    x: margin, y: y - 4, width: 50, height: 3, color: goldColor,
  });
  y -= 30;
  currentPage.drawText(labels.sectionNews, {
    x: margin, y, size: 20, font: headingFont, color: navyColor,
  });
  y -= 30;

  if (result.newsItems.length === 0) {
    drawWrapped(
      isBengali ? 'কোনো সংবাদ পাওয়া যায়নি।' : 'No news articles found.',
      margin, bodyFontSize, labelFont, mutedColor,
    );
  } else {
    for (let i = 0; i < result.newsItems.length; i++) {
      const item = result.newsItems[i];
      if (y < margin + 80) addPage();

      currentPage.drawText(`${i + 1}.`, {
        x: margin, y, size: 13, font: fontBold, color: goldColor,
      });

      drawWrapped(item.title, margin + 22, 12, headingFont, navyColor, contentWidth - 22);

      const metaLine = `${labels.sourceLabel}: ${item.source}  •  ${labels.dateLabel}: ${item.date}`;
      drawWrapped(metaLine, margin + 22, 9, labelFont, mutedColor, contentWidth - 22);

      drawWrapped(item.summary, margin + 22, 10, bodyFont, charcoalColor, contentWidth - 22);

      if (item.link) {
        drawWrapped(item.link, margin + 22, 9, font, rgb(0.2, 0.4, 0.7), contentWidth - 22);
      }

      y -= 16;
    }
  }

  // Stamp footer on page 1
  stampFooter(1);

  return pdfDoc.save();
}
