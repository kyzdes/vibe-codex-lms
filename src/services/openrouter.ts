import { prisma } from "@/lib/prisma";

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1";

interface CompletionOptions {
  model: string;
  messages: { role: "system" | "user" | "assistant"; content: string }[];
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
}

export async function createCompletion(options: CompletionOptions) {
  const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      "X-Title": "VibeLearn LMS",
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      max_tokens: options.maxTokens || 2048,
      temperature: options.temperature ?? 0.7,
      stream: options.stream ?? false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} ${error}`);
  }

  return response;
}

export async function createStreamingCompletion(options: CompletionOptions) {
  return createCompletion({ ...options, stream: true });
}

export async function evaluateWithAI(
  userResponse: string,
  referenceSolution: string,
  evaluationCriteria: string,
  model = "anthropic/claude-sonnet-4-5-20250514"
): Promise<{ score: number; feedback: string }> {
  const response = await createCompletion({
    model,
    messages: [
      {
        role: "system",
        content: `You are an educational AI evaluator. Evaluate the student's response against the reference solution using the provided criteria. Return a JSON object with "score" (0-100) and "feedback" (a brief explanation in Russian).`,
      },
      {
        role: "user",
        content: `## Evaluation Criteria\n${evaluationCriteria}\n\n## Reference Solution\n${referenceSolution}\n\n## Student's Response\n${userResponse}\n\nReturn JSON: { "score": number, "feedback": "string" }`,
      },
    ],
    temperature: 0.3,
  });

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content || "";

  try {
    const match = content.match(/\{[\s\S]*"score"[\s\S]*"feedback"[\s\S]*\}/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch {
    // Fall through
  }

  return { score: 0, feedback: "Не удалось провести оценку" };
}

export async function logAiInteraction(params: {
  userId: string;
  lessonId?: string;
  model: string;
  tokensInput: number;
  tokensOutput: number;
  costUsd: number;
  requestType: string;
}) {
  await prisma.aiInteraction.create({
    data: {
      userId: params.userId,
      lessonId: params.lessonId,
      model: params.model,
      tokensInput: params.tokensInput,
      tokensOutput: params.tokensOutput,
      costUsd: params.costUsd,
      requestType: params.requestType,
    },
  });
}
