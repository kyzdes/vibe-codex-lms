"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";

const faqItems = [
  {
    question: "Что такое вайб-кодинг?",
    answer:
      "Вайб-кодинг — это подход к разработке, при котором вы описываете свои идеи естественным языком, а AI-инструменты помогают превратить их в работающий код. Это позволяет создавать продукты без глубоких знаний программирования.",
  },
  {
    question: "Нужен ли опыт программирования?",
    answer:
      "Нет! Наши курсы рассчитаны на людей без опыта разработки — дизайнеров, маркетологов, продакт-менеджеров и всех, кто хочет создавать цифровые продукты.",
  },
  {
    question: "Курсы платные?",
    answer:
      "Есть бесплатные курсы для начала. Продвинутые курсы доступны по подписке или разовой оплате.",
  },
  {
    question: "Какие AI-модели используются?",
    answer:
      "Мы интегрированы с Claude, GPT-4o и другими моделями через OpenRouter. Вы можете экспериментировать с разными моделями прямо на платформе.",
  },
];

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function toggle(index: number) {
    setOpenIndex(openIndex === index ? null : index);
  }

  return (
    <section className="container py-20">
      <div className="text-center mb-12">
        <div className="mx-auto mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <HelpCircle className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-3xl font-bold">Частые вопросы</h2>
        <p className="mt-3 text-muted-foreground">
          Ответы на самые популярные вопросы о платформе
        </p>
      </div>
      <div className="mx-auto max-w-2xl divide-y rounded-lg border">
        {faqItems.map((item, index) => (
          <div key={index}>
            <button
              type="button"
              onClick={() => toggle(index)}
              className="flex w-full items-center justify-between px-6 py-4 text-left text-sm font-medium hover:bg-muted/50 transition-colors"
            >
              <span>{item.question}</span>
              <ChevronDown
                className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
              />
            </button>
            {openIndex === index && (
              <div className="px-6 pb-4 text-sm text-muted-foreground">
                {item.answer}
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
