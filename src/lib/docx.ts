import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  TextRun
} from "docx";
import { ResearchResult } from "./types";
import { UI_STRINGS } from "./language";

const NAVY = "063D2E";
const GOLD = "22A174";
const CHARCOAL = "202E28";
const MUTED = "5F766C";

export async function generateDocxReport(result: ResearchResult): Promise<Buffer> {
  const isBengali = result.language === "bn";
  const t = UI_STRINGS[result.language];
  // SolaimanLipi is bundled at /public/fonts/SolaimanLipi.ttf and referenced by family name here.
  // Word renders it correctly on machines that have the font installed; otherwise it falls back
  // to Noto Sans Bengali / a system Bengali-capable font. The PDF export always embeds the font.
  const bodyFontName = isBengali ? "SolaimanLipi" : "Calibri";
  const headingFontName = isBengali ? "SolaimanLipi" : "Georgia";

  const dateStr = new Date(result.generatedAt).toLocaleDateString(isBengali ? "bn-BD" : "en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  const coverParagraphs = [
    new Paragraph({ spacing: { before: 2400, after: 0 }, alignment: AlignmentType.CENTER, children: [] }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({ text: "InfoQuest", bold: true, size: 64, color: NAVY, font: headingFontName })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
      children: [new TextRun({ text: "by Arup", size: 26, color: GOLD, italics: true, font: bodyFontName })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      border: {
        bottom: { style: BorderStyle.SINGLE, size: 6, color: GOLD, space: 8 }
      },
      spacing: { after: 400 },
      children: [new TextRun({ text: " ", size: 2 })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({ text: result.keyword, bold: true, size: 34, color: CHARCOAL, font: bodyFontName })
      ]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 1600 },
      children: [new TextRun({ text: dateStr, size: 20, color: MUTED, font: bodyFontName })]
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      shading: { fill: NAVY },
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${t.researchedVia}: ${result.engineLabel}`,
          color: "FFFFFF",
          size: 20,
          font: bodyFontName
        })
      ]
    }),
    new Paragraph({ pageBreakBefore: true, children: [] })
  ];

  const infoParagraphs = [
    sectionHeading(t.keywordSummary, headingFontName),
    ...result.information
      .split(/\n\s*\n/)
      .filter((p) => p.trim())
      .map(
        (p) =>
          new Paragraph({
            spacing: { after: 220 },
            alignment: isBengali ? AlignmentType.LEFT : AlignmentType.JUSTIFIED,
            children: [new TextRun({ text: p.trim(), size: 23, color: CHARCOAL, font: bodyFontName })]
          })
      )
  ];

  const newsParagraphs = [
    new Paragraph({ pageBreakBefore: true, children: [sectionHeadingRun(t.latestNews, headingFontName)] }),
    dividerParagraph(),
    ...(result.newsItems.length === 0
      ? [
          new Paragraph({
            spacing: { before: 200 },
            children: [new TextRun({ text: t.noResults, size: 22, color: MUTED, font: bodyFontName })]
          })
        ]
      : result.newsItems.flatMap((item, idx) => {
          const metaBits = [item.source, formatDate(item.date, result.language)].filter(Boolean).join("  •  ");
          const paras: Paragraph[] = [
            new Paragraph({
              spacing: { before: 260, after: 40 },
              children: [
                new TextRun({ text: `${idx + 1}. `, bold: true, color: NAVY, size: 24, font: bodyFontName }),
                new TextRun({ text: item.title || "(untitled)", bold: true, color: NAVY, size: 24, font: bodyFontName })
              ]
            })
          ];
          if (metaBits) {
            paras.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: metaBits, italics: true, color: GOLD, size: 19, font: bodyFontName })]
              })
            );
          }
          if (item.summary) {
            paras.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: item.summary, color: CHARCOAL, size: 21, font: bodyFontName })]
              })
            );
          }
          if (item.link) {
            paras.push(
              new Paragraph({
                spacing: { after: 60 },
                children: [new TextRun({ text: item.link, color: "1B5E44", size: 19, font: bodyFontName })]
              })
            );
          }
          return paras;
        }))
  ];

  const doc = new Document({
    sections: [
      {
        properties: {},
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: `${t.footer}  ·  `, size: 16, color: MUTED, font: bodyFontName }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 16, color: MUTED, font: bodyFontName }),
                  new TextRun({ text: " / ", size: 16, color: MUTED, font: bodyFontName }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES], size: 16, color: MUTED, font: bodyFontName })
                ]
              })
            ]
          })
        },
        children: [...coverParagraphs, ...infoParagraphs, ...newsParagraphs]
      }
    ]
  });

  return Packer.toBuffer(doc);
}

function sectionHeading(text: string, font: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { after: 120 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
    children: [new TextRun({ text, bold: true, size: 32, color: NAVY, font })]
  });
}

function sectionHeadingRun(text: string, font: string): TextRun {
  return new TextRun({ text, bold: true, size: 32, color: NAVY, font });
}

function dividerParagraph(): Paragraph {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: GOLD, space: 6 } },
    spacing: { after: 160 },
    children: [new TextRun({ text: " ", size: 2 })]
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
