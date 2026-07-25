"use client";

import { useState, useCallback } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  FileText,
  Sun,
  Moon,
  Globe,
  Newspaper,
  Download,
  ExternalLink,
  Loader2,
  Sparkles,
  Languages,
  Info,
  ChevronRight,
  Bot,
  Wifi,
} from "lucide-react";
import { generateResearchPDF, type SearchResult } from "@/lib/generate-pdf";

// ---------- Animation Variants ----------
const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.45, ease: "easeOut" },
  }),
};

const stagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

type SearchMode = "web" | "ai";

export default function Home() {
  const [keyword, setKeyword] = useState("");
  const [searchMode, setSearchMode] = useState<SearchMode>("web");
  const [loading, setLoading] = useState(false);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [searchData, setSearchData] = useState<SearchResult | null>(null);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState("info");
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();

  useState(() => {
    setMounted(true);
  });

  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setError("");
    setSearchData(null);
    setActiveTab("info");

    try {
      const endpoint = searchMode === "ai" ? "/api/ai-search" : "/api/search";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyword: keyword.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Search failed");
      setSearchData(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, [keyword, searchMode]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleGeneratePDF = useCallback(async () => {
    if (!searchData) return;
    setGeneratingPDF(true);
    try {
      const doc = await generateResearchPDF(searchData);
      const fileName = `InfoQuest_${searchData.keyword.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
      doc.save(fileName);
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setGeneratingPDF(false);
    }
  }, [searchData]);

  return (
    <div className="min-h-screen flex flex-col">
      {/* ===== HEADER ===== */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.svg"
              alt="InfoQuest Logo"
              width={160}
              height={40}
              className="h-8 sm:h-10 w-auto"
              priority
            />
          </div>

          <div className="flex items-center gap-2">
            {mounted && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="rounded-full"
                aria-label="Toggle theme"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={theme}
                    initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                    animate={{ rotate: 0, opacity: 1, scale: 1 }}
                    exit={{ rotate: 90, opacity: 0, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                  >
                    {theme === "dark" ? (
                      <Sun className="h-5 w-5" />
                    ) : (
                      <Moon className="h-5 w-5" />
                    )}
                  </motion.div>
                </AnimatePresence>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* ===== HERO + SEARCH ===== */}
        <section className="relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10">
            <div className="absolute top-20 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute top-40 right-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl" />
          </div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-12 text-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="space-y-6"
            >
              <motion.div variants={fadeUp} custom={0}>
                <Badge
                  variant="secondary"
                  className="px-4 py-1.5 text-xs sm:text-sm font-medium gap-2"
                >
                  <Sparkles className="h-3.5 w-3.5 text-primary" />
                  Research Toolkit for Bengali &amp; English
                </Badge>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight"
              >
                <span className="text-foreground">Info</span>
                <span className="text-primary">Quest</span>
                <span className="text-muted-foreground text-lg sm:text-xl font-normal block mt-2">
                  By Arup
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="text-muted-foreground text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
              >
                Search any topic in Bengali or English, explore curated
                information and latest news, then generate beautifully formatted
                PDF research reports instantly.
              </motion.p>

              {/* Search Mode Toggle */}
              <motion.div variants={fadeUp} custom={3} className="flex justify-center">
                <div className="inline-flex items-center rounded-xl bg-muted/60 p-1 gap-1 border border-border">
                  <button
                    onClick={() => setSearchMode("web")}
                    className={
                      `flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        searchMode === "web"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    <Wifi className="h-4 w-4" />
                    <span>Web Search</span>
                  </button>
                  <button
                    onClick={() => setSearchMode("ai")}
                    className={
                      `flex items-center gap-2 px-4 sm:px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer ${
                        searchMode === "ai"
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    }
                  >
                    <Bot className="h-4 w-4" />
                    <span>AI Search</span>
                    <Badge
                      variant="secondary"
                      className={`text-[10px] px-1.5 py-0 h-4 ${
                        searchMode === "ai" ? "bg-primary-foreground/20 text-primary-foreground" : ""
                      }`}
                    >
                      Gemini
                    </Badge>
                  </button>
                </div>
              </motion.div>

              {/* Search Bar */}
              <motion.div
                variants={fadeUp}
                custom={4}
                className="max-w-2xl mx-auto"
              >
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/30 to-emerald-400/30 rounded-2xl blur opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <div className="relative flex items-center gap-2 bg-card border border-border rounded-xl p-1.5 shadow-lg shadow-primary/5">
                    <div className="pl-3 text-muted-foreground">
                      <Search className="h-5 w-5" />
                    </div>
                    <Input
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="Search in English or Bengali... e.g. বাংলাদেশ অর্থনীতি or Climate Change"
                      className="flex-1 border-0 shadow-none focus-visible:ring-0 text-base"
                      disabled={loading}
                    />
                    <Button
                      onClick={handleSearch}
                      disabled={loading || !keyword.trim()}
                      className="rounded-lg px-5 sm:px-6 gap-2"
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Search className="h-4 w-4" />
                      )}
                      <span className="hidden sm:inline">
                        {loading ? "Searching..." : "Search"}
                      </span>
                    </Button>
                  </div>
                </div>

                {/* Quick hints + mode description */}
                <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="flex flex-wrap justify-center gap-2">
                    <span className="text-xs text-muted-foreground py-1">
                      Try:
                    </span>
                    {["বাংলাদেশ", "AI Technology", "শিক্ষা", "Space Exploration"].map(
                      (hint) => (
                        <button
                          key={hint}
                          onClick={() => setKeyword(hint)}
                          className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors cursor-pointer"
                        >
                          {hint}
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground/70">
                    {searchMode === "ai"
                      ? "AI Search uses Gemini to generate comprehensive research summaries and news analysis"
                      : "Web Search scours the internet for real-time information and latest news articles"}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* ===== RESULTS SECTION ===== */}
        {(loading || searchData || error) && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            {/* Loading State */}
            {loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="flex items-center gap-3 mb-6">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  <span className="text-muted-foreground">
                    {searchMode === "ai"
                      ? `AI is researching "${keyword}"...`
                      : `Searching for "${keyword}"...`}
                  </span>
                </div>
                <div className="grid gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-5 w-3/4" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-2/3" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Error State */}
            {error && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-destructive/50 bg-destructive/5">
                  <CardContent className="pt-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-full bg-destructive/10">
                        <Info className="h-5 w-5 text-destructive" />
                      </div>
                      <div>
                        <p className="font-medium">Search Error</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {error}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-3"
                          onClick={handleSearch}
                        >
                          Try Again
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Results */}
            {searchData && !loading && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Result Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
                      Results for &quot;{searchData.keyword}&quot;
                    </h2>
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <Badge
                        variant="outline"
                        className="gap-1.5"
                      >
                        <Languages className="h-3 w-3" />
                        {searchData.language === "bn" ? "Bengali" : "English"}
                      </Badge>
                      <Badge
                        className={`gap-1.5 ${searchData.searchMode === "ai" ? "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800" : "bg-sky-100 text-sky-700 border-sky-200 dark:bg-sky-900/30 dark:text-sky-300 dark:border-sky-800"}`}
                        variant="outline"
                      >
                        {searchData.searchMode === "ai" ? (
                          <Bot className="h-3 w-3" />
                        ) : (
                          <Wifi className="h-3 w-3" />
                        )}
                        {searchData.searchMode === "ai" ? "AI (Gemini)" : "Web Search"}
                      </Badge>
                      <Badge variant="secondary" className="gap-1.5">
                        <Globe className="h-3 w-3" />
                        {searchData.generalInfo.results.length} sources
                      </Badge>
                      <Badge variant="secondary" className="gap-1.5">
                        <Newspaper className="h-3 w-3" />
                        {searchData.newsResults.length} news
                      </Badge>
                    </div>
                  </div>

                  <Button
                    onClick={handleGeneratePDF}
                    disabled={generatingPDF}
                    className="gap-2 rounded-lg shadow-lg shadow-primary/20"
                  >
                    {generatingPDF ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                    <Download className="h-4 w-4" />
                    {generatingPDF ? "Generating..." : "Download PDF Report"}
                  </Button>
                </div>

                {/* Tabs */}
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="info" className="gap-2">
                      <Info className="h-4 w-4" />
                      <span className="hidden xs:inline">General</span> Information
                    </TabsTrigger>
                    <TabsTrigger value="news" className="gap-2">
                      <Newspaper className="h-4 w-4" />
                      Latest News
                    </TabsTrigger>
                  </TabsList>

                  {/* ===== TAB 1: GENERAL INFORMATION ===== */}
                  <TabsContent value="info" className="mt-6 space-y-6">
                    {/* Summary Card */}
                    <Card className="border-primary/20 bg-primary/[0.02]">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Info className="h-4 w-4 text-primary" />
                          </div>
                          Overview
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground leading-relaxed text-sm sm:text-base whitespace-pre-line">
                          {searchData.generalInfo.summary}
                        </p>
                      </CardContent>
                    </Card>

                    {/* Related Sources */}
                    {searchData.generalInfo.results.length > 1 && (
                      <div>
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <Globe className="h-5 w-5 text-primary" />
                          Related Sources
                        </h3>
                        <div className="grid gap-3">
                          {searchData.generalInfo.results.map((item, i) => (
                            <motion.div
                              key={item.url + i}
                              initial="hidden"
                              animate="visible"
                              variants={fadeUp}
                              custom={i}
                            >
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block"
                              >
                                <Card className="group hover:border-primary/40 hover:shadow-md hover:shadow-primary/5 transition-all duration-300">
                                  <CardContent className="py-4 px-5">
                                    <div className="flex items-start gap-3">
                                      <div className="flex-shrink-0 mt-1">
                                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                                          {i + 1}
                                        </div>
                                      </div>
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <h4 className="font-semibold text-sm sm:text-base truncate group-hover:text-primary transition-colors">
                                            {item.title}
                                          </h4>
                                          <ExternalLink className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                        <p className="text-muted-foreground text-xs sm:text-sm mt-1 line-clamp-2">
                                          {item.snippet}
                                        </p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                          {item.hostName && (
                                            <span className="font-medium">
                                              {item.hostName}
                                            </span>
                                          )}
                                          {item.date && (
                                            <>
                                              <span>·</span>
                                              <span>{item.date}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                      <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground mt-2 group-hover:translate-x-1 transition-transform" />
                                    </div>
                                  </CardContent>
                                </Card>
                              </a>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  {/* ===== TAB 2: LATEST NEWS ===== */}
                  <TabsContent value="news" className="mt-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-lg">
                          <div className="p-1.5 rounded-md bg-primary/10">
                            <Newspaper className="h-4 w-4 text-primary" />
                          </div>
                          Latest News Sources
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-0">
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-primary/5 hover:bg-primary/5">
                                <TableHead className="w-14 text-center">
                                  Serial
                                </TableHead>
                                <TableHead className="min-w-[180px]">
                                  News Title
                                </TableHead>
                                <TableHead className="min-w-[240px] hidden sm:table-cell">
                                  Brief Description
                                </TableHead>
                                <TableHead className="w-24 text-right">
                                  Full Link
                                </TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {searchData.newsResults.map((item, i) => (
                                <TableRow key={item.url + i} className="group">
                                  <TableCell className="text-center font-medium text-muted-foreground">
                                    {i + 1}
                                  </TableCell>
                                  <TableCell>
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-medium hover:text-primary transition-colors line-clamp-2 text-sm"
                                    >
                                      {item.title}
                                    </a>
                                  </TableCell>
                                  <TableCell className="hidden sm:table-cell">
                                    <p className="text-muted-foreground text-xs line-clamp-2">
                                      {item.snippet}
                                    </p>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <a
                                      href={item.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                                    >
                                      Visit
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Mobile news cards */}
                    <div className="sm:hidden mt-4 space-y-3">
                      {searchData.newsResults.map((item, i) => (
                        <a
                          key={item.url + "-m" + i}
                          href={item.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block"
                        >
                          <Card className="group hover:border-primary/40 transition-all">
                            <CardContent className="py-3 px-4">
                              <div className="flex items-start gap-3">
                                <span className="flex-shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                                  {i + 1}
                                </span>
                                <div className="min-w-0">
                                  <h4 className="font-semibold text-sm line-clamp-2 group-hover:text-primary transition-colors">
                                    {item.title}
                                  </h4>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {item.snippet}
                                  </p>
                                  <div className="flex items-center gap-1 mt-1.5 text-xs text-primary font-medium">
                                    Read more
                                    <ExternalLink className="h-3 w-3" />
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </a>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}
          </section>
        )}

        {/* ===== FEATURES SECTION ===== */}
        {!searchData && !loading && !error && (
          <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-16">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={stagger}
              className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
            >
              {[
                {
                  icon: <Wifi className="h-6 w-6" />,
                  title: "Web Search",
                  desc: "Search the live internet for real-time information, articles, and news from across the web.",
                },
                {
                  icon: <Bot className="h-6 w-6" />,
                  title: "AI Search (Gemini)",
                  desc: "Get AI-powered research summaries and analysis using Google's Gemini model for comprehensive insights.",
                },
                {
                  icon: <Languages className="h-6 w-6" />,
                  title: "Bilingual Support",
                  desc: "Automatically detects Bengali and English keywords, delivering results in the appropriate language context.",
                },
                {
                  icon: <FileText className="h-6 w-6" />,
                  title: "PDF Reports",
                  desc: "Generate beautifully formatted research reports with SolaimanLipi font for Bengali, organized in professional sections.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={feature.title}
                  variants={fadeUp}
                  custom={i + 5}
                >
                  <Card className="h-full hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <CardContent className="pt-6 space-y-3">
                      <div className="p-2.5 rounded-xl bg-primary/10 w-fit text-primary">
                        {feature.icon}
                      </div>
                      <h3 className="font-semibold text-lg">{feature.title}</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        {feature.desc}
                      </p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </motion.div>
          </section>
        )}
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border bg-card/50 mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image
              src="/logo.svg"
              alt="InfoQuest"
              width={100}
              height={25}
              className="h-5 w-auto opacity-60"
            />
          </div>
          <p className="text-xs">
            Research Toolkit &mdash; Built with Next.js
          </p>
        </div>
      </footer>
    </div>
  );
}
