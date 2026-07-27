"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { CalendarDays, CheckCircle2, Clock3, List, Megaphone, Plus, Trash2, X } from "lucide-react";

type PlannerView = "calendar" | "list";
type EventType = "Contenido" | "Campaña" | "Entrega" | "Reunión";
type EventStatus = "Borrador" | "Pendiente" | "Programado" | "Publicado";

interface PlannerEvent {
  id: string;
  title: string;
  date: string;
  type: EventType;
  status: EventStatus;
  channel: string;
}

const storageKey = "monova-planner-events-v1";
const monthPrefix = "2026-07-";
const initialEvents: PlannerEvent[] = [
  { id: "demo-1", title: "Post Instagram", date: "2026-07-04", type: "Contenido", status: "Programado", channel: "Instagram" },
  { id: "demo-2", title: "Campaña UGC", date: "2026-07-07", type: "Campaña", status: "Pendiente", channel: "Meta Ads" },
  { id: "demo-3", title: "Reel de producto", date: "2026-07-16", type: "Contenido", status: "Borrador", channel: "Instagram" },
  { id: "demo-4", title: "Lanzamiento soportes", date: "2026-07-23", type: "Campaña", status: "Programado", channel: "Multicanal" },
];
const weekdays = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const calendarDays = Array.from({ length: 35 }, (_, index) => index < 2 ? null : index - 1);

export function PlannerStudio() {
  const [events, setEvents] = useState<PlannerEvent[]>(initialEvents);
  const [view, setView] = useState<PlannerView>("calendar");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("2026-07-27");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setEvents(JSON.parse(stored) as PlannerEvent[]);
      } catch {
        // Demo data remains available if browser storage is unavailable.
      }
    });
    return () => { active = false; };
  }, []);

  const orderedEvents = useMemo(
    () => [...events].sort((left, right) => left.date.localeCompare(right.date)),
    [events],
  );

  function persist(next: PlannerEvent[]) {
    setEvents(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Local persistence is optional. */ }
  }

  function openCreate(date = "2026-07-27") {
    setSelectedDate(date);
    setDialogOpen(true);
  }

  function createEvent(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const nextEvent: PlannerEvent = {
      id: crypto.randomUUID(),
      title: String(data.get("title") ?? "").trim(),
      date: String(data.get("date") ?? selectedDate),
      type: String(data.get("type") ?? "Contenido") as EventType,
      status: String(data.get("status") ?? "Borrador") as EventStatus,
      channel: String(data.get("channel") ?? "").trim() || "Sin canal",
    };
    if (!nextEvent.title) return;
    persist([...events, nextEvent]);
    setDialogOpen(false);
  }

  function moveEvent(id: string, date: string) {
    persist(events.map((item) => item.id === id ? { ...item, date } : item));
  }

  function removeEvent(id: string) {
    persist(events.filter((item) => item.id !== id));
  }

  return <section className="planner-studio">
    <header className="planner-head">
      <div><span className="video-eyebrow"><CalendarDays size={13}/> PLANIFICACIÓN</span><h1>Julio 2026</h1><p>Organiza contenido, campañas y entregas del equipo.</p></div>
      <div className="planner-actions"><div className="planner-view-switch"><button type="button" className={view === "calendar" ? "active" : ""} onClick={() => setView("calendar")}><CalendarDays size={14}/> Calendario</button><button type="button" className={view === "list" ? "active" : ""} onClick={() => setView("list")}><List size={14}/> Lista</button></div><button type="button" className="create-button" onClick={() => openCreate()}><Plus size={16}/> Nuevo evento</button></div>
    </header>

    <div className="planner-summary">
      <article><CalendarDays size={16}/><span><strong>{events.length}</strong><small>Eventos</small></span></article>
      <article><Clock3 size={16}/><span><strong>{events.filter((item) => item.status === "Pendiente").length}</strong><small>Pendientes</small></span></article>
      <article><CheckCircle2 size={16}/><span><strong>{events.filter((item) => item.status === "Programado").length}</strong><small>Programados</small></span></article>
      <article><Megaphone size={16}/><span><strong>{events.filter((item) => item.type === "Campaña").length}</strong><small>Campañas</small></span></article>
    </div>

    {view === "calendar" ? <div className="planner-calendar">
      {weekdays.map((day) => <b key={day}>{day}</b>)}
      {calendarDays.map((day, index) => {
        if (!day) return <div className="outside" key={`outside-${index}`}/>;
        const date = `${monthPrefix}${String(day).padStart(2, "0")}`;
        const dayEvents = events.filter((item) => item.date === date);
        return <div className={date === "2026-07-27" ? "today" : ""} onDragOver={(event) => event.preventDefault()} onDrop={(event) => moveEvent(event.dataTransfer.getData("text/plain"), date)} key={date}>
          <button type="button" className="planner-day-number" onClick={() => openCreate(date)} aria-label={`Crear evento el ${day} de julio`}>{day}</button>
          <div className="planner-day-events">{dayEvents.map((item) => <button type="button" draggable onDragStart={(event) => event.dataTransfer.setData("text/plain", item.id)} className={`planner-event status-${item.status.toLowerCase()}`} title={`${item.type} · ${item.status} · Arrastra para cambiar de fecha`} key={item.id}><span>{item.title}</span><small>{item.channel}</small></button>)}</div>
        </div>;
      })}
    </div> : <div className="planner-list">
      <header><span>Fecha</span><span>Actividad</span><span>Tipo</span><span>Canal</span><span>Estado</span><span/></header>
      {orderedEvents.map((item) => <article key={item.id}><time>{new Intl.DateTimeFormat("es-CO", { day: "2-digit", month: "short" }).format(new Date(`${item.date}T12:00:00`))}</time><strong>{item.title}</strong><span>{item.type}</span><span>{item.channel}</span><b className={`status-${item.status.toLowerCase()}`}>{item.status}</b><button type="button" onClick={() => removeEvent(item.id)} aria-label={`Eliminar ${item.title}`}><Trash2 size={14}/></button></article>)}
      {!events.length && <div className="planner-empty">No hay eventos todavía.</div>}
    </div>}

    {dialogOpen && <div className="planner-dialog-backdrop" role="presentation" onMouseDown={() => setDialogOpen(false)}><section className="planner-dialog" role="dialog" aria-modal="true" aria-labelledby="planner-dialog-title" onMouseDown={(event) => event.stopPropagation()}>
      <header><div><h2 id="planner-dialog-title">Nuevo evento</h2><p>Añade una actividad al calendario de marketing.</p></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={17}/></button></header>
      <form onSubmit={createEvent}>
        <label>Título<input name="title" required autoFocus placeholder="Ej. Publicar reel de producto"/></label>
        <div className="field-row"><label>Fecha<input name="date" type="date" defaultValue={selectedDate} min="2026-07-01" max="2026-07-31"/></label><label>Canal<input name="channel" placeholder="Instagram, Email…"/></label></div>
        <div className="field-row"><label>Tipo<select name="type" defaultValue="Contenido"><option>Contenido</option><option>Campaña</option><option>Entrega</option><option>Reunión</option></select></label><label>Estado<select name="status" defaultValue="Borrador"><option>Borrador</option><option>Pendiente</option><option>Programado</option><option>Publicado</option></select></label></div>
        <div className="planner-dialog-actions"><button type="button" onClick={() => setDialogOpen(false)}>Cancelar</button><button type="submit">Crear evento</button></div>
      </form>
    </section></div>}
  </section>;
}
