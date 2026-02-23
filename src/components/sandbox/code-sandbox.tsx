"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Play,
  Code2,
  Eye,
  Lightbulb,
  Brain,
  Send,
  ChevronDown,
  ChevronUp,
  Loader2,
  RotateCcw,
} from "lucide-react";
import type { SandboxContent } from "@/types";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

interface CodeSandboxProps {
  content: SandboxContent;
  lessonId: string;
  onComplete?: (score: number) => void;
}

interface FileData {
  name: string;
  language: string;
  code: string;
}

/* ------------------------------------------------------------------ */
/*  Default starter template                                           */
/* ------------------------------------------------------------------ */

const DEFAULT_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Песочница</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <h1>Привет, мир!</h1>
  <script src="script.js"><\/script>
</body>
</html>`;

const DEFAULT_CSS = `body {
  font-family: system-ui, -apple-system, sans-serif;
  margin: 2rem;
  background: #f8fafc;
  color: #1e293b;
}

h1 {
  color: #6d28d9;
}`;

const DEFAULT_JS = `// Ваш JavaScript-код
console.log("Привет из песочницы!");`;

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function parseStarterCode(starter?: string): FileData[] {
  if (!starter) {
    return [
      { name: "index.html", language: "html", code: DEFAULT_HTML },
      { name: "style.css", language: "css", code: DEFAULT_CSS },
      { name: "script.js", language: "javascript", code: DEFAULT_JS },
    ];
  }

  // Try to parse as JSON (multi-file format)
  try {
    const parsed = JSON.parse(starter);
    if (Array.isArray(parsed)) {
      return parsed.map((f: { name: string; language?: string; code: string }) => ({
        name: f.name,
        language: f.language || inferLanguage(f.name),
        code: f.code,
      }));
    }
    if (typeof parsed === "object" && parsed !== null) {
      return Object.entries(parsed).map(([name, code]) => ({
        name,
        language: inferLanguage(name),
        code: String(code),
      }));
    }
  } catch {
    // Not JSON — treat as single HTML file
  }

  return [
    { name: "index.html", language: "html", code: starter },
    { name: "style.css", language: "css", code: DEFAULT_CSS },
    { name: "script.js", language: "javascript", code: DEFAULT_JS },
  ];
}

function inferLanguage(filename: string): string {
  if (filename.endsWith(".html") || filename.endsWith(".htm")) return "html";
  if (filename.endsWith(".css")) return "css";
  if (filename.endsWith(".js") || filename.endsWith(".ts")) return "javascript";
  return "text";
}

function buildSrcdoc(files: FileData[]): string {
  const htmlFile = files.find((f) => f.language === "html");
  const cssFile = files.find((f) => f.language === "css");
  const jsFile = files.find((f) => f.language === "javascript");

  if (htmlFile) {
    let html = htmlFile.code;

    // Inject CSS
    if (cssFile) {
      const styleTag = `<style>${cssFile.code}</style>`;
      if (html.includes("</head>")) {
        html = html.replace("</head>", `${styleTag}\n</head>`);
      } else {
        html = styleTag + "\n" + html;
      }
    }

    // Inject JS (replace script src references with inline)
    if (jsFile) {
      const scriptTag = `<script>${jsFile.code}<\/script>`;
      // Remove external script references to our files
      html = html.replace(/<script\s+src=["']script\.js["']\s*><\/script>/gi, "");
      if (html.includes("</body>")) {
        html = html.replace("</body>", `${scriptTag}\n</body>`);
      } else {
        html = html + "\n" + scriptTag;
      }
    }

    return html;
  }

  // Fallback: build a simple page
  return `<!DOCTYPE html>
<html><head><style>${cssFile?.code || ""}</style></head>
<body><script>${jsFile?.code || ""}<\/script></body></html>`;
}

function countLines(text: string): number {
  return text.split("\n").length;
}

/* ------------------------------------------------------------------ */
/*  LineNumbers sub-component                                          */
/* ------------------------------------------------------------------ */

function LineNumbers({ count, scrollTop }: { count: number; scrollTop: number }) {
  return (
    <div
      className="select-none text-right pr-3 pt-3 text-xs leading-[1.5rem] text-slate-500 min-w-[3rem] flex-shrink-0"
      style={{ transform: `translateY(-${scrollTop}px)` }}
      aria-hidden
    >
      {Array.from({ length: count }, (_, i) => (
        <div key={i}>{i + 1}</div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  CodeSandbox                                                        */
/* ------------------------------------------------------------------ */

export function CodeSandbox({ content, lessonId, onComplete }: CodeSandboxProps) {
  /* --- State: files ------------------------------------------------ */
  const [files, setFiles] = useState<FileData[]>(() =>
    parseStarterCode(content.starter_code)
  );
  const [activeFile, setActiveFile] = useState(files[0]?.name ?? "index.html");

  /* --- State: UI --------------------------------------------------- */
  const [taskOpen, setTaskOpen] = useState(true);
  const [showPreview, setShowPreview] = useState(true);
  const [scrollTop, setScrollTop] = useState(0);

  /* --- State: hints & AI ------------------------------------------- */
  const [revealedHints, setRevealedHints] = useState(0);
  const [aiHint, setAiHint] = useState("");
  const [aiLoading, setAiLoading] = useState(false);

  /* --- State: evaluation ------------------------------------------- */
  const [attempts, setAttempts] = useState(0);
  const [evaluating, setEvaluating] = useState(false);
  const [evalResult, setEvalResult] = useState<{
    score: number;
    feedback: string;
  } | null>(null);

  /* --- Refs -------------------------------------------------------- */
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  /* --- Derived ----------------------------------------------------- */
  const currentFile = files.find((f) => f.name === activeFile) ?? files[0];
  const lineCount = countLines(currentFile.code);
  const maxAttempts = content.max_attempts ?? 0; // 0 = unlimited
  const attemptsExhausted = maxAttempts > 0 && attempts >= maxAttempts;

  const srcdoc = useMemo(() => buildSrcdoc(files), [files]);

  /* --- Handlers ---------------------------------------------------- */
  const updateFileCode = useCallback(
    (code: string) => {
      setFiles((prev) =>
        prev.map((f) => (f.name === activeFile ? { ...f, code } : f))
      );
    },
    [activeFile]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Tab") {
        e.preventDefault();
        const ta = e.currentTarget;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const value = ta.value;
        const newValue = value.substring(0, start) + "  " + value.substring(end);
        updateFileCode(newValue);

        // Restore cursor after React re-render
        requestAnimationFrame(() => {
          ta.selectionStart = start + 2;
          ta.selectionEnd = start + 2;
        });
      }
    },
    [updateFileCode]
  );

  const handleScroll = useCallback(() => {
    if (textareaRef.current) {
      setScrollTop(textareaRef.current.scrollTop);
    }
  }, []);

  // Keep textarea cursor stable on file switches
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = 0;
      setScrollTop(0);
    }
  }, [activeFile]);

  /* --- Run Preview ------------------------------------------------- */
  const runPreview = useCallback(() => {
    setShowPreview(true);
    // Force iframe reload by briefly nullifying
    if (iframeRef.current) {
      iframeRef.current.srcdoc = "";
      requestAnimationFrame(() => {
        if (iframeRef.current) {
          iframeRef.current.srcdoc = srcdoc;
        }
      });
    }
  }, [srcdoc]);

  /* --- Reveal Hint ------------------------------------------------- */
  const revealNextHint = useCallback(() => {
    if (content.hints && revealedHints < content.hints.length) {
      setRevealedHints((prev) => prev + 1);
    }
  }, [content.hints, revealedHints]);

  /* --- AI Helper --------------------------------------------------- */
  const askAiHint = useCallback(async () => {
    setAiLoading(true);
    setAiHint("");
    try {
      const allCode = files.map((f) => `// --- ${f.name} ---\n${f.code}`).join("\n\n");
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "hint",
          lessonId,
          question: "Помоги мне с заданием. Не давай прямой ответ.",
          context: `Задание: ${content.task_description}\n\nТекущий код:\n${allCode}`,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        setAiHint(json.data?.hint || "Не удалось получить подсказку.");
      } else {
        setAiHint("Ошибка запроса. Попробуйте позже.");
      }
    } catch {
      setAiHint("Не удалось связаться с AI. Проверьте подключение.");
    } finally {
      setAiLoading(false);
    }
  }, [files, lessonId, content.task_description]);

  /* --- Evaluate ---------------------------------------------------- */
  const evaluate = useCallback(async () => {
    if (attemptsExhausted) return;
    setEvaluating(true);
    setEvalResult(null);

    try {
      const allCode = files.map((f) => `// --- ${f.name} ---\n${f.code}`).join("\n\n");
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sandbox_evaluate",
          lessonId,
          userResponse: allCode,
          referenceSolution: content.reference_solution || "",
          evaluationCriteria: content.evaluation_criteria || content.task_description,
          taskDescription: content.task_description,
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const ev = json.data?.evaluation;
        setEvalResult({
          score: ev?.score ?? 0,
          feedback: ev?.feedback ?? "Оценка недоступна.",
        });
        setAttempts((prev) => prev + 1);

        if (ev?.score >= 60 && onComplete) {
          // Don't auto-call; let user click "Завершить"
        }
      } else {
        setEvalResult({ score: 0, feedback: "Ошибка оценки. Попробуйте позже." });
      }
    } catch {
      setEvalResult({
        score: 0,
        feedback: "Не удалось связаться с AI. Проверьте подключение.",
      });
    } finally {
      setEvaluating(false);
    }
  }, [
    files,
    lessonId,
    content.reference_solution,
    content.evaluation_criteria,
    content.task_description,
    attemptsExhausted,
    onComplete,
  ]);

  /* --- Reset ------------------------------------------------------- */
  const resetCode = useCallback(() => {
    setFiles(parseStarterCode(content.starter_code));
    setEvalResult(null);
    setAiHint("");
    setRevealedHints(0);
  }, [content.starter_code]);

  /* ================================================================ */
  /*  RENDER                                                           */
  /* ================================================================ */

  return (
    <div className="space-y-4">
      {/* --- Task Description --------------------------------------- */}
      <Card>
        <CardHeader
          className="cursor-pointer select-none"
          onClick={() => setTaskOpen((v) => !v)}
        >
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Code2 className="h-4 w-4" />
              Задание
            </CardTitle>
            <div className="flex items-center gap-2">
              {maxAttempts > 0 && (
                <Badge variant="outline">
                  Попытка {attempts} из {maxAttempts}
                </Badge>
              )}
              <Badge variant="secondary">Код</Badge>
              {taskOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
          </div>
        </CardHeader>
        {taskOpen && (
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{content.task_description}</p>
          </CardContent>
        )}
      </Card>

      {/* --- Editor + Preview --------------------------------------- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Editor Panel */}
        <div className="flex flex-col rounded-xl border bg-[#1e1e2e] text-white shadow overflow-hidden min-h-[400px]">
          {/* File Tabs */}
          <Tabs value={activeFile} onValueChange={setActiveFile}>
            <div className="flex items-center justify-between bg-[#181825] px-2 border-b border-[#313244]">
              <TabsList className="bg-transparent h-10 gap-0 p-0">
                {files.map((f) => (
                  <TabsTrigger
                    key={f.name}
                    value={f.name}
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-violet-400 data-[state=active]:bg-[#1e1e2e] data-[state=active]:text-violet-300 data-[state=active]:shadow-none bg-transparent text-slate-400 hover:text-slate-200 px-3 py-2 text-xs font-mono"
                  >
                    {f.name}
                  </TabsTrigger>
                ))}
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                className="text-green-400 hover:text-green-300 hover:bg-green-900/30 h-7 px-2 text-xs gap-1"
                onClick={runPreview}
              >
                <Play className="h-3 w-3" />
                Запуск
              </Button>
            </div>

            {files.map((f) => (
              <TabsContent key={f.name} value={f.name} className="flex-1 mt-0 relative">
                <div className="flex h-full overflow-hidden">
                  {/* Line numbers */}
                  <div className="overflow-hidden border-r border-[#313244] bg-[#181825]">
                    <LineNumbers count={countLines(f.code)} scrollTop={scrollTop} />
                  </div>
                  {/* Textarea */}
                  <textarea
                    ref={f.name === activeFile ? textareaRef : undefined}
                    value={f.code}
                    onChange={(e) => updateFileCode(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onScroll={handleScroll}
                    spellCheck={false}
                    className="flex-1 bg-transparent text-[#cdd6f4] caret-violet-400 font-mono text-sm leading-[1.5rem] p-3 resize-none outline-none w-full min-h-[350px] placeholder:text-slate-600"
                    placeholder="Пишите код здесь..."
                  />
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </div>

        {/* Preview Panel */}
        <div className="flex flex-col rounded-xl border shadow overflow-hidden min-h-[400px] bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2 px-3 py-2 border-b bg-muted/50">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">Предпросмотр</span>
            <Button
              variant="ghost"
              size="sm"
              className="ml-auto h-6 px-2 text-xs"
              onClick={() => setShowPreview((v) => !v)}
            >
              {showPreview ? "Скрыть" : "Показать"}
            </Button>
          </div>
          {showPreview && (
            <iframe
              ref={iframeRef}
              srcDoc={srcdoc}
              title="Предпросмотр"
              sandbox="allow-scripts"
              className="flex-1 w-full min-h-[350px] bg-white"
            />
          )}
        </div>
      </div>

      {/* --- Bottom Bar --------------------------------------------- */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Hints */}
        {content.hints && content.hints.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={revealNextHint}
            disabled={revealedHints >= content.hints.length}
          >
            <Lightbulb className="h-4 w-4" />
            Подсказка
            {content.hints.length > 1 && (
              <span className="text-xs text-muted-foreground ml-1">
                ({revealedHints}/{content.hints.length})
              </span>
            )}
          </Button>
        )}

        {/* AI Helper */}
        <Button
          variant="outline"
          size="sm"
          onClick={askAiHint}
          disabled={aiLoading}
        >
          {aiLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Brain className="h-4 w-4" />
          )}
          AI-помощник
        </Button>

        {/* Evaluate */}
        <Button
          size="sm"
          onClick={evaluate}
          disabled={evaluating || attemptsExhausted}
        >
          {evaluating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
          Проверить
        </Button>

        {/* Reset */}
        <Button variant="ghost" size="sm" onClick={resetCode}>
          <RotateCcw className="h-4 w-4" />
          Сбросить
        </Button>

        {/* Attempts counter */}
        {maxAttempts > 0 && (
          <span className="ml-auto text-xs text-muted-foreground">
            Попытка {attempts} из {maxAttempts}
          </span>
        )}
      </div>

      {/* --- Hints -------------------------------------------------- */}
      {revealedHints > 0 && content.hints && (
        <div className="space-y-2">
          {content.hints.slice(0, revealedHints).map((hint, idx) => (
            <Card
              key={idx}
              className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800"
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">
                    <span className="font-medium text-yellow-700 dark:text-yellow-400">
                      Подсказка {idx + 1}:
                    </span>{" "}
                    {hint}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* --- AI Hint Response --------------------------------------- */}
      {aiHint && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-900/10 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-600" />
              AI-помощник
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{aiHint}</p>
          </CardContent>
        </Card>
      )}

      {/* --- Evaluation Result -------------------------------------- */}
      {evalResult && (
        <Card
          className={
            evalResult.score >= 60
              ? "border-green-300 bg-green-50 dark:bg-green-900/10 dark:border-green-800"
              : "border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-800"
          }
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">Результат проверки</CardTitle>
              <Badge
                variant={evalResult.score >= 60 ? "default" : "secondary"}
                className={
                  evalResult.score >= 60
                    ? "bg-green-600 hover:bg-green-600"
                    : ""
                }
              >
                {evalResult.score} / 100
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm whitespace-pre-wrap">{evalResult.feedback}</p>
            {evalResult.score >= 60 && onComplete && (
              <Button
                onClick={() => onComplete(evalResult.score)}
                className="bg-green-600 hover:bg-green-700"
              >
                Завершить
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
