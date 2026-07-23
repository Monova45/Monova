import { NextResponse } from "next/server";

export const runtime = "nodejs";

type MagnificResource = {
  id?: number;
  title?: string;
  image?: { type?: string; orientation?: string; source?: { url?: string; size?: string } };
  author?: { name?: string };
  licenses?: Array<{ type?: string; url?: string }>;
  meta?: { available_formats?: Record<string, unknown> };
};

export async function GET(request: Request) {
  if (!process.env.MAGNIFIC_API_KEY) {
    return NextResponse.json({ error: "Magnific no está configurado." }, { status: 503 });
  }
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim().slice(0, 200) || "";
  const page = Math.max(1, Math.min(100, Number(searchParams.get("page")) || 1));
  const filter = ["all", "photo", "vector", "psd", "png", "jpg"].includes(searchParams.get("filter") || "")
    ? (searchParams.get("filter") || "all")
    : "all";
  if (query.length < 2) {
    return NextResponse.json({ error: "Escribe al menos dos caracteres." }, { status: 400 });
  }

  try {
    const url = new URL("https://api.magnific.com/v1/resources");
    url.searchParams.set("term", query);
    url.searchParams.set("page", String(page));
    url.searchParams.set("limit", filter === "png" || filter === "jpg" ? "60" : "24");
    url.searchParams.set("order", "relevance");
    if (["photo", "vector", "psd"].includes(filter)) {
      url.searchParams.set(`filters[content_type][${filter}]`, "1");
    }
    const response = await fetch(url, {
      headers: {
        "x-magnific-api-key": process.env.MAGNIFIC_API_KEY,
        "Accept-Language": "es-ES",
      },
      cache: "no-store",
    });
    const payload = await response.json().catch(() => ({})) as {
      data?: MagnificResource[];
      meta?: { current_page?: number; last_page?: number; total?: number };
      message?: string;
    };
    if (!response.ok) {
      return NextResponse.json({ error: payload.message || "Magnific no pudo completar la búsqueda." }, { status: response.status });
    }
    const normalized = (payload.data || []).map((item) => ({
        id: String(item.id || ""),
        title: item.title || "Recurso sin título",
        thumbnail: (item.image?.source?.url || "").replace(/^http:/, "https:"),
        type: item.image?.type || "resource",
        orientation: item.image?.orientation || "",
        size: item.image?.source?.size || "",
        author: item.author?.name || "Magnific",
        license: item.licenses?.[0]?.type || "",
        licenseUrl: item.licenses?.[0]?.url || "",
        availableFormats: Object.keys(item.meta?.available_formats || {}).map((format) => format.toLowerCase()),
      })).filter((item) => item.id && item.thumbnail);
    const items = filter === "png" || filter === "jpg"
      ? normalized.filter((item) => item.availableFormats.includes(filter))
      : normalized;
    return NextResponse.json({
      items,
      page: payload.meta?.current_page || page,
      lastPage: filter === "png" || filter === "jpg" ? page : (payload.meta?.last_page || page),
      total: filter === "png" || filter === "jpg" ? items.length : (payload.meta?.total || 0),
    });
  } catch {
    return NextResponse.json({ error: "No se pudo conectar con el catálogo de Magnific." }, { status: 502 });
  }
}
