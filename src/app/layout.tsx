import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "InfoQuest by Arup — Bilingual Research & News Discovery",
  description:
    "Search a topic in Bengali or English and get a beautifully formatted, downloadable research report with general information and the latest news.",
  icons: {
    icon: "/favicon.svg"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body bg-parchment dark:bg-parchment-dark min-h-screen bg-paper-grain">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
