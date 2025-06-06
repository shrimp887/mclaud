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
    <aside className="w-60 bg-gradient-to-b from-pink-300 to-blue-500 text-white flex flex-col items-center py-6 rounded-r-3xl shadow-lg">
      <h1 className="text-2xl font-bold mb-10">ATT-LAS</h1>

      <div className="flex flex-col items-center mb-10">
        <p className="mt-2 text-sm font-medium flex items-center gap-1">
	  {email ? (
	    <>
	      <User size={16} className="text-white" />
	      {email}
	    </>
	  ) : (
	    "Login Required"
	  )}
	</p>
      </div>

      <nav className="flex flex-col gap-4 w-full px-6 text-s">
        {navItems.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 rounded-lg transition font-medium
              ${
                pathname === href
                  ? "bg-white text-blue-700 shadow"
                  : "hover:bg-white/10 hover:text-white/90"
              }
            `}
          >
            {label}
          </Link>
        ))}

        <div className="mt-4 flex items-center gap-1 text-white/60 px-4">
          🔒 <span className="underline">Vulnerable log analysis</span>
        </div>
      </nav>

      <div className="mt-8">
        {email ? (
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm bg-white text-pink-600 rounded shadow hover:bg-pink-100"
          >
            logout
          </button>
        ) : (
          <button
            onClick={() => router.push("/login")}
            className="px-4 py-2 text-sm bg-white text-blue-600 rounded shadow hover:bg-blue-100"
          >
            login
          </button>
        )}
      </div>

      <div className="mt-auto text-xs text-center text-white/70 px-4 pt-10">
        ATT&CK-based
        <br />Multi-cloud Log Analytics for
        <br />Scenario Prediction Dashboard
      </div>
    </aside>
  );
}

