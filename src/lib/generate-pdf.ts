import jsPDF from "jspdf";

export interface NewsItem {
  title: string;
  snippet: string;
  url: string;
  hostName?: string;
  date?: string;
}

export interface SearchResult {
  keyword: string;
  language: "bn" | "en";
  searchMode: string;
  generalInfo: {
    summary: string;
    results: NewsItem[];
  };
  newsResults: NewsItem[];
}

// Font cache
let bengaliFontLoaded = false;

async function loadBengaliFont(doc: jsPDF): Promise<boolean> {
  if (bengaliFontLoaded) return true;
  try {
    const [regularRes, boldRes] = await Promise.all([
      fetch("/fonts/SolaimanLipi-Regular.ttf"),
      fetch("/fonts/SolaimanLipi-Bold.ttf"),
    ]);
    const regularBuffer = await regularRes.arrayBuffer();
    const boldBuffer = await boldRes.arrayBuffer();

    const regularB64 = arrayBufferToBase64(regularBuffer);
    const boldB64 = arrayBufferToBase64(boldBuffer);

    doc.addFileToVFS("SolaimanLipi-Regular.ttf", regularB64);
    doc.addFileToVFS("SolaimanLipi-Bold.ttf", boldB64);
    doc.addFont("SolaimanLipi-Regular.ttf", "SolaimanLipi", "normal");
    doc.addFont("SolaimanLipi-Bold.ttf", "SolaimanLipi", "bold");

    bengaliFontLoaded = true;
    return true;
  } catch (err) {
    console.error("Failed to load Bengali font:", err);
    return false;
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

function wrapText(
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const lines = doc.splitTextToSize(text, maxWidth);
  for (let i = 0; i < lines.length; i++) {
    if (y + lineHeight > 280) {
      doc.addPage();
      y = 20;
      drawPageHeader(doc);
    }
    doc.text(lines[i], x, y);
    y += lineHeight;
  }
  return y;
}

function drawPageHeader(doc: jsPDF) {
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 4, "F");
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text("InfoQuest By Arup", 15, 14);
  doc.text(
    new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    195,
    14,
    { align: "right" }
  );
}

export async function generateResearchPDF(data: SearchResult): Promise<jsPDF> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const isBengali = data.language === "bn";
  const pageWidth = 210;
  const marginLeft = 15;
  const marginRight = 15;
  const contentWidth = pageWidth - marginLeft - marginRight;
  let y = 20;

  // Load Bengali font if needed
  let fontLoaded = false;
  if (isBengali) {
    fontLoaded = await loadBengaliFont(doc);
  }

  const bodyFont = isBengali && fontLoaded ? "SolaimanLipi" : "helvetica";
  const boldFont = isBengali && fontLoaded ? "SolaimanLipi" : "helvetica";

  // Helper to set font
  const setFont = (weight: "normal" | "bold" | "italic") => {
    if (isBengali && fontLoaded) {
      doc.setFont("SolaimanLipi", weight === "italic" ? "normal" : weight);
    } else {
      doc.setFont("helvetica", weight);
    }
  };

  // ===== TOP ACCENT BAR =====
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 0, 210, 6, "F");

  // App name
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  setFont("normal");
  doc.text("InfoQuest By Arup", marginLeft, 20);

  // Title
  doc.setFontSize(24);
  doc.setTextColor(17, 24, 39);
  setFont("bold");
  const reportTitle = isBengali ? "গবেষণা প্রতিবেদন" : "Research Report";
  y = wrapText(doc, reportTitle, marginLeft, 32, contentWidth, 10);

  // Keyword badge
  y += 4;
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(marginLeft, y - 4, contentWidth, 12, 2, 2, "F");
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginLeft, y - 4, contentWidth, 12, 2, 2, "S");
  doc.setFontSize(11);
  doc.setTextColor(5, 150, 105);
  setFont("bold");
  const kwLabel = isBengali ? "কীওয়ার্ড: " : "Keyword: ";
  doc.text(kwLabel + data.keyword, marginLeft + 4, y + 2);
  y += 16;

  // Meta info line
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  setFont("normal");
  const langText = isBengali ? "ভাষা: বাংলা" : "Language: English";
  const modeText =
    data.searchMode === "ai"
      ? isBengali
        ? " | মোড: AI (Gemini)"
        : " | Mode: AI (Gemini)"
      : isBengali
        ? " | মোড: ওয়েব সার্চ"
        : " | Mode: Web Search";
  const dateText = new Date().toLocaleDateString(
    isBengali ? "bn-BD" : "en-US",
    { year: "numeric", month: "long", day: "numeric" }
  );
  doc.text(`${langText}${modeText}  |  ${dateText}`, marginLeft, y);
  y += 10;

  // Divider
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  // ===== SECTION 1: GENERAL INFORMATION =====
  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129);
  setFont("bold");
  const section1Title = isBengali
    ? "প্রথম অধ্যায়: সাধারণ তথ্য"
    : "Section 1: General Information";
  doc.text(section1Title, marginLeft, y);
  y += 8;

  // Summary
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);
  setFont("normal");
  const summaryText =
    data.generalInfo.summary ||
    (isBengali ? "কোনো তথ্য পাওয়া যায়নি।" : "No information available.");
  y = wrapText(doc, summaryText, marginLeft, y, contentWidth, 5.5);
  y += 4;

  // Related sources as bullet points
  if (data.generalInfo.results.length > 1) {
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    setFont("bold");
  const sourcesLabel = isBengali ? "সম্পর্কিত উৎসসমূহ:" : "Related Sources:";
    doc.text(sourcesLabel, marginLeft, y);
    y += 7;

    for (let i = 1; i < Math.min(data.generalInfo.results.length, 6); i++) {
      const r = data.generalInfo.results[i];
      if (y > 265) {
        doc.addPage();
        y = 20;
        drawPageHeader(doc);
        // Re-set font after page break
        if (isBengali && fontLoaded) {
          setFont("bold");
        }
      }
      // Bullet
      doc.setFillColor(16, 185, 129);
      doc.circle(marginLeft + 2, y - 1.5, 1.2, "F");
      doc.setFontSize(9);
      doc.setTextColor(5, 150, 105);
      setFont("bold");
      const titleLine = doc.splitTextToSize(r.title, contentWidth - 10);
      doc.text(titleLine[0], marginLeft + 6, y);
      y += 4.5;
      if (titleLine.length > 1) {
        setFont("normal");
        doc.setTextColor(100, 100, 100);
        for (let j = 1; j < titleLine.length; j++) {
          doc.text(titleLine[j], marginLeft + 6, y);
          y += 4.5;
        }
      }
      setFont("normal");
      doc.setFontSize(8);
      doc.setTextColor(130, 130, 130);
      y = wrapText(doc, r.snippet, marginLeft + 6, y, contentWidth - 10, 4.2);
      y += 3;
    }
  }

  // ===== SECTION 2: LATEST NEWS SOURCES =====
  y += 6;
  if (y > 240) {
    doc.addPage();
    y = 20;
    drawPageHeader(doc);
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 8;

  doc.setFontSize(16);
  doc.setTextColor(16, 185, 129);
  setFont("bold");
  const section2Title = isBengali
    ? "দ্বিতীয় অধ্যায়: সাম্প্রতিক সংবাদ উৎস"
    : "Section 2: Latest News Sources";
  doc.text(section2Title, marginLeft, y);
  y += 10;

  // Table header
  const tableLeft = marginLeft;
  const tableWidth = contentWidth;
  const colSerial = 10;
  const colTitle = 55;
  const colDesc = tableWidth - colSerial - colTitle - 10;

  function drawTableHeader() {
    doc.setFillColor(240, 253, 244);
    doc.rect(tableLeft, y - 5, tableWidth, 8, "F");
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.2);
    doc.rect(tableLeft, y - 5, tableWidth, 8, "S");
    doc.setFontSize(8);
    setFont("bold");
    doc.setTextColor(5, 150, 105);
    const colSerialLabel = isBengali ? "ক্রমিক" : "Serial";
    const colTitleLabel = isBengali ? "সংবাদের শিরোনাম" : "News Title";
    const colDescLabel = isBengali ? "সংক্ষিপ্ত বিবরণ" : "Brief Description";
    doc.text(colSerialLabel, tableLeft + 2, y);
    doc.text(colTitleLabel, tableLeft + colSerial + 2, y);
    doc.text(colDescLabel, tableLeft + colSerial + colTitle + 2, y);
    y += 7;
    setFont("normal");
  }

  drawTableHeader();

  // Table rows
  const newsItems = data.newsResults.slice(0, 15);
  newsItems.forEach((item, idx) => {
    const descLines = doc.splitTextToSize(item.snippet, colDesc - 4);
    const titleLines = doc.splitTextToSize(item.title, colTitle - 4);
    const rowLines = Math.max(titleLines.length, descLines.length);
    const rowHeight = Math.max(rowLines * 4.2 + 4, 10);

    if (y + rowHeight > 275) {
      doc.addPage();
      y = 20;
      drawPageHeader(doc);
      drawTableHeader();
    }

    // Row border
    doc.setDrawColor(230, 230, 230);
    doc.setLineWidth(0.1);
    doc.line(tableLeft, y + rowHeight - 2, tableLeft + tableWidth, y + rowHeight - 2);

    // Alternating row bg
    if (idx % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(tableLeft, y - 3, tableWidth, rowHeight, "F");
    }

    // Serial
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);
    setFont("normal");
    doc.text(String(idx + 1), tableLeft + 2, y + 1);

    // Title
    doc.setFontSize(8);
    doc.setTextColor(30, 30, 30);
    setFont("bold");
    let tY = y + 1;
    for (const line of titleLines) {
      doc.text(line, tableLeft + colSerial + 2, tY);
      tY += 4.2;
    }

    // Description
    setFont("normal");
    doc.setFontSize(7.5);
    doc.setTextColor(100, 100, 100);
    let dY = y + 1;
    for (const line of descLines) {
      if (dY > 275) break;
      doc.text(line, tableLeft + colSerial + colTitle + 2, dY);
      dY += 4.2;
    }

    y += rowHeight + 1;
  });

  // ===== FOOTER =====
  y += 10;
  if (y > 260) {
    doc.addPage();
    y = 20;
    drawPageHeader(doc);
  }

  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(marginLeft, y, pageWidth - marginRight, y);
  y += 6;

  doc.setFontSize(7);
  doc.setTextColor(160, 160, 160);
  setFont("normal");
  const footerText = isBengali
    ? "এই প্রতিবেদনটি InfoQuest By Arup গবেষণা টুলকিট দ্বারা তৈরি হয়েছে।"
    : "This report was generated by InfoQuest By Arup research toolkit.";
  doc.text(footerText, marginLeft, y);
  y += 4;
  doc.text(
    `Generated on ${new Date().toLocaleString("en-US")}`,
    marginLeft,
    y
  );

  // Bottom accent bar
  doc.setFillColor(16, 185, 129);
  doc.rect(0, 293, 210, 4, "F");

  return doc;
}
