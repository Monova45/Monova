"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, Check, Eye, FilePenLine, FileText, Plus, SearchCheck, Sparkles, Trash2, X } from "lucide-react";

type Status = "Borrador" | "Programado" | "Publicado";
interface Article {
  id: string; title: string; slug: string; keyword: string; category: string;
  metaDescription: string; excerpt: string; content: string; date: string; status: Status;
}
type ArticleForm = Omit<Article, "id">;

const storageKey = "monova-blog-articles-v1";
const plannerKey = "monova-planner-events-v1";
const blank = (): ArticleForm => ({
  title: "", slug: "", keyword: "", category: "Consejos", metaDescription: "",
  excerpt: "", content: "", date: new Date().toISOString().slice(0, 10), status: "Borrador",
});
const slugify = (value: string) => value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const words = (value: string) => value.trim() ? value.trim().split(/\s+/).length : 0;
function checks(article: ArticleForm) {
  const keyword = article.keyword.trim().toLowerCase();
  return [
    ["Título entre 30 y 60 caracteres", article.title.length >= 30 && article.title.length <= 60],
    ["Palabra clave incluida en el título", Boolean(keyword) && article.title.toLowerCase().includes(keyword)],
    ["Descripción entre 120 y 160 caracteres", article.metaDescription.length >= 120 && article.metaDescription.length <= 160],
    ["Palabra clave incluida en el contenido", Boolean(keyword) && article.content.toLowerCase().includes(keyword)],
    ["Contenido de al menos 300 palabras", words(article.content) >= 300],
  ] as const;
}

export function BlogStudio() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [editorOpen, setEditorOpen] = useState(false);
  const [preview, setPreview] = useState<Article | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ArticleForm>(blank);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setArticles(JSON.parse(stored) as Article[]);
      } catch { /* The empty state remains available. */ }
    });
    return () => { active = false; };
  }, []);

  const summary = useMemo(() => ({
    total: articles.length,
    drafts: articles.filter((item) => item.status === "Borrador").length,
    scheduled: articles.filter((item) => item.status === "Programado").length,
    published: articles.filter((item) => item.status === "Publicado").length,
  }), [articles]);
  const seoChecks = useMemo(() => checks(form), [form]);
  const score = Math.round(seoChecks.filter((item) => item[1]).length / seoChecks.length * 100);

  function persist(next: Article[]) {
    setArticles(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Optional. */ }
  }
  function openNew() { setEditingId(null); setForm(blank()); setMessage(""); setEditorOpen(true); }
  function openEdit(article: Article) {
    const { id, ...values } = article;
    setEditingId(id); setForm(values); setMessage(""); setEditorOpen(true);
  }
  function syncPlanner(article: Article) {
    if (article.status !== "Programado") return;
    try {
      const current = JSON.parse(localStorage.getItem(plannerKey) ?? "[]") as Array<Record<string, unknown>>;
      const next = current.filter((item) => item.sourceId !== article.id);
      next.push({ id: `blog-${article.id}`, sourceId: article.id, title: article.title, date: article.date, type: "Contenido", channel: "Blog", status: "Programado" });
      localStorage.setItem(plannerKey, JSON.stringify(next));
    } catch { /* Planner sync is best-effort. */ }
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const article = { ...form, id: editingId ?? crypto.randomUUID(), slug: form.slug || slugify(form.title) };
    persist(editingId ? articles.map((item) => item.id === editingId ? article : item) : [article, ...articles]);
    syncPlanner(article); setEditorOpen(false);
  }
  async function generate() {
    if (!form.keyword.trim()) { setMessage("Escribe primero la palabra clave principal."); return; }
    setGenerating(true); setMessage("");
    try {
      const response = await fetch("/api/ai/blog", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ keyword: form.keyword, topic: form.title || form.keyword }) });
      const payload = await response.json() as { content?: Partial<ArticleForm>; error?: string };
      if (!response.ok || !payload.content) throw new Error(payload.error || "No se pudo generar el artículo.");
      setForm((current) => ({ ...current, ...payload.content, slug: slugify(payload.content?.title || current.title) }));
    } catch (error) { setMessage(error instanceof Error ? error.message : "No se pudo generar el artículo."); }
    finally { setGenerating(false); }
  }

  return <section className="blog-studio-live">
    <header className="blog-live-head"><div><span><Sparkles size={13}/> CONTENIDO QUE POSICIONA</span><h1>Blog y SEO</h1><p>Crea, optimiza y programa artículos desde un solo lugar.</p></div><button className="create-button" onClick={openNew}><Plus size={16}/> Nuevo artículo</button></header>
    <div className="blog-summary">
      <article><FileText size={18}/><div><strong>{summary.total}</strong><small>Artículos</small></div></article>
      <article><FilePenLine size={18}/><div><strong>{summary.drafts}</strong><small>Borradores</small></div></article>
      <article><CalendarDays size={18}/><div><strong>{summary.scheduled}</strong><small>Programados</small></div></article>
      <article><SearchCheck size={18}/><div><strong>{summary.published}</strong><small>Publicados</small></div></article>
    </div>
    {articles.length === 0 ? <div className="blog-empty-state"><span><FilePenLine size={28}/></span><h2>Tu blog empieza con una buena idea</h2><p>Crea el primer artículo, revisa su puntuación SEO y guárdalo como borrador o prográmalo.</p><button className="create-button" onClick={openNew}><Plus size={15}/> Crear primer artículo</button></div> :
      <div className="blog-article-list">{articles.map((article) => {
        const articleScore = Math.round(checks(article).filter((item) => item[1]).length / 5 * 100);
        return <article key={article.id}><div className="blog-score-ring" style={{ "--score": `${articleScore * 3.6}deg` } as React.CSSProperties}><span>{articleScore}</span></div><div className="blog-article-copy"><span>{article.category} · /{article.slug}</span><h2>{article.title}</h2><p>{article.excerpt || article.metaDescription}</p></div><div className="blog-article-meta"><time>{article.date}</time><b className={`status-${article.status.toLowerCase()}`}>{article.status}</b></div><div className="blog-row-actions"><button onClick={() => setPreview(article)} title="Vista previa" aria-label="Vista previa"><Eye size={14}/></button><button onClick={() => openEdit(article)} title="Editar" aria-label="Editar"><FilePenLine size={14}/></button><button onClick={() => persist(articles.filter((item) => item.id !== article.id))} title="Eliminar" aria-label="Eliminar"><Trash2 size={14}/></button></div></article>;
      })}</div>}
    {editorOpen && <div className="blog-modal-backdrop"><form className="blog-editor-dialog" onSubmit={save}>
      <header><div><span><FilePenLine size={18}/></span><div><h2>{editingId ? "Editar artículo" : "Nuevo artículo"}</h2><p>Completa el contenido y mejora su puntuación SEO.</p></div></div><button type="button" onClick={() => setEditorOpen(false)} aria-label="Cerrar"><X size={18}/></button></header>
      <div className="blog-editor-grid"><div className="blog-editor-fields">
        <label>Palabra clave principal<input required value={form.keyword} onChange={(e) => setForm({ ...form, keyword: e.target.value })} placeholder="Ej. soportes de caucho"/></label>
        <div className="blog-inline-fields"><label>Categoría<select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option>Consejos</option><option>Industria</option><option>Productos</option><option>Casos de éxito</option></select></label><label>Fecha<input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}/></label><label>Estado<select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as Status })}><option>Borrador</option><option>Programado</option><option>Publicado</option></select></label></div>
        <button className="blog-ai-button" type="button" onClick={generate} disabled={generating}><Sparkles size={15}/>{generating ? "Generando artículo…" : "Generar borrador con IA"}</button>{message && <p className="blog-form-message">{message}</p>}
        <label>Título <small>{form.title.length}/60</small><input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value, slug: slugify(e.target.value) })} placeholder="Título claro y atractivo"/></label>
        <label>URL<input required value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} placeholder="url-del-articulo"/></label>
        <label>Descripción SEO <small>{form.metaDescription.length}/160</small><textarea required value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} placeholder="Resumen que aparecerá en Google."/></label>
        <label>Extracto<textarea required value={form.excerpt} onChange={(e) => setForm({ ...form, excerpt: e.target.value })} placeholder="Introducción corta para la tarjeta."/></label>
        <label>Contenido <small>{words(form.content)} palabras</small><textarea className="blog-content-input" required value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="Escribe aquí el artículo completo…"/></label>
      </div><aside className="blog-seo-panel"><div className={score >= 80 ? "blog-score-large good" : "blog-score-large"}><strong>{score}</strong><span>/100</span></div><h3>Análisis SEO</h3><p>{score >= 80 ? "El artículo está listo para posicionar." : "Completa estas recomendaciones antes de publicar."}</p><div>{seoChecks.map(([label, pass]) => <span className={pass ? "pass" : ""} key={label}>{pass ? <Check size={13}/> : <X size={13}/>} {label}</span>)}</div></aside></div>
      <footer><button type="button" onClick={() => setEditorOpen(false)}>Cancelar</button><button className="create-button" type="submit">Guardar artículo</button></footer>
    </form></div>}
    {preview && <div className="blog-modal-backdrop"><article className="blog-preview-dialog"><button onClick={() => setPreview(null)} aria-label="Cerrar"><X size={18}/></button><span>{preview.category}</span><h1>{preview.title}</h1><p className="blog-preview-excerpt">{preview.excerpt}</p><div className="blog-preview-body">{preview.content.split("\n").map((text, index) => text && <p key={`${preview.id}-${index}`}>{text}</p>)}</div></article></div>}
  </section>;
}
