"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LandingPreview } from "@/components/features/landing-pages-studio";

type StoredLanding = Parameters<typeof LandingPreview>[0]["content"];

export function PublicLandingPage({ slug }: { slug: string }) {
  const [content, setContent] = useState<StoredLanding | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    async function loadLanding() {
      let localContent: StoredLanding | null = null;
      let localSavedAt = 0;
      try {
        const raw = window.localStorage.getItem(`monova-landing:${slug}`);
        if (raw) {
          const parsed = JSON.parse(raw) as { content?: StoredLanding; savedAt?: number };
          localContent = parsed.content || null;
          localSavedAt = parsed.savedAt || 0;
        }
      } catch {}

      try {
        const response = await fetch(`/api/landing-pages?slug=${encodeURIComponent(slug)}`);
        if (response.ok) {
          const payload = await response.json() as { content: StoredLanding; updatedAt?: string };
          const serverSavedAt = payload.updatedAt ? new Date(payload.updatedAt).getTime() : 0;
          if (!cancelled) setContent(localContent && localSavedAt > serverSavedAt ? localContent : payload.content);
          return;
        }
      } catch {}
      if (!cancelled) setContent(localContent);
    }
    void loadLanding();
    return () => { cancelled = true; };
  }, [slug]);

  if (content === undefined) return <main className="public-landing-loading">Cargando página…</main>;
  if (!content) return <main className="public-landing-missing"><h1>Esta página aún no está publicada</h1><p>Vuelve al editor de Monova y pulsa Publicar.</p><Link href="/app/landing-pages">Abrir editor</Link></main>;
  return <main className="public-landing"><LandingPreview content={content}/></main>;
}
