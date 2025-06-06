import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function IAMPage() {
  const session = await getSession();

  if (!session?.isLoggedIn) {
    redirect("/login");
  }

  return (
    <div className="bg-white rounded-3xl shadow p-6 h-full">
      <h2 className="text-3xl font-bold">IAM</h2>
    </div>
  );
}

