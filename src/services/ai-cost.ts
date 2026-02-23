import { prisma } from "@/lib/prisma";
import { redis } from "@/lib/redis";

// Approximate cost per 1M tokens (input/output) by model
const MODEL_COSTS: Record<string, { input: number; output: number }> = {
  "anthropic/claude-sonnet-4-5-20250514": { input: 3.0, output: 15.0 },
  "anthropic/claude-haiku-4-5-20251001": { input: 0.8, output: 4.0 },
  "openai/gpt-4o": { input: 2.5, output: 10.0 },
  "openai/gpt-4o-mini": { input: 0.15, output: 0.6 },
};

export function estimateCost(
  model: string,
  tokensInput: number,
  tokensOutput: number
): number {
  const costs = MODEL_COSTS[model] || { input: 1.0, output: 3.0 };
  return (
    (tokensInput / 1_000_000) * costs.input +
    (tokensOutput / 1_000_000) * costs.output
  );
}

export async function checkBudget(
  userId: string,
  dailyLimitUsd = 0.5
): Promise<{ allowed: boolean; spent: number; limit: number }> {
  const cacheKey = `ai_budget:${userId}:${new Date().toISOString().slice(0, 10)}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    const spent = parseFloat(cached);
    return { allowed: spent < dailyLimitUsd, spent, limit: dailyLimitUsd };
  }

  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const result = await prisma.aiInteraction.aggregate({
    where: {
      userId,
      createdAt: { gte: startOfDay },
    },
    _sum: { costUsd: true },
  });

  const spent = Number(result._sum.costUsd || 0);
  await redis.setex(cacheKey, 300, spent.toString()); // cache 5 min

  return { allowed: spent < dailyLimitUsd, spent, limit: dailyLimitUsd };
}

export async function getMonthlyAiCost(): Promise<number> {
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const result = await prisma.aiInteraction.aggregate({
    where: { createdAt: { gte: startOfMonth } },
    _sum: { costUsd: true },
  });

  return Number(result._sum.costUsd || 0);
}
