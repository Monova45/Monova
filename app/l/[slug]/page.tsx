import { PublicLandingPage } from "@/components/features/public-landing-page";

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <PublicLandingPage slug={slug}/>;
}
