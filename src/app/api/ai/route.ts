import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limiter";
import { checkBudget, estimateCost } from "@/services/ai-cost";
import { createCompletion, evaluateWithAI, logAiInteraction } from "@/services/openrouter";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Rate limiting: 20 requests per minute
  const rl = await rateLimit(`ai:${session.user.id}`, 20, 60);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Слишком много запросов. Подождите." },
      { status: 429 }
    );
  }

  // Budget check
  const budget = await checkBudget(session.user.id);
  if (!budget.allowed) {
    return NextResponse.json(
      { error: "Дневной лимит AI-запросов исчерпан." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { action, lessonId } = body;

  try {
    switch (action) {
      case "sandbox_evaluate": {
        const { userResponse, referenceSolution, evaluationCriteria, taskDescription } = body;
        const model = "anthropic/claude-sonnet-4-5-20250514";

        // Get AI response to user's prompt
        let aiResponse = "";
        if (body.getAiResponse) {
          const aiRes = await createCompletion({
            model,
            messages: [
              { role: "system", content: "You are a helpful AI assistant." },
              { role: "user", content: userResponse },
            ],
          });
          const aiData = await aiRes.json();
          aiResponse = aiData.choices?.[0]?.message?.content || "";
        }

        // Evaluate
        const evaluation = await evaluateWithAI(
          userResponse,
          referenceSolution || "",
          evaluationCriteria || taskDescription,
          model
        );

        // Log interaction
        const cost = estimateCost(model, 500, 300);
        await logAiInteraction({
          userId: session.user.id,
          lessonId,
          model,
          tokensInput: 500,
          tokensOutput: 300,
          costUsd: cost,
          requestType: "sandbox_evaluate",
        });

        return NextResponse.json({
          data: { aiResponse, evaluation },
        });
      }

      case "hint": {
        const { question, context } = body;
        const model = "anthropic/claude-haiku-4-5-20251001";

        const res = await createCompletion({
          model,
          messages: [
            {
              role: "system",
              content:
                "Ты — обучающий помощник VibeLearn. Давай подсказки, но НЕ давай прямой ответ. Используй метод Сократа — задавай наводящие вопросы. Отвечай на русском языке. Будь кратким.",
            },
            {
              role: "user",
              content: `Контекст урока: ${context}\n\nВопрос ученика: ${question}`,
            },
          ],
          temperature: 0.5,
          maxTokens: 512,
        });

        const data = await res.json();
        const hint = data.choices?.[0]?.message?.content || "";

        const cost = estimateCost(model, 200, 150);
        await logAiInteraction({
          userId: session.user.id,
          lessonId,
          model,
          tokensInput: 200,
          tokensOutput: 150,
          costUsd: cost,
          requestType: "hint",
        });

        return NextResponse.json({ data: { hint } });
      }

      case "explain": {
        const { text, context } = body;
        const model = "anthropic/claude-haiku-4-5-20251001";

        const res = await createCompletion({
          model,
          messages: [
            {
              role: "system",
              content:
                "Ты — обучающий помощник. Объясни выделенный фрагмент простым языком. Приведи примеры. Отвечай на русском. Будь кратким.",
            },
            {
              role: "user",
              content: `Контекст: ${context}\n\nОбъясни: ${text}`,
            },
          ],
          temperature: 0.5,
          maxTokens: 1024,
        });

        const data = await res.json();
        const explanation = data.choices?.[0]?.message?.content || "";

        const cost = estimateCost(model, 300, 300);
        await logAiInteraction({
          userId: session.user.id,
          lessonId,
          model,
          tokensInput: 300,
          tokensOutput: 300,
          costUsd: cost,
          requestType: "explain",
        });

        return NextResponse.json({ data: { explanation } });
      }

      default:
        return NextResponse.json({ error: "Unknown action" }, { status: 400 });
    }
  } catch (error) {
    console.error("AI API error:", error);
    return NextResponse.json(
      { error: "AI service unavailable" },
      { status: 503 }
    );
  }
}
