'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useTheme } from 'next-themes';
import { AnimatePresence, motion } from 'framer-motion';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ToggleGroup,
  ToggleGroupItem,
} from '@/components/ui/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';

import {
  Search,
  FileDown,
  FileText,
  Sun,
  Moon,
  Clock,
  Trash2,
  ExternalLink,
  Check,
  Loader2,
  ArrowLeft,
  History,
  X,
  Download,
  BookOpen,
} from 'lucide-react';

import { detectLanguage, getLabels } from '@/lib/language';
import type {
  ResearchResult,
  SearchEngine,
  EngineStatus,
  ReportLength,
} from '@/lib/types';

/* ------------------------------------------------------------------ */
/*  Types for localStorage history                                     */
/* ------------------------------------------------------------------ */
interface HistoryItem {
  id: string;
  keyword: string;
  engine: SearchEngine;
  language: 'en' | 'bn';
  createdAt: string;
  reportData: ResearchResult;
}

const HISTORY_KEY = 'infoquest_history';

function loadHistory(): HistoryItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveHistory(items: HistoryItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, 50)));
  } catch {
    /* quota exceeded — silently fail */
  }
}

/* ------------------------------------------------------------------ */
/*  Progress steps                                                     */
/* ------------------------------------------------------------------ */
const PROGRESS_STEPS = [
  'progressSearching',
  'progressGathering',
  'progressFormatting',
  'progressDone',
] as const;

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function Home() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // State
  const [keyword, setKeyword] = useState('');
  const [engine, setEngine] = useState<SearchEngine>('web');
  const [combineWithAI, setCombineWithAI] = useState(false);
  const [reportLength, setReportLength] = useState<ReportLength>('detailed');
  const [engines, setEngines] = useState<EngineStatus[]>([]);

  const [loading, setLoading] = useState(false);
  const [progressStep, setProgressStep] = useState(0);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [error, setError] = useState('');

  // History
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // Detected language for labels
  const detectedLang = keyword ? detectLanguage(keyword) : 'en';
  const t = getLabels(detectedLang);

  /* ---- bootstrap ---- */
  useEffect(() => {
    setMounted(true);
    fetch('/api/engines')
      .then((r) => r.json())
      .then(setEngines)
      .catch(() => {});
    setHistory(loadHistory());
  }, []);

  /* ---- progress simulation while API is running ---- */
  useEffect(() => {
    if (!loading) return;
    const timers = [
      setTimeout(() => setProgressStep(1), 1500),
      setTimeout(() => setProgressStep(2), 4000),
      setTimeout(() => setProgressStep(3), 6500),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loading]);

  /* ---- handle search ---- */
  const handleSearch = useCallback(async () => {
    if (!keyword.trim()) return;
    setLoading(true);
    setProgressStep(0);
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyword: keyword.trim(),
          engine,
          combineWithAI,
          reportLength,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Research failed');

      setProgressStep(3);
      setResult(data);

      // Save to localStorage history
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        keyword: data.keyword,
        engine: data.engine,
        language: data.language,
        createdAt: data.timestamp,
        reportData: data,
      };
      const updated = [newItem, ...loadHistory()].slice(0, 50);
      saveHistory(updated);
      setHistory(updated);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  }, [keyword, engine, combineWithAI, reportLength]);

  /* ---- downloads ---- */
  const downloadReport = useCallback(
    async (format: 'pdf' | 'docx', data?: ResearchResult) => {
      const payload = data || result;
      if (!payload) return;

      try {
        const res = await fetch(`/api/download/${format}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Download failed');
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `infoquest-${encodeURIComponent(payload.keyword)}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      } catch (err: any) {
        setError(err.message);
      }
    },
    [result]
  );

  /* ---- history helpers ---- */
  const deleteHistoryItem = (id: string) => {
    const updated = history.filter((h) => h.id !== id);
    saveHistory(updated);
    setHistory(updated);
  };

  const clearHistory = () => {
    saveHistory([]);
    setHistory([]);
  };

  const viewHistoryItem = (item: HistoryItem) => {
    setResult(item.reportData);
    setHistoryOpen(false);
  };

  const engineName = (id: SearchEngine) => {
    const e = engines.find((e) => e.id === id);
    return e?.name || id;
  };

  const isAI = engine !== 'web';
  const lang = result?.language || detectedLang;
  const lt = getLabels(lang);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */
  if (!mounted) return null;

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen flex flex-col bg-paper-texture">
        {/* ==================== HEADER ==================== */}
        <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-border">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-4 sm:px-6 h-14">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="InfoQuest"
                width={34}
                height={34}
                className="rounded"
              />
              <div className="leading-tight">
                <span className="font-display font-bold text-lg text-foreground">
                  InfoQuest
                </span>{' '}
                <span className="text-xs italic text-gold font-medium">
                  by Arup
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* History button */}
              <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <History className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-[360px] sm:w-[420px] bg-background border-border">
                  <SheetHeader>
                    <SheetTitle className="font-display text-foreground">{lt.history}</SheetTitle>
                  </SheetHeader>
                  <div className="mt-6 flex flex-col gap-2">
                    {history.length === 0 && (
                      <p className="text-muted-foreground text-sm text-center py-12">{lt.noHistory}</p>
                    )}
                    <ScrollArea className="max-h-[calc(100vh-180px)] scrollbar-thin">
                      <div className="flex flex-col gap-2 pr-3">
                        {history.map((item) => (
                          <Card
                            key={item.id}
                            className="bg-card border-border hover:border-gold/50 transition-colors"
                          >
                            <CardContent className="p-3 flex flex-col gap-2">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0 flex-1">
                                  <p
                                    className={`font-medium text-sm truncate ${
                                      item.language === 'bn' ? 'font-bengali' : ''
                                    }`}
                                  >
                                    {item.keyword}
                                  </p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-gold/40 text-gold">
                                      {engineName(item.engine)}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">
                                      {new Date(item.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => viewHistoryItem(item)}
                                  >
                                    <BookOpen className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => downloadReport('pdf', item.reportData)}
                                  >
                                    <Download className="h-3.5 w-3.5" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7 text-destructive hover:text-destructive"
                                    onClick={() => deleteHistoryItem(item.id)}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </ScrollArea>
                    {history.length > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-3 text-destructive border-destructive/30 hover:bg-destructive/10"
                        onClick={clearHistory}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {lt.clearHistory}
                      </Button>
                    )}
                  </div>
                </SheetContent>
              </Sheet>

              {/* Theme toggle */}
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5" />
                ) : (
                  <Moon className="h-5 w-5" />
                )}
              </Button>
            </div>
          </div>
        </header>

        {/* ==================== MAIN ==================== */}
        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <AnimatePresence mode="wait">
            {/* ---------- HERO / SEARCH ---------- */}
            {!result && !loading && (
              <motion.div
                key="hero"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center min-h-[70vh]"
              >
                {/* Logo + tagline */}
                <div className="mb-8 flex flex-col items-center gap-3">
                  <div className="animate-magnify-pulse text-gold">
                    <Search className="h-16 w-16" strokeWidth={1.5} />
                  </div>
                  <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center">
                    Discover. Research. Report.
                  </h1>
                  <p className="text-muted-foreground text-sm sm:text-base text-center max-w-md">
                    {detectedLang === 'bn'
                      ? 'যেকোনো বিষয় অনুসন্ধান করুন এবং সুন্দর রিপোর্ট তৈরি করুন'
                      : 'Search any topic in Bengali or English, get a beautifully formatted report'}
                  </p>
                </div>

                {/* Search bar */}
                <div className="w-full max-w-2xl space-y-3">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder={t.searchPlaceholder}
                        className={`pl-10 h-12 text-base bg-card border-border focus:border-gold focus:ring-gold/30 ${
                          detectedLang === 'bn' ? 'font-bengali' : ''
                        }`}
                      />
                    </div>
                    <Select
                      value={engine}
                      onValueChange={(v) => setEngine(v as SearchEngine)}
                    >
                      <SelectTrigger className="w-[150px] h-12 bg-card border-border">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {engines.map((eng) =>
                          eng.available ? (
                            <SelectItem key={eng.id} value={eng.id}>
                              <span className="flex items-center gap-2">
                                <span>{eng.icon}</span>
                                <span>{eng.name}</span>
                              </span>
                            </SelectItem>
                          ) : (
                            <Tooltip key={eng.id}>
                              <TooltipTrigger asChild>
                                <div className="px-2 py-1.5 text-sm text-muted-foreground cursor-not-allowed">
                                  <span className="flex items-center gap-2">
                                    <span>{eng.icon}</span>
                                    <span>{eng.name}</span>
                                    <X className="h-3 w-3 ml-auto" />
                                  </span>
                                </div>
                              </TooltipTrigger>
                              <TooltipContent>{eng.reason}</TooltipContent>
                            </Tooltip>
                          )
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Options row */}
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Combine checkbox (only for AI engines) */}
                    {isAI && (
                      <label className="flex items-center gap-2 cursor-pointer select-none">
                        <Checkbox
                          checked={combineWithAI}
                          onCheckedChange={(v) => setCombineWithAI(!!v)}
                          className="border-gold data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                        />
                        <span className="text-sm text-foreground">{t.combineLabel}</span>
                      </label>
                    )}

                    {/* Report length */}
                    <ToggleGroup
                      type="single"
                      value={reportLength}
                      onValueChange={(v) => v && setReportLength(v as ReportLength)}
                      className="border border-border rounded-lg"
                    >
                      <ToggleGroupItem
                        value="brief"
                        className="text-xs data-[state=on]:bg-gold/15 data-[state=on]:text-gold"
                      >
                        {t.brief}
                      </ToggleGroupItem>
                      <ToggleGroupItem
                        value="detailed"
                        className="text-xs data-[state=on]:bg-gold/15 data-[state=on]:text-gold"
                      >
                        {t.detailed}
                      </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Spacer */}
                    <div className="flex-1" />

                    {/* Search button */}
                    <Button
                      onClick={handleSearch}
                      disabled={!keyword.trim()}
                      className="h-10 px-6 bg-navy hover:bg-navy-light text-gold font-semibold rounded-lg transition-colors"
                    >
                      <Search className="h-4 w-4 mr-2" />
                      {t.search}
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* ---------- PROGRESS ---------- */}
            {loading && (
              <motion.div
                key="progress"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="flex flex-col items-center justify-center min-h-[70vh]"
              >
                <Card className="w-full max-w-md bg-card border-border">
                  <CardContent className="p-8 flex flex-col items-center gap-6">
                    <div className="animate-magnify-pulse text-gold">
                      {progressStep < 3 ? (
                        <Loader2 className="h-12 w-12 animate-spin" />
                      ) : (
                        <Check className="h-12 w-12" />
                      )}
                    </div>

                    <div className="w-full space-y-3">
                      <Progress
                        value={((progressStep + 1) / PROGRESS_STEPS.length) * 100}
                        className="h-2"
                      />
                      <div className="space-y-2">
                        {PROGRESS_STEPS.map((stepKey, i) => (
                          <div
                            key={stepKey}
                            className={`flex items-center gap-2 text-sm transition-all duration-300 ${
                              i <= progressStep
                                ? 'text-foreground'
                                : 'text-muted-foreground'
                            }`}
                          >
                            {i < progressStep ? (
                              <Check className="h-4 w-4 text-gold shrink-0" />
                            ) : i === progressStep ? (
                              <Loader2 className="h-4 w-4 text-gold animate-spin shrink-0" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-border shrink-0" />
                            )}
                            <span
                              className={
                                i <= progressStep ? 'font-medium' : ''
                              }
                            >
                              {i === 0 && engine !== 'web'
                                ? `Researching with ${engineName(engine)}…`
                                : (lt as any)[stepKey]}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- ERROR ---------- */}
            {error && !loading && (
              <motion.div
                key="error"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-2xl mx-auto mt-8"
              >
                <Card className="border-destructive/30 bg-destructive/5">
                  <CardContent className="p-6 text-center">
                    <p className="text-destructive font-medium">{error}</p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => { setError(''); setResult(null); }}
                    >
                      {lt.backToSearch}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* ---------- RESULTS ---------- */}
            {result && !loading && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="animate-fade-in-up space-y-6"
              >
                {/* Top bar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => { setResult(null); setKeyword(''); }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft className="h-4 w-4 mr-1" />
                      {lt.backToSearch}
                    </Button>
                    <Separator orientation="vertical" className="h-5" />
                    <h2
                      className={`text-lg font-display font-bold text-foreground ${
                        lang === 'bn' ? 'font-bengali' : ''
                      }`}
                    >
                      {result.keyword}
                    </h2>
                    <Badge className="bg-navy text-gold text-xs border-0 font-medium">
                      {lt.coverEngine} {engineName(result.engine)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    {new Date(result.timestamp).toLocaleString(
                      lang === 'bn' ? 'bn-BD' : 'en-US'
                    )}
                  </div>
                </div>

                {/* Two-column results */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Section 1: Information */}
                  <Card className="bg-card border-border overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded bg-gold" />
                        <CardTitle
                          className={`text-xl font-display font-bold text-navy ${
                            lang === 'bn' ? 'font-bengali-serif' : ''
                          }`}
                        >
                          {lt.sectionInfo}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[60vh] scrollbar-thin">
                        <div
                          className={`prose prose-sm max-w-none text-charcoal leading-relaxed whitespace-pre-wrap ${
                            lang === 'bn' ? 'font-bengali' : ''
                          }`}
                        >
                          {result.information}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  {/* Section 2: News */}
                  <Card className="bg-card border-border overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1 w-8 rounded bg-gold" />
                        <CardTitle
                          className={`text-xl font-display font-bold text-navy ${
                            lang === 'bn' ? 'font-bengali-serif' : ''
                          }`}
                        >
                          {lt.sectionNews}
                        </CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="max-h-[60vh] scrollbar-thin">
                        {result.newsItems.length === 0 ? (
                          <p className="text-muted-foreground text-sm py-8 text-center">
                            {lt.newsPlaceholder}
                          </p>
                        ) : (
                          <ol className="space-y-4">
                            {result.newsItems.map((item, i) => (
                              <li
                                key={i}
                                className="group relative pl-7 border-l-2 border-gold/20 hover:border-gold/60 transition-colors"
                              >
                                <span className="absolute -left-[13px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-gold/15 text-gold text-[10px] font-bold">
                                  {i + 1}
                                </span>
                                <div className="space-y-1">
                                  {item.link ? (
                                    <a
                                      href={item.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className={`font-semibold text-sm text-foreground hover:text-gold transition-colors flex items-start gap-1 ${
                                        lang === 'bn' ? 'font-bengali' : ''
                                      }`}
                                    >
                                      <span className="min-w-0 flex-1">{item.title}</span>
                                      <ExternalLink className="h-3.5 w-3.5 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </a>
                                  ) : (
                                    <p
                                      className={`font-semibold text-sm text-foreground ${
                                        lang === 'bn' ? 'font-bengali' : ''
                                      }`}
                                    >
                                      {item.title}
                                    </p>
                                  )}
                                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                    <span>{lt.sourceLabel}: {item.source}</span>
                                    <span>•</span>
                                    <span>{lt.dateLabel}: {item.date}</span>
                                  </div>
                                  <p
                                    className={`text-sm text-charcoal/80 leading-relaxed ${
                                      lang === 'bn' ? 'font-bengali' : ''
                                    }`}
                                  >
                                    {item.summary}
                                  </p>
                                </div>
                              </li>
                            ))}
                          </ol>
                        )}
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                {/* Download bar */}
                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <Button
                    onClick={() => downloadReport('pdf')}
                    className="bg-navy hover:bg-navy-light text-gold font-semibold px-6"
                  >
                    <FileDown className="h-4 w-4 mr-2" />
                    {lt.downloadPdf}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => downloadReport('docx')}
                    className="border-border hover:border-gold/50 hover:text-gold font-semibold px-6"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    {lt.downloadDocx}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* ==================== FOOTER ==================== */}
        <footer className="mt-auto border-t border-border py-4 text-center">
          <p className="text-xs text-muted-foreground">{lt.footerText}</p>
        </footer>
      </div>
    </TooltipProvider>
  );
}
