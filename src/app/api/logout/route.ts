import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST() {
  const session = await getSession();
  session.destroy(); // 세션 제거
  return NextResponse.json({ ok: true });
}

