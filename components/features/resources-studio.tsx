"use client";

import Image from "next/image";
import { FormEvent, useState } from "react";
import { Download, ImageIcon, Search, Sparkles } from "lucide-react";

type ResourceItem = {
  id: string;
  title: string;
  thumbnail: string;
  type: string;
  orientation: string;
  size: string;
  author: string;
  license: string;
  licenseUrl: string;
  availableFormats: string[];
};

type ResourceFilter = "all" | "photo" | "vector" | "psd" | "png" | "jpg";
const resourceFilters: Array<{ id: ResourceFilter; label: string }> = [
  { id: "all", label: "Todos" }, { id: "photo", label: "Fotos" }, { id: "vector", label: "Vectores" },
  { id: "png", label: "PNG" }, { id: "jpg", label: "JPG" }, { id: "psd", label: "PSD" },
];

export function ResourcesStudio() {
  const [query, setQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [items, setItems] = useState<ResourceItem[]>([]);
  const [page, setPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState("");
  const [error, setError] = useState("");
  const [filter, setFilter] = useState<ResourceFilter>("all");

  async function search(nextPage: number, append = false, nextFilter: ResourceFilter = filter) {
    const term = query.trim();
    if (term.length < 2) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/resources/search?q=${encodeURIComponent(term)}&page=${nextPage}&filter=${nextFilter}`);
      const payload = await response.json() as { items?: ResourceItem[]; page?: number; lastPage?: number; total?: number; error?: string };
      if (!response.ok) throw new Error(payload.error || "No se pudo buscar.");
      setSubmittedQuery(term);
      setItems((current) => append ? [...current, ...(payload.items || [])] : (payload.items || []));
      setPage(payload.page || nextPage);
      setLastPage(payload.lastPage || nextPage);
      setTotal(payload.total || 0);
    } catch (searchError) {
      setError(searchError instanceof Error ? searchError.message : "No se pudo buscar.");
    } finally {
      setLoading(false);
    }
  }

  function applyFilter(nextFilter: ResourceFilter) {
    setFilter(nextFilter);
    if (submittedQuery) void search(1, false, nextFilter);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void search(1);
  }

  async function download(item: ResourceItem) {
    setDownloading(item.id);
    setError("");
    try {
      const preferredFormat = filter === "png" || filter === "jpg" ? filter : "original";
      const response = await fetch(`/api/resources/${encodeURIComponent(item.id)}/download?format=${preferredFormat}`);
      const payload = await response.json() as { url?: string; filename?: string; error?: string };
      if (!response.ok || !payload.url) throw new Error(payload.error || "No se pudo preparar la descarga.");
      const anchor = document.createElement("a");
      anchor.href = payload.url;
      anchor.download = payload.filename || item.title;
      anchor.rel = "noopener";
      anchor.click();
    } catch (downloadError) {
      setError(downloadError instanceof Error ? downloadError.message : "No se pudo descargar.");
    } finally {
      setDownloading("");
    }
  }

  return <section className="resources-live">
    <header className="resources-heading"><span><Sparkles size={18}/></span><div><h1>Recursos</h1><p>Busca imágenes, vectores y plantillas dentro del catálogo de Magnific.</p></div><b>MAGNIFIC CONECTADO</b></header>
    <form className="resource-search" onSubmit={submit}><Search size={21}/><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="¿Qué recurso necesitas? Ej.: taller industrial, neumáticos, campaña de verano…"/><button disabled={loading || query.trim().length < 2}>{loading && !items.length ? "Buscando…" : "Buscar"}</button></form>
    <div className="resource-filters" aria-label="Filtrar recursos">{resourceFilters.map((item) => <button className={filter === item.id ? "active" : ""} onClick={() => applyFilter(item.id)} key={item.id}>{item.label}</button>)}</div>
    {error && <p className="tool-error resource-error">{error}</p>}
    {!submittedQuery && <div className="resource-empty"><ImageIcon size={42}/><h2>¿Qué necesitas encontrar?</h2><p>Escribe una idea arriba. Los resultados aparecerán únicamente después de buscar.</p><div>{["Fotografía industrial","Fondos para promociones","Personas trabajando","Productos en estudio"].map((suggestion) => <button key={suggestion} onClick={() => setQuery(suggestion)}>{suggestion}</button>)}</div></div>}
    {submittedQuery && <><div className="resource-results-head"><div><h2>Resultados para “{submittedQuery}”</h2><p>{total.toLocaleString("es-CO")} recursos encontrados</p></div><span>Página {page} de {lastPage}</span></div><div className="resource-grid">{items.map((item) => <article key={item.id}><div className="resource-thumb"><Image src={item.thumbnail} fill sizes="(max-width: 700px) 50vw, 260px" unoptimized alt={item.title}/><span>{item.type}</span></div><div className="resource-info"><h3>{item.title}</h3><p>{item.author} · {item.orientation || item.size}</p>{item.availableFormats.length > 0 && <div className="format-tags">{item.availableFormats.slice(0,4).map((format) => <span key={format}>{format}</span>)}</div>}<div>{item.licenseUrl ? <a href={item.licenseUrl} target="_blank" rel="noreferrer">{item.license || "Licencia"}</a> : <span>{item.license}</span>}<button onClick={() => void download(item)} disabled={downloading === item.id}><Download size={14}/>{downloading === item.id ? "Preparando…" : filter === "png" || filter === "jpg" ? `Descargar ${filter.toUpperCase()}` : "Descargar"}</button></div></div></article>)}</div>{page < lastPage && <button className="load-more" disabled={loading} onClick={() => void search(page + 1, true)}>{loading ? "Cargando…" : "Cargar más resultados"}</button>}</>}
  </section>;
}
