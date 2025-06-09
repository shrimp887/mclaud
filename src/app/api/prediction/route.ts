import { NextRequest } from "next/server";

interface AlertPayload {
  TID: string;
  [key: string]: unknown; // 유연한 필드 허용
}

const cachedAlerts: (AlertPayload & { timestamp: string })[] = [];

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

    if (typeof body === "object" && body !== null && "TID" in body) {
      const newTID = (body as AlertPayload).TID;

      const last = cachedAlerts.at(-1);
      const lastTID = last?.TID;

      if (lastTID === newTID) {
        console.log(`⚠ 중복된 TID (${newTID}) 무시됨`);
        return new Response(JSON.stringify({ ignored: true }), { status: 200 });
      }

      cachedAlerts.push({
        ...(body as AlertPayload),
        timestamp: new Date().toISOString(),
      });

      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ error: "Invalid format" }), { status: 400 });
    }
  } catch (err) {
    console.error("❌ 웹훅 처리 실패:", err);
    return new Response(JSON.stringify({ error: "Webhook failed" }), { status: 500 });
  }
}

export async function GET() {
  return new Response(JSON.stringify(cachedAlerts), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

