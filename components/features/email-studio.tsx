"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, CircleAlert, Mail, Pause, Play, Plus, Send, Trash2, Users, X } from "lucide-react";

type EmailStatus = "Borrador" | "Programado" | "Pausado";
type EmailAudience = "Todos los contactos" | "Clientes" | "Leads" | "Prospectos";

interface EmailCampaign {
  id: string;
  name: string;
  subject: string;
  preview: string;
  content: string;
  audience: EmailAudience;
  date: string;
  status: EmailStatus;
}

const storageKey = "monova-email-campaigns-v1";
const plannerStorageKey = "monova-planner-events-v1";

export function EmailStudio() {
  const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [resendReady, setResendReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setCampaigns(JSON.parse(stored) as EmailCampaign[]);
      } catch {
        // Empty state remains available without browser storage.
      }
    });
    const controller = new AbortController();
    fetch("/api/email/status", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { ready?: boolean }) => setResendReady(Boolean(payload.ready)))
      .catch(() => undefined);
    return () => { active = false; controller.abort(); };
  }, []);

  const scheduled = useMemo(
    () => campaigns.filter((campaign) => campaign.status === "Programado").length,
    [campaigns],
  );

  function persist(next: EmailCampaign[]) {
    setCampaigns(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Local persistence is optional. */ }
  }

  function syncPlanner(campaign: EmailCampaign) {
    try {
      const current = JSON.parse(localStorage.getItem(plannerStorageKey) ?? "[]") as Array<Record<string, unknown>>;
      localStorage.setItem(plannerStorageKey, JSON.stringify([...current.filter((item) => item.emailCampaignId !== campaign.id), {
        id: `email-${campaign.id}`,
        emailCampaignId: campaign.id,
        title: campaign.name,
        date: campaign.date,
        type: "Contenido",
        status: "Programado",
        channel: "Email",
      }]));
    } catch {
      // Planner sync is best-effort until server persistence is connected.
    }
  }

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const campaign: EmailCampaign = {
      id: crypto.randomUUID(),
      name: String(data.get("name") ?? "").trim(),
      subject: String(data.get("subject") ?? "").trim(),
      preview: String(data.get("preview") ?? "").trim(),
      content: String(data.get("content") ?? "").trim(),
      audience: String(data.get("audience") ?? "Todos los contactos") as EmailAudience,
      date: String(data.get("date") ?? "2026-07-27"),
      status: String(data.get("status") ?? "Borrador") as EmailStatus,
    };
    if (!campaign.name || !campaign.subject || !campaign.content) return;
    persist([campaign, ...campaigns]);
    if (campaign.status === "Programado") syncPlanner(campaign);
    setDialogOpen(false);
  }

  function toggleCampaign(id: string) {
    persist(campaigns.map((campaign) => campaign.id === id ? {
      ...campaign,
      status: campaign.status === "Programado" ? "Pausado" : "Programado",
    } : campaign));
  }

  function removeCampaign(id: string) {
    persist(campaigns.filter((campaign) => campaign.id !== id));
  }

  return <section className="email-studio-live">
    <header className="email-live-head">
      <div><span className="video-eyebrow"><Mail size={13}/> EMAIL MARKETING</span><h1>Campañas de email</h1><p>Crea boletines, promociones y seguimientos para tus contactos.</p></div>
      <div><button type="button" className="social-connect" onClick={() => setConnectionOpen(true)}><i className={resendReady ? "ready" : ""}/>{resendReady ? "Configurar Resend" : "Conectar proveedor"}</button><button type="button" className="create-button" onClick={() => setDialogOpen(true)}><Plus size={16}/> Nueva campaña</button></div>
    </header>

    <section className="email-summary">
      <article><Mail size={17}/><div><strong>{campaigns.length}</strong><small>Campañas</small></div></article>
      <article><CalendarDays size={17}/><div><strong>{scheduled}</strong><small>Programadas</small></div></article>
      <article><Users size={17}/><div><strong>0</strong><small>Contactos conectados</small></div></article>
      <article className={resendReady ? "ready" : ""}><Send size={17}/><div><strong>{resendReady ? "Listo" : "Pendiente"}</strong><small>Proveedor</small></div></article>
    </section>

    {campaigns.length ? <div className="email-campaign-list">{campaigns.map((campaign) => <article key={campaign.id}>
      <div className="email-campaign-icon"><Mail size={19}/></div>
      <div className="email-campaign-copy"><span>{campaign.audience}</span><h2>{campaign.name}</h2><strong>{campaign.subject}</strong><p>{campaign.preview || campaign.content}</p></div>
      <div className="email-campaign-meta"><time>{new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(`${campaign.date}T12:00:00`))}</time><b className={`status-${campaign.status.toLowerCase()}`}>{campaign.status}</b></div>
      <div className="email-row-actions"><button type="button" onClick={() => toggleCampaign(campaign.id)} title={campaign.status === "Programado" ? "Pausar" : "Programar"}>{campaign.status === "Programado" ? <Pause size={14}/> : <Play size={14}/>}</button><button type="button" onClick={() => removeCampaign(campaign.id)} title="Eliminar"><Trash2 size={14}/></button></div>
    </article>)}</div> : <div className="email-empty-state"><span><Mail size={30}/></span><h2>Crea tu primera campaña</h2><p>Prepara el asunto y contenido. Puedes guardarla como borrador o enviarla al Planner.</p><button type="button" className="create-button" onClick={() => setDialogOpen(true)}><Plus size={15}/> Nueva campaña</button></div>}

    {dialogOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}><section className="planner-dialog email-campaign-dialog" role="dialog" aria-modal="true" aria-labelledby="email-dialog-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="email-dialog-title">Nueva campaña de email</h2><p>Define el mensaje y cuándo debe enviarse.</p></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><form onSubmit={createCampaign}>
      <label>Nombre interno<input name="name" required autoFocus placeholder="Ej. Lanzamiento de nuevos soportes"/></label>
      <label>Asunto<input name="subject" required placeholder="Una novedad diseñada para mover tu negocio"/></label>
      <label>Texto de previsualización<input name="preview" placeholder="Aparece junto al asunto en la bandeja de entrada"/></label>
      <label>Contenido<textarea name="content" required placeholder="Escribe el contenido principal, beneficios y llamado a la acción…"/></label>
      <div className="field-row"><label>Audiencia<select name="audience"><option>Todos los contactos</option><option>Clientes</option><option>Leads</option><option>Prospectos</option></select></label><label>Fecha<input name="date" type="date" defaultValue="2026-07-27"/></label></div>
      <label>Estado<select name="status"><option>Borrador</option><option>Programado</option></select></label>
      <div className="planner-dialog-actions"><button type="button" onClick={() => setDialogOpen(false)}>Cancelar</button><button type="submit">Guardar campaña</button></div>
    </form></section></div>}

    {connectionOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setConnectionOpen(false)}><section className="planner-dialog" role="dialog" aria-modal="true" aria-labelledby="email-connection-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="email-connection-title">Conexión de email</h2><p>Los envíos reales se realizarán mediante Resend.</p></div><button type="button" onClick={() => setConnectionOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><div className="social-connection-body"><CircleAlert size={23}/><strong>{resendReady ? "Resend está configurado" : "Falta RESEND_API_KEY"}</strong><p>{resendReady ? "Antes de enviar campañas falta verificar el dominio, importar contactos y registrar consentimiento y bajas." : "Añade la credencial del proveedor y verifica un dominio de envío."}</p><button type="button" disabled>{resendReady ? "Dominio y contactos pendientes" : "Configuración requerida"}</button></div></section></div>}
  </section>;
}
