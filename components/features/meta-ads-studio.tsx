"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { BarChart3, CircleAlert, DollarSign, Megaphone, Pause, Play, Plus, Target, Trash2, X } from "lucide-react";

type CampaignStatus = "Borrador" | "Activa" | "Pausada";
type CampaignObjective = "Reconocimiento" | "Tráfico" | "Clientes potenciales" | "Ventas";

interface Campaign {
  id: string;
  name: string;
  objective: CampaignObjective;
  budget: number;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
}

const storageKey = "monova-meta-campaigns-v1";

export function MetaAdsStudio() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [connectionOpen, setConnectionOpen] = useState(false);
  const [metaReady, setMetaReady] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setCampaigns(JSON.parse(stored) as Campaign[]);
      } catch {
        // Empty state remains available without browser storage.
      }
    });
    const controller = new AbortController();
    fetch("/api/social/status", { signal: controller.signal })
      .then((response) => response.json())
      .then((payload: { ready?: boolean }) => setMetaReady(Boolean(payload.ready)))
      .catch(() => undefined);
    return () => { active = false; controller.abort(); };
  }, []);

  const totalBudget = useMemo(
    () => campaigns.reduce((total, campaign) => total + campaign.budget, 0),
    [campaigns],
  );

  function persist(next: Campaign[]) {
    setCampaigns(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Local persistence is optional. */ }
  }

  function createCampaign(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name: String(data.get("name") ?? "").trim(),
      objective: String(data.get("objective") ?? "Tráfico") as CampaignObjective,
      budget: Math.max(0, Number(data.get("budget") ?? 0)),
      status: "Borrador",
      startDate: String(data.get("startDate") ?? "2026-07-27"),
      endDate: String(data.get("endDate") ?? "2026-08-03"),
    };
    if (!campaign.name || !campaign.budget) return;
    persist([campaign, ...campaigns]);
    setDialogOpen(false);
  }

  function toggleCampaign(id: string) {
    persist(campaigns.map((campaign) => campaign.id === id ? {
      ...campaign,
      status: campaign.status === "Activa" ? "Pausada" : "Activa",
    } : campaign));
  }

  function removeCampaign(id: string) {
    persist(campaigns.filter((campaign) => campaign.id !== id));
  }

  return <section className="meta-studio-live">
    <header className="meta-live-head">
      <div><span className="video-eyebrow"><Megaphone size={13}/> PUBLICIDAD</span><h1>Meta Ads</h1><p>Prepara campañas para Facebook e Instagram desde un solo lugar.</p></div>
      <div><button type="button" className="social-connect" onClick={() => setConnectionOpen(true)}><i className={metaReady ? "ready" : ""}/>{metaReady ? "Configurar Meta" : "Conectar Meta"}</button><button type="button" className="create-button" onClick={() => setDialogOpen(true)}><Plus size={16}/> Nueva campaña</button></div>
    </header>

    <section className="meta-summary">
      <article><span><Megaphone size={17}/></span><div><strong>{campaigns.length}</strong><small>Campañas</small></div></article>
      <article><span><Play size={17}/></span><div><strong>{campaigns.filter((campaign) => campaign.status === "Activa").length}</strong><small>Activas</small></div></article>
      <article><span><DollarSign size={17}/></span><div><strong>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(totalBudget)}</strong><small>Presupuesto total</small></div></article>
      <article><span><Target size={17}/></span><div><strong>{campaigns.filter((campaign) => campaign.objective === "Ventas").length}</strong><small>Objetivo ventas</small></div></article>
    </section>

    {campaigns.length ? <div className="meta-campaign-table">
      <header><span>Campaña</span><span>Objetivo</span><span>Periodo</span><span>Presupuesto</span><span>Estado</span><span>Acciones</span></header>
      {campaigns.map((campaign) => <article key={campaign.id}>
        <div><strong>{campaign.name}</strong><small>ID local · {campaign.id.slice(0, 8)}</small></div>
        <span>{campaign.objective}</span>
        <time>{campaign.startDate.slice(5)} → {campaign.endDate.slice(5)}</time>
        <b>{new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(campaign.budget)}</b>
        <em className={`status-${campaign.status.toLowerCase()}`}>{campaign.status}</em>
        <div className="meta-row-actions"><button type="button" onClick={() => toggleCampaign(campaign.id)} title={campaign.status === "Activa" ? "Pausar" : "Activar"}>{campaign.status === "Activa" ? <Pause size={14}/> : <Play size={14}/>}</button><button type="button" onClick={() => removeCampaign(campaign.id)} title="Eliminar"><Trash2 size={14}/></button></div>
      </article>)}
    </div> : <div className="meta-empty-state"><span><BarChart3 size={30}/></span><h2>Crea tu primera campaña</h2><p>Define el objetivo, presupuesto y fechas. Podrás sincronizarla cuando Meta esté conectado.</p><div><button type="button" className="create-button" onClick={() => setDialogOpen(true)}><Plus size={15}/> Nueva campaña</button><Link href="/app/creative-studio">Crear anuncio en Creative Studio</Link></div></div>}

    {dialogOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}><section className="planner-dialog meta-campaign-dialog" role="dialog" aria-modal="true" aria-labelledby="meta-dialog-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="meta-dialog-title">Nueva campaña</h2><p>Se guardará como borrador hasta que confirmes su activación.</p></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><form onSubmit={createCampaign}>
      <label>Nombre de campaña<input name="name" required autoFocus placeholder="Ej. Ventas soportes de caucho"/></label>
      <div className="field-row"><label>Objetivo<select name="objective"><option>Reconocimiento</option><option>Tráfico</option><option>Clientes potenciales</option><option>Ventas</option></select></label><label>Presupuesto total (COP)<input name="budget" type="number" min="1000" step="1000" required placeholder="500000"/></label></div>
      <div className="field-row"><label>Fecha inicial<input name="startDate" type="date" defaultValue="2026-07-27"/></label><label>Fecha final<input name="endDate" type="date" defaultValue="2026-08-03"/></label></div>
      <div className="planner-dialog-actions"><button type="button" onClick={() => setDialogOpen(false)}>Cancelar</button><button type="submit">Crear borrador</button></div>
    </form></section></div>}

    {connectionOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setConnectionOpen(false)}><section className="planner-dialog" role="dialog" aria-modal="true" aria-labelledby="meta-connection-title" onMouseDown={(event) => event.stopPropagation()}><header><div><h2 id="meta-connection-title">Conexión de Meta Ads</h2><p>La activación real requiere autorización y permisos publicitarios.</p></div><button type="button" onClick={() => setConnectionOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><div className="social-connection-body"><CircleAlert size={23}/><strong>{metaReady ? "Credenciales base detectadas" : "Meta todavía no está configurado"}</strong><p>{metaReady ? "Falta completar OAuth, seleccionar la cuenta publicitaria y solicitar ads_management y ads_read." : "Configura las variables de Meta antes de intentar sincronizar campañas."}</p><button type="button" disabled>{metaReady ? "OAuth pendiente" : "Configuración requerida"}</button></div></section></div>}
  </section>;
}
