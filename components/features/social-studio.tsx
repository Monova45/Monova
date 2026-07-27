"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleAlert, Filter, MessageCircle, Plus, Send, Share2, Trash2, X } from "lucide-react";

type SocialChannel = "Instagram" | "Facebook";
type SocialStatus = "Borrador" | "Programado" | "Publicado";

interface SocialPost {
  id: string;
  title: string;
  caption: string;
  channel: SocialChannel;
  status: SocialStatus;
  date: string;
}

const socialStorageKey = "monova-social-posts-v1";
const plannerStorageKey = "monova-planner-events-v1";

export function SocialStudio() {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filter, setFilter] = useState<"Todos" | SocialChannel>("Todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [metaReady, setMetaReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(socialStorageKey);
        if (stored) setPosts(JSON.parse(stored) as SocialPost[]);
      } catch {
        // The empty state remains available when browser storage is unavailable.
      }
    });
    const controller = new AbortController();
    fetch("/api/social/status", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { ready?: boolean }) => setMetaReady(Boolean(payload.ready)))
      .catch(() => undefined);
    return () => { active = false; controller.abort(); };
  }, []);

  const visiblePosts = useMemo(
    () => filter === "Todos" ? posts : posts.filter((post) => post.channel === filter),
    [filter, posts],
  );

  function persist(next: SocialPost[]) {
    setPosts(next);
    try { localStorage.setItem(socialStorageKey, JSON.stringify(next)); } catch { /* Local persistence is optional. */ }
  }

  function addToPlanner(post: SocialPost) {
    try {
      const current = JSON.parse(localStorage.getItem(plannerStorageKey) ?? "[]") as Array<Record<string, unknown>>;
      const withoutPost = current.filter((item) => item.socialPostId !== post.id);
      localStorage.setItem(plannerStorageKey, JSON.stringify([...withoutPost, {
        id: `social-${post.id}`,
        socialPostId: post.id,
        title: post.title,
        date: post.date,
        type: "Contenido",
        status: post.status === "Publicado" ? "Publicado" : "Programado",
        channel: post.channel,
      }]));
    } catch {
      // Planner sync is best-effort until server persistence is connected.
    }
  }

  function createPost(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const post: SocialPost = {
      id: crypto.randomUUID(),
      title: String(data.get("title") ?? "").trim(),
      caption: String(data.get("caption") ?? "").trim(),
      channel: String(data.get("channel") ?? "Instagram") as SocialChannel,
      status: String(data.get("status") ?? "Borrador") as SocialStatus,
      date: String(data.get("date") ?? "2026-07-27"),
    };
    if (!post.title) return;
    persist([post, ...posts]);
    if (post.status === "Programado") addToPlanner(post);
    setDialogOpen(false);
  }

  function removePost(id: string) {
    persist(posts.filter((post) => post.id !== id));
  }

  return <section className="social-studio-live">
    <header className="social-live-head">
      <div><span className="video-eyebrow"><Send size={13}/> CONTENIDO SOCIAL</span><h1>Redes sociales</h1><p>Crea, organiza y programa contenido para tus canales.</p></div>
      <div><button type="button" className="social-connect" onClick={() => setConnectionOpen(true)}><i className={metaReady ? "ready" : ""}/>{metaReady ? "Configurar Meta" : "Conectar canal"}</button><button type="button" className="create-button" onClick={() => setDialogOpen(true)}><Plus size={16}/> Nueva publicación</button></div>
    </header>

    <section className="social-live-summary">
      <article><strong>{posts.length}</strong><small>Publicaciones</small></article>
      <article><strong>{posts.filter((post) => post.status === "Programado").length}</strong><small>Programadas</small></article>
      <article><strong>{posts.filter((post) => post.status === "Borrador").length}</strong><small>Borradores</small></article>
      <article className={metaReady ? "connected" : ""}><strong>{metaReady ? "Lista" : "Pendiente"}</strong><small>Conexión Meta</small></article>
    </section>

    <div className="social-live-toolbar">
      <div><Filter size={14}/>{(["Todos", "Instagram", "Facebook"] as const).map((value) => <button type="button" className={filter === value ? "active" : ""} onClick={() => setFilter(value)} key={value}>{value}</button>)}</div>
      <Link href="/app/planner"><CalendarDays size={14}/> Abrir Planner</Link>
    </div>

    {visiblePosts.length ? <div className="social-post-grid">{visiblePosts.map((post) => <article key={post.id}>
      <div className={`social-post-visual channel-${post.channel.toLowerCase()}`}>{post.channel === "Instagram" ? <MessageCircle size={28}/> : <Share2 size={28}/>}<span>{post.title.slice(0, 1).toUpperCase()}</span></div>
      <header><span>{post.channel}</span><b className={`status-${post.status.toLowerCase()}`}>{post.status}</b></header>
      <h2>{post.title}</h2>
      <p>{post.caption || "Sin texto todavía."}</p>
      <footer><time>{new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(`${post.date}T12:00:00`))}</time><button type="button" onClick={() => removePost(post.id)} aria-label={`Eliminar ${post.title}`}><Trash2 size={14}/></button></footer>
    </article>)}</div> : <div className="social-empty-state"><div><MessageCircle size={26}/><Share2 size={26}/></div><h2>Crea tu primera publicación</h2><p>Prepara el texto, elige el canal y prográmala en Planner.</p><div><button type="button" className="create-button" onClick={() => setDialogOpen(true)}><Plus size={15}/> Nueva publicación</button><Link href="/app/creative-studio">Crear imagen en Creative Studio</Link></div></div>}

    {dialogOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}><section className="planner-dialog social-post-dialog" role="dialog" aria-modal="true" aria-labelledby="social-dialog-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="social-dialog-title">Nueva publicación</h2><p>Guarda un borrador o envíalo directamente al Planner.</p></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><form onSubmit={createPost}>
      <label>Título interno<input name="title" required autoFocus placeholder="Ej. Reel de soportes de caucho"/></label>
      <label>Texto de la publicación<textarea name="caption" placeholder="Escribe el copy, hashtags y llamado a la acción…"/></label>
      <div className="field-row"><label>Canal<select name="channel"><option>Instagram</option><option>Facebook</option></select></label><label>Fecha<input name="date" type="date" defaultValue="2026-07-27"/></label></div>
      <label>Estado<select name="status"><option>Borrador</option><option>Programado</option></select></label>
      <div className="planner-dialog-actions"><button type="button" onClick={() => setDialogOpen(false)}>Cancelar</button><button type="submit">Guardar publicación</button></div>
    </form></section></div>}

    {connectionOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setConnectionOpen(false)}><section className="planner-dialog social-connection-dialog" role="dialog" aria-modal="true" aria-labelledby="connection-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="connection-title">Conectar Meta</h2><p>Instagram y Facebook requieren autorización del propietario.</p></div><button type="button" onClick={() => setConnectionOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><div className="social-connection-body"><CircleAlert size={23}/><strong>{metaReady ? "La aplicación tiene credenciales base" : "Faltan credenciales de Meta"}</strong><p>{metaReady ? "El siguiente paso es completar el flujo OAuth y solicitar los permisos de páginas, Instagram y publicación." : "Configura META_APP_ID, META_APP_SECRET y META_REDIRECT_URI para habilitar la autorización real."}</p><button type="button" disabled>{metaReady ? "OAuth todavía pendiente" : "Configuración requerida"}</button></div></section></div>}
  </section>;
}
