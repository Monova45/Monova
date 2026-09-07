import { MarketingApp } from "@/components/marketing-app";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";

export default async function AppPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  const user = await getCurrentUser().catch(() => null);
  const demoUser = {
    id: "public-demo", email: "", fullName: "Visitante",
    workspaceId: "public-demo", workspaceName: "Monova Demo",
  };
  if (section?.[0] === "image-studio") redirect("/app/creative-studio");
  return <>
    {!user && <div role="status" style={{ padding: "12px 20px", background: "#fff1e8", color: "#7c3500", fontSize: 14 }}>
      Demo pública · Explora Monova Marketing. Los datos son de ejemplo; las integraciones y acciones con datos reales requieren una cuenta.
    </div>}
    <MarketingApp section={section?.[0] ?? "dashboard"} user={user ?? demoUser}/>
  </>;
}
