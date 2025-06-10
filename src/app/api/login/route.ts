import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { recordLoginAttempt, isLocked } from "@/lib/loginAttemptStore";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (isLocked(email)) {
    return NextResponse.json(
      { error: "10분 잠김" },
      { status: 429 }
    );
  }

  const isValid = email === "Sejong@example.com" && password === "Sejong123##";

  const lockMessage = recordLoginAttempt(email, isValid);
  if (!isValid) {
    return NextResponse.json({ error: lockMessage || "이메일 또는 비밀번호가 잘못되었습니다." }, { status: 401 });
  }

  const session = await getSession();
  session.email = email;
  session.isLoggedIn = true;
  session.lastActivity = Date.now(); // 활동 기록
  await session.save();

  return NextResponse.json({ ok: true, email });
}

