import { NextRequest } from "next/server";

const cachedAlerts: unknown[] = [];

export async function POST(req: NextRequest) {
  try {
    const text = await req.text();

    let body: unknown;
    try {
      body = JSON.parse(text);
    } catch {
      console.error("⚠ JSON 파싱 실패:", text);
      return new Response(JSON.stringify({ error: "Invalid JSON" }), { status: 400 });
    }

    if (typeof body === "object" && body !== null) {
      cachedAlerts.push({
        ...(body as Record<string, unknown>),
        timestamp: new Date().toISOString(),
      });
    } else {
      return new Response(JSON.stringify({ error: "Invalid format" }), { status: 400 });
    }

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("웹훅 처리 실패:", err);
    return new Response(JSON.stringify({ error: "Webhook failed" }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify(cachedAlerts), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
