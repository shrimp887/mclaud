import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (email === "Sejong@example.com" && password === "Sejong123##") {
    const session = await getSession();
    session.email = email;
    session.isLoggedIn = true;
    await session.save();

    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
}

