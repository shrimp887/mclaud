"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";

const navItems = [
  { label: "Dashboard", href: "/", id: "dashboard" },
  { label: "MITRE ATT&CK", href: "/mitre", id: "mitre" },
  { label: "Security Compliance", href: "/compliance", id: "compliance" },
  { label: "IAM", href: "/iam", id: "iam" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-100 bg-gradient-to-b from-pink-300 to-blue-500 text-white flex flex-col items-center py-6 rounded-r-3xl shadow-lg">
      <h1 className="text-4xl font-bold mb-10">M-CLAUD</h1>

      <div className="flex flex-col items-center mb-10">
        <p className="mt-2 text-sm font-medium">Hong Gil Dong</p>
        <p className="text-xs text-white/80">/ Security Admin</p>
      </div>

      <nav className="flex flex-col gap-4 w-full px-6 text-xl">
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

      <div className="mt-auto text-xs text-center text-white/70 px-4 pt-10">
        MultiCloud Log
        <br />& MITRE ATT&CK Customized
        <br />
        Unified Dashboard
      </div>
    </aside>
  );
}
