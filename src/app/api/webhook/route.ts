// src/app/api/webhook/route.ts
import { NextRequest } from "next/server";

let cachedAlerts: any[] = [];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("🚨 웹훅 수신됨:", body);

    // 메모리에 저장
    cachedAlerts.push({
      ...body,
      timestamp: new Date().toISOString(),
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (err) {
    console.error("웹훅 파싱 실패:", err);
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      status: 400,
    });
  }
}

export function GET() {
  // 저장된 경보 데이터 반환
  return new Response(JSON.stringify(cachedAlerts), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

