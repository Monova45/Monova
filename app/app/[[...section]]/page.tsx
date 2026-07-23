import { MarketingApp } from "@/components/marketing-app";

export default async function AppPage({ params }: { params: Promise<{ section?: string[] }> }) {
  const { section } = await params;
  return <MarketingApp section={section?.[0] ?? "dashboard"} />;
}
