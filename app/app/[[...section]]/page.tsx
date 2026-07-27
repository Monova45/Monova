import { MarketingApp } from "@/components/marketing-app";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AppPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (section?.[0] === "image-studio") redirect("/app/creative-studio");
  return <MarketingApp section={section?.[0] ?? "dashboard"} user={user}/>;
}
