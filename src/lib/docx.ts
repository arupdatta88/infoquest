import {
  AlignmentType,
  BorderStyle,
  Document,
  ExternalHyperlink,
  Footer,
  HeadingLevel,
  Packer,
  PageNumber,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType
} from "docx";
import { ResearchResult } from "./types";
import { UI_STRINGS, UiStrings } from "./language";

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
      : [buildNewsTable(result, t, bodyFontName)])
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

/** Builds the Latest News table: Serial | News Title | Brief Description | Full News Link. */
function buildNewsTable(result: ResearchResult, t: UiStrings, bodyFontName: string): Table {
  const headerRow = new TableRow({
    tableHeader: true,
    children: [
      headerCell(t.serialLabel, bodyFontName, 8),
      headerCell(t.newsTitleLabel, bodyFontName, 22),
      headerCell(t.briefDescriptionLabel, bodyFontName, 45),
      headerCell(t.fullNewsLinkLabel, bodyFontName, 25)
    ]
  });

  const bodyRows = result.newsItems.map((item, idx) => {
    const dateStr = formatDate(item.date, result.language);
    const title = item.title || "(untitled)";
    const metaBits = [item.source, dateStr].filter(Boolean).join("  •  ");

    return new TableRow({
      children: [
        bodyCell(
          [new Paragraph({ children: [new TextRun({ text: String(idx + 1), color: CHARCOAL, size: 20, font: bodyFontName })] })],
          bodyFontName
        ),
        bodyCell(
          [
            new Paragraph({
              children: [new TextRun({ text: title, bold: true, color: NAVY, size: 20, font: bodyFontName })]
            }),
            ...(metaBits
              ? [
                  new Paragraph({
                    children: [new TextRun({ text: metaBits, italics: true, color: GOLD, size: 16, font: bodyFontName })]
                  })
                ]
              : [])
          ],
          bodyFontName
        ),
        bodyCell(
          [
            new Paragraph({
              children: [
                new TextRun({ text: item.summary || "—", color: CHARCOAL, size: 20, font: bodyFontName })
              ]
            })
          ],
          bodyFontName
        ),
        bodyCell(
          [
            new Paragraph({
              children: item.link
                ? [
                    new ExternalHyperlink({
                      link: item.link,
                      children: [
                        new TextRun({
                          text: item.link,
                          color: "1B5E44",
                          underline: {},
                          size: 18,
                          font: bodyFontName
                        })
                      ]
                    })
                  ]
                : [new TextRun({ text: "—", color: MUTED, size: 18, font: bodyFontName })]
            })
          ],
          bodyFontName
        )
      ]
    });
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
      left: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
      right: { style: BorderStyle.SINGLE, size: 4, color: GOLD },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: "CFE3D8" },
      insideVertical: { style: BorderStyle.SINGLE, size: 2, color: "CFE3D8" }
    },
    rows: [headerRow, ...bodyRows]
  });
}

function headerCell(text: string, bodyFontName: string, widthPct: number): TableCell {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { fill: NAVY },
    verticalAlign: VerticalAlign.CENTER,
    margins: { top: 100, bottom: 100, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text, bold: true, color: "FFFFFF", size: 19, font: bodyFontName })]
      })
    ]
  });
}

function bodyCell(children: Paragraph[], bodyFontName: string): TableCell {
  return new TableCell({
    verticalAlign: VerticalAlign.TOP,
    margins: { top: 90, bottom: 90, left: 100, right: 100 },
    children
  });
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
