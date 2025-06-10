import { SessionOptions, getIronSession } from "iron-session";
import { cookies } from "next/headers";

export interface UserSession {
  email?: string;
  isLoggedIn?: boolean;
  lastActivity?: number;
}

export const sessionOptions: SessionOptions = {
  cookieName: "my_dashboard_session",
  password: process.env.SESSION_PASSWORD!,
  cookieOptions: {
    secure: false,
  },
};

export async function getSession() {
  const cookieStore = await cookies();
  return getIronSession<UserSession>(cookieStore, sessionOptions);
}

