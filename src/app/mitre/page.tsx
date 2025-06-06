import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TestChart from "./components/test";
import Scenario from "./components/scenario";

export default async function Page() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect("/login"); // 로그인 안 되어 있으면 로그인 페이지로 이동
  }

  return (
    <div className="p-6 space-y-10">
      <h2 className="text-2xl font-bold mb-4">MITRE ATT&CK 탐지 시나리오</h2>
      <TestChart />
      <Scenario />
    </div>
  );
}

