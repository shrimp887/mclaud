import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import ClientDashboard from "./components/ecommerce/ClientDashboard";

export default async function Page() {
  const session = await getSession();
  if (!session?.isLoggedIn) redirect("/login");

  return (
    <div className="max-w-screen-2xl mx-auto px-0">
      <ClientDashboard />
    </div>
  );
}

