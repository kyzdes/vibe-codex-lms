import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function verifyWebhookHMAC(body: string, signature: string): boolean {
  const secret = process.env.CLOUDPAYMENTS_API_SECRET;
  if (!secret) return false;

  const hmac = crypto.createHmac("sha256", secret).update(body).digest("base64");
  return crypto.timingSafeEqual(Buffer.from(hmac), Buffer.from(signature));
}

export interface CreateOrderParams {
  userId: string;
  courseId: string;
  amount: number;
  currency?: string;
  description: string;
}

export async function createOrder(params: CreateOrderParams) {
  const payment = await prisma.payment.create({
    data: {
      userId: params.userId,
      amount: params.amount,
      currency: params.currency || "RUB",
      status: "PENDING",
      metadata: {
        courseId: params.courseId,
        description: params.description,
      },
    },
  });

  return {
    paymentId: payment.id,
    publicId: process.env.CLOUDPAYMENTS_PUBLIC_ID,
    amount: params.amount / 100, // Convert kopeks to rubles for widget
    currency: params.currency || "RUB",
    description: params.description,
    invoiceId: payment.id,
    accountId: params.userId,
  };
}

export async function confirmPayment(
  transactionId: string,
  invoiceId: string,
  amount: number
) {
  // Idempotency check
  const existing = await prisma.payment.findUnique({
    where: { transactionId },
  });
  if (existing) return existing;

  const payment = await prisma.payment.update({
    where: { id: invoiceId },
    data: {
      transactionId,
      status: "SUCCESS",
    },
  });

  const metadata = payment.metadata as { courseId?: string } | null;
  if (metadata?.courseId) {
    await prisma.enrollment.upsert({
      where: {
        userId_courseId: {
          userId: payment.userId,
          courseId: metadata.courseId,
        },
      },
      create: {
        userId: payment.userId,
        courseId: metadata.courseId,
        paymentId: payment.id,
      },
      update: {},
    });
  }

  return payment;
}

export async function failPayment(invoiceId: string) {
  return prisma.payment.update({
    where: { id: invoiceId },
    data: { status: "FAILED" },
  });
}

export async function refundPayment(transactionId: string) {
  const payment = await prisma.payment.update({
    where: { transactionId },
    data: { status: "REFUNDED" },
  });

  const metadata = payment.metadata as { courseId?: string } | null;
  if (metadata?.courseId) {
    await prisma.enrollment.deleteMany({
      where: {
        userId: payment.userId,
        courseId: metadata.courseId,
      },
    });
  }

  return payment;
}
