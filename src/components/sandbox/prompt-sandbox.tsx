"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Send, Loader2, CheckCircle, Lightbulb, RotateCcw } from "lucide-react";
import type { SandboxContent } from "@/types";

interface PromptSandboxProps {
  content: SandboxContent;
  lessonId: string;
  onComplete: (score: number) => void;
}

export function PromptSandbox({ content, lessonId, onComplete }: PromptSandboxProps) {
  const [userInput, setUserInput] = useState(content.starter_code || "");
  const [aiResponse, setAiResponse] = useState("");
  const [evaluation, setEvaluation] = useState<{ score: number; feedback: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [currentHint, setCurrentHint] = useState(0);

  const handleSubmit = async () => {
    if (!userInput.trim()) return;
    setLoading(true);

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "sandbox_evaluate",
          lessonId,
          userResponse: userInput,
          referenceSolution: content.reference_solution,
          evaluationCriteria: content.evaluation_criteria,
          taskDescription: content.task_description,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAiResponse(json.data.aiResponse || "");
        setEvaluation(json.data.evaluation);
        setAttempts(attempts + 1);

        if (json.data.evaluation?.score >= 70) {
          onComplete(json.data.evaluation.score);
        }
      }
    } catch {
      // Offline fallback
      setEvaluation({ score: 0, feedback: "Не удалось связаться с AI. Попробуйте позже." });
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setAiResponse("");
    setEvaluation(null);
    setUserInput(content.starter_code || "");
  };

  const nextHint = () => {
    setShowHint(true);
    if (content.hints && currentHint < content.hints.length - 1) {
      setCurrentHint(currentHint + 1);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Задание</CardTitle>
            <div className="flex items-center gap-2">
              {content.max_attempts && (
                <Badge variant="outline">
                  Попытка {attempts}/{content.max_attempts}
                </Badge>
              )}
              <Badge variant="secondary">
                {content.sandbox_type === "prompt" ? "Промпт" : "Код"}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm whitespace-pre-wrap">{content.task_description}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-3">
          <label className="text-sm font-medium">
            {content.sandbox_type === "prompt" ? "Ваш промпт" : "Ваш код"}
          </label>
          <Textarea
            rows={12}
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            placeholder={
              content.sandbox_type === "prompt"
                ? "Напишите промпт здесь..."
                : "Напишите код здесь..."
            }
            className="font-mono text-sm"
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={loading || !userInput.trim()}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Оценка...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  Отправить
                </>
              )}
            </Button>
            {content.hints && content.hints.length > 0 && (
              <Button variant="outline" onClick={nextHint}>
                <Lightbulb className="h-4 w-4" />
                Подсказка
              </Button>
            )}
            {evaluation && (
              <Button variant="outline" onClick={handleRetry}>
                <RotateCcw className="h-4 w-4" />
                Сбросить
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {showHint && content.hints && (
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10 dark:border-yellow-800">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <Lightbulb className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <p className="text-sm">{content.hints[currentHint]}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {aiResponse && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Ответ AI</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{aiResponse}</p>
              </CardContent>
            </Card>
          )}

          {evaluation && (
            <Card className={evaluation.score >= 70 ? "border-green-200" : "border-orange-200"}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Оценка</CardTitle>
                  <div className="flex items-center gap-2">
                    {evaluation.score >= 70 && <CheckCircle className="h-4 w-4 text-green-600" />}
                    <Badge variant={evaluation.score >= 70 ? "default" : "secondary"}>
                      {evaluation.score}/100
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{evaluation.feedback}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
