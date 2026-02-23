import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookHMAC, confirmPayment, failPayment } from "@/services/cloudpayments";

// POST — CloudPayments webhook
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("Content-HMAC") || "";

  // Verify HMAC signature
  if (process.env.CLOUDPAYMENTS_API_SECRET && !verifyWebhookHMAC(body, signature)) {
    return NextResponse.json({ code: 13 }, { status: 401 });
  }

  const params = new URLSearchParams(body);
  const transactionId = params.get("TransactionId") || "";
  const invoiceId = params.get("InvoiceId") || "";
  const amount = parseFloat(params.get("Amount") || "0");
  const status = params.get("Status");

  try {
    if (status === "Completed" || status === "Authorized") {
      await confirmPayment(transactionId, invoiceId, amount);
    } else if (status === "Declined") {
      await failPayment(invoiceId);
    }

    // CloudPayments expects { "code": 0 } for success
    return NextResponse.json({ code: 0 });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ code: 0 });
  }
}
