import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { recordLoginAttempt, isLocked } from "@/lib/loginAttemptStore";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (isLocked(email)) {
    return NextResponse.json(
      { error: "Locked for 10 minutes" },
      { status: 429 }
    );
  }

  const isValid = email === "Sejong@example.com" && password === "Sejong123##";

  const lockMessage = recordLoginAttempt(email, isValid);

  if (!isValid || lockMessage) {
    return NextResponse.json(
      { error: lockMessage || "Invalid Credentials" },
      { status: lockMessage ? 429 : 401 }
    );
  }

  // 로그인 성공 시 세션 저장
  const session = await getSession();
  session.email = email;
  session.isLoggedIn = true;
  session.lastActivity = Date.now();
  await session.save();

  return NextResponse.json({ ok: true, email });
}

