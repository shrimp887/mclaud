import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import TestChart from "./components/test";
import Scenario from "./components/scenario";

export default async function Page() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="p-6 space-y-10">
      <div className="bg-[#a58760] text-[#251b10] px-8 py-3 font-bold text-3xl shadow-md rounded-none w-full mb-4">
        MITRE ATT&CK 탐지 시나리오
      </div>
      <TestChart />
      <Scenario />
    </div>
  );
}

