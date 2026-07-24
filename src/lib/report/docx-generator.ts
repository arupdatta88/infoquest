import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, BorderStyle, TabStopPosition, TabStopType, Header, Footer, PageNumber, NumberFormat } from 'docx';
import type { ResearchResult } from '@/lib/types';
import { getLabels } from '@/lib/language';
import { getEngineName } from '@/lib/providers/index';

export async function generateDOCX(result: ResearchResult): Promise<Buffer> {
  const labels = getLabels(result.language);
  const dateStr = new Date(result.timestamp).toLocaleDateString(result.language === 'bn' ? 'bn-BD' : 'en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  const isBengali = result.language === 'bn';
  const bodyFont = isBengali ? 'SolaimanLipi' : undefined; // SolaimanLipi for Bengali, system default for English

  const sections: any[] = [];

  // Cover page section
  sections.push({
    properties: {
      page: {
        margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 },
      },
    },
    headers: {
      default: new Header({
        children: [],
      }),
    },
    footers: {
      default: new Footer({
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ children: labels.footerText, italics: true, size: 16, color: '888888' }),
            ],
          }),
        ],
      }),
    },
    children: [
      // Spacer
      new Paragraph({ spacing: { after: 2000 }, children: [] }),
      // App name
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({
            children: labels.appName,
            bold: true,
            size: 64,
            color: '1B2A4A',
            font: 'Merriweather',
          }),
        ],
      }),
      // Subtitle
      new Paragraph({
        spacing: { after: 800 },
        children: [
          new TextRun({
            children: labels.subtitle,
            italics: true,
            size: 28,
            color: 'D9A441',
          }),
        ],
      }),
      // Report title
      new Paragraph({
        spacing: { after: 200 },
        children: [
          new TextRun({
            children: labels.coverTitle,
            bold: true,
            size: 36,
            color: '1B2A4A',
          }),
        ],
      }),
      // Keyword
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ children: `${labels.coverSearched} `, size: 24, color: '2D2D2D' }),
          new TextRun({ children: result.keyword, bold: true, size: 24, color: '2D2D2D' }),
        ],
      }),
      // Date
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ children: `${labels.coverDate} `, size: 22, color: '6B7280' }),
          new TextRun({ children: dateStr, size: 22, color: '6B7280' }),
        ],
      }),
      // Engine
      new Paragraph({
        spacing: { after: 100 },
        children: [
          new TextRun({ children: `${labels.coverEngine} `, size: 22, color: '6B7280' }),
          new TextRun({ children: getEngineName(result.engine), bold: true, size: 22, color: 'D9A441' }),
        ],
      }),
      // Page break
      new Paragraph({
        children: [new TextRun({ break: 1 })],
      }),
      // Section 1 header
      new Paragraph({
        spacing: { after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D9A441', space: 8 } },
        children: [
          new TextRun({
            children: labels.sectionInfo,
            bold: true,
            size: 36,
            color: '1B2A4A',
          }),
        ],
      }),
      // Information paragraphs
      ...result.information.split('\n\n').map(
        (para) =>
          new Paragraph({
            spacing: { after: 200 },
            children: [
              new TextRun({
                children: para.trim(),
                size: 22,
                color: '2D2D2D',
                font: bodyFont,
              }),
            ],
          })
      ),
      // Section 2 header
      new Paragraph({
        spacing: { before: 400, after: 100 },
        border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D9A441', space: 8 } },
        children: [
          new TextRun({
            children: labels.sectionNews,
            bold: true,
            size: 36,
            color: '1B2A4A',
          }),
        ],
      }),
      // News items
      ...(result.newsItems.length === 0
        ? [
            new Paragraph({
              children: [
                new TextRun({
                  children: result.language === 'bn' ? 'কোনো সংবাদ পাওয়া যায়নি।' : 'No news articles found.',
                  italics: true,
                  size: 22,
                  color: '888888',
                }),
              ],
            }),
          ]
        : result.newsItems.flatMap((item, i) => [
            new Paragraph({
              spacing: { before: 300, after: 80 },
              children: [
                new TextRun({ children: `${i + 1}. `, bold: true, size: 24, color: 'D9A441' }),
                new TextRun({ children: item.title, bold: true, size: 24, color: '1B2A4A', font: bodyFont }),
              ],
            }),
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ children: `${labels.sourceLabel}: `, size: 18, italics: true, color: '888888' }),
                new TextRun({ children: item.source, size: 18, color: '888888' }),
                new TextRun({ children: `  •  ${labels.dateLabel}: `, size: 18, italics: true, color: '888888' }),
                new TextRun({ children: item.date, size: 18, color: '888888' }),
              ],
            }),
            new Paragraph({
              spacing: { after: 60 },
              children: [
                new TextRun({ children: item.summary, size: 20, color: '2D2D2D', font: bodyFont }),
              ],
            }),
            ...(item.link
              ? [
                  new Paragraph({
                    spacing: { after: 100 },
                    children: [
                      new TextRun({ children: item.link, size: 18, color: '3366AA', underline: {} }),
                    ],
                  }),
                ]
              : []),
          ])),
    ],
  });

  const doc = new Document({
    creator: 'InfoQuest by Arup',
    title: `InfoQuest: ${result.keyword}`,
    description: `Research report for: ${result.keyword}`,
    sections,
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
