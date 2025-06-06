"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
import { useSessionStore } from "@/lib/sessionStore";
import { User } from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/", id: "dashboard" },
  { label: "MITRE ATT&CK", href: "/mitre", id: "mitre" },
  { label: "Security Compliance", href: "/compliance", id: "compliance" },
  { label: "IAM", href: "/iam", id: "iam" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const email = useSessionStore((state) => state.email);
  const setEmail = useSessionStore((state) => state.setEmail);

  useEffect(() => {
    if (!email) {
      fetch("/api/session")
        .then((res) => res.json())
        .then((data) => {
          if (data?.email) setEmail(data.email);
        });
    }
  }, [email, setEmail]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setEmail(null);
    router.push("/login");
  };

  return (
    <aside className="w-60 min-h-screen bg-[#f5e6ca] text-[#4b3621] flex flex-col items-center py-6 shadow-inner">
      <h1 className="text-xl font-bold mb-10 tracking-widest">ATT-LAS</h1>

      <div className="flex flex-col items-center mb-10">
        <p className="mt-2 text-sm font-medium flex items-center gap-1 italic">
          {email ? (
            <>
              <User size={16} className="text-[#4b3621]" />
              {email}
            </>
          ) : (
            "Login Required"
          )}
        </p>
      </div>

      <nav className="flex flex-col gap-3 w-full px-6 text-sm">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-md transition font-medium
              ${
                pathname === href
                  ? "bg-[#e0c090] text-black"
                  : "hover:bg-[#fdf6e3] hover:text-black"
              }
            `}
          >
            {label}
          </Link>
        ))}

        <div className="mt-4 flex items-center gap-1 text-[#7a6651] px-4 text-sm italic">
          🔒 <span className="underline">Vulnerable log analysis</span>
        </div>
      </nav>

      <div className="mt-8">
        {email ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-[#fff3e0] text-[#4b3621] rounded shadow hover:bg-[#f0e0c0]"
          >
            logout
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 text-sm bg-[#fff3e0] text-[#4b3621] rounded shadow hover:bg-[#f0e0c0]"
          >
            login
          </button>
        )}
      </div>

      <div className="mt-auto text-xs text-center text-[#7a6651] px-4 pt-10 italic leading-tight">
        ATT&CK-based<br />
        Multi-cloud Log Analytics<br />
        for Scenario Prediction Dashboard
      </div>
    </aside>
  );
}

