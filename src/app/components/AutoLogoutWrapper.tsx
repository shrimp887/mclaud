"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AutoLogoutWrapper({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const resetTimer = () => {
      clearTimeout(timeout);
      timeout = setTimeout(async () => {
        await fetch("/api/logout", { method: "POST" });
        router.replace("/login");
      }, 10 * 60 * 1000);
    };

    const events = ["mousemove", "keydown", "click"];
    events.forEach((event) => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      clearTimeout(timeout);
    };
  }, [router]);

  return <>{children}</>;
}

