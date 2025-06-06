"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import ReCAPTCHA from "react-google-recaptcha";
import { useSessionStore } from "@/lib/sessionStore";

const SITE_KEY = "6Lch_VcrAAAAAAZIDpaR0JPfTR0MHtrfyLFWnZGN";

export default function LoginPage() {
  const router = useRouter();
  const recaptchaRef = useRef<ReCAPTCHA>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [error, setError] = useState("");

  const setSessionEmail = useSessionStore((state) => state.setEmail);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!captchaToken) {
      setError("로봇이 아님을 인증해주세요.");
      return;
    }

    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, captchaToken }),
    });

    if (res.ok) {
      const result = await res.json();
      setSessionEmail(result.email);
      router.replace("/");
    } else {
      const { error } = await res.json();
      setError(error || "로그인 실패");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-no-repeat bg-center bg-cover"
      style={{
        backgroundImage: "url('/images/world-map-old-paper.png')",
        backgroundSize: "100% 100%",
      }}
    >
      <div className="w-full h-full flex items-center justify-center px-4">
        <form
          onSubmit={handleLogin}
          className="bg-[#fdf6e3] text-[#4b3621] border border-[#d9c29c] shadow-md rounded-xl w-full max-w-sm p-8 space-y-6"
        >
          <div className="text-center space-y-1">
            <h2 className="text-sm text-[#856a43] font-medium italic">Welcome to</h2>
            <h1 className="text-3xl font-extrabold tracking-wide">ATT-LAS</h1>
            <p className="text-sm text-[#7a6651] mt-1">Log in to your account</p>
          </div>

          {error && (
            <div className="bg-red-100 text-red-700 text-sm rounded p-2 text-center">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">E-mail</label>
            <input
              type="email"
              className="w-full border border-[#cbb892] px-4 py-2 rounded-md bg-white text-[#4b3621] placeholder:text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#caa26b]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full border border-[#cbb892] px-4 py-2 rounded-md pr-10 bg-white text-[#4b3621] placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#caa26b]"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <ReCAPTCHA
              ref={recaptchaRef}
              sitekey={SITE_KEY}
              onChange={(token) => setCaptchaToken(token || "")}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#e0c090] hover:bg-[#d2ad74] text-[#3d2e1f] font-semibold py-2 rounded-md transition duration-200"
          >
            Login
          </button>

          <div className="border-t pt-4 text-center">
            <button
              type="button"
              className="text-sm text-[#856a43] hover:underline font-medium"
            >
              Sign up
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

