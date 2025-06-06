import { getSession } from "@/lib/session";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();

  return NextResponse.json({
    email: session.email ?? null,
    isLoggedIn: session.isLoggedIn ?? false,
  });
}

