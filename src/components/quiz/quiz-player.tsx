"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, ArrowRight, RotateCcw } from "lucide-react";
import type { QuizContent, QuizQuestion } from "@/types";

interface QuizPlayerProps {
  content: QuizContent;
  onComplete: (score: number, answers: Record<string, string | string[]>) => void;
}

export function QuizPlayer({ content, onComplete }: QuizPlayerProps) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});
  const [showResult, setShowResult] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const questions = content.questions;
  const currentQ = questions[currentIdx];

  const selectAnswer = (questionId: string, value: string) => {
    if (submitted) return;
    const q = questions.find((q) => q.id === questionId);
    if (!q) return;

    if (q.type === "multiple_choice") {
      const current = (answers[questionId] as string[]) || [];
      const updated = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      setAnswers({ ...answers, [questionId]: updated });
    } else {
      setAnswers({ ...answers, [questionId]: value });
    }
  };

  const calculateScore = () => {
    let earned = 0;
    let total = 0;

    for (const q of questions) {
      total += q.points;
      const answer = answers[q.id];
      if (!answer) continue;

      if (q.type === "multiple_choice") {
        const correctSet = new Set(q.correct as string[]);
        const answerSet = new Set(answer as string[]);
        if (
          correctSet.size === answerSet.size &&
          [...correctSet].every((v) => answerSet.has(v))
        ) {
          earned += q.points;
        }
      } else if (q.type === "free_text") {
        // Free text: basic check (case-insensitive)
        if (
          (answer as string).toLowerCase().trim() ===
          (q.correct as string).toLowerCase().trim()
        ) {
          earned += q.points;
        }
      } else {
        if (answer === q.correct) {
          earned += q.points;
        }
      }
    }

    return Math.round((earned / total) * 100);
  };

  const handleSubmit = () => {
    const score = calculateScore();
    setSubmitted(true);
    setShowResult(true);
    onComplete(score, answers);
  };

  const handleRetry = () => {
    setAnswers({});
    setCurrentIdx(0);
    setSubmitted(false);
    setShowResult(false);
  };

  const isCorrect = (q: QuizQuestion) => {
    const answer = answers[q.id];
    if (!answer) return false;
    if (q.type === "multiple_choice") {
      const correctSet = new Set(q.correct as string[]);
      const answerSet = new Set(answer as string[]);
      return correctSet.size === answerSet.size && [...correctSet].every((v) => answerSet.has(v));
    }
    if (q.type === "free_text") {
      return (answer as string).toLowerCase().trim() === (q.correct as string).toLowerCase().trim();
    }
    return answer === q.correct;
  };

  if (showResult) {
    const score = calculateScore();
    const passed = score >= content.pass_threshold;

    return (
      <Card>
        <CardHeader className="text-center">
          <div className={`mx-auto mb-2 flex h-16 w-16 items-center justify-center rounded-full ${passed ? "bg-green-100 dark:bg-green-900/30" : "bg-red-100 dark:bg-red-900/30"}`}>
            {passed ? (
              <CheckCircle className="h-8 w-8 text-green-600" />
            ) : (
              <XCircle className="h-8 w-8 text-red-600" />
            )}
          </div>
          <CardTitle className="text-xl">
            {passed ? "Квиз пройден!" : "Попробуйте ещё раз"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <span className="text-3xl font-bold">{score}%</span>
            <p className="text-sm text-muted-foreground">
              Порог: {content.pass_threshold}%
            </p>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div key={q.id} className="flex items-start gap-2 text-sm">
                {isCorrect(q) ? (
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                )}
                <div>
                  <p>{idx + 1}. {q.text}</p>
                  {q.explanation && !isCorrect(q) && (
                    <p className="text-muted-foreground mt-1">{q.explanation}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {!passed && (
            <Button onClick={handleRetry} className="w-full">
              <RotateCcw className="h-4 w-4 mr-2" />
              Пройти снова
            </Button>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Вопрос {currentIdx + 1} из {questions.length}
          </Badge>
          <Badge>{currentQ.points} баллов</Badge>
        </div>
        <CardTitle className="text-base mt-2">{currentQ.text}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {currentQ.type === "free_text" ? (
          <textarea
            className="flex min-h-[80px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm"
            placeholder="Ваш ответ..."
            value={(answers[currentQ.id] as string) || ""}
            onChange={(e) => setAnswers({ ...answers, [currentQ.id]: e.target.value })}
          />
        ) : (
          currentQ.options?.map((opt) => {
            const selected = currentQ.type === "multiple_choice"
              ? ((answers[currentQ.id] as string[]) || []).includes(opt.id)
              : answers[currentQ.id] === opt.id;

            return (
              <button
                key={opt.id}
                onClick={() => selectAnswer(currentQ.id, opt.id)}
                className={`w-full text-left rounded-lg border p-3 text-sm transition-colors ${
                  selected
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {opt.text}
              </button>
            );
          })
        )}

        <div className="flex justify-between pt-2">
          <Button
            variant="outline"
            disabled={currentIdx === 0}
            onClick={() => setCurrentIdx(currentIdx - 1)}
          >
            Назад
          </Button>
          {currentIdx < questions.length - 1 ? (
            <Button onClick={() => setCurrentIdx(currentIdx + 1)}>
              Далее
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleSubmit}>Завершить квиз</Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
