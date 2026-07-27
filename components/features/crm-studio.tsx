"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { BriefcaseBusiness, Building2, Mail, MessageCircle, Phone, Plus, Search, Trash2, UserRound, X } from "lucide-react";

type Stage = "Nuevo" | "Contactado" | "Cotización" | "Negociación" | "Ganado";
interface Contact {
  id: string; name: string; company: string; email: string; phone: string;
  stage: Stage; value: number; owner: string; source: string; notes: string;
}

const storageKey = "monova-crm-contacts-v1";
const stages: Stage[] = ["Nuevo", "Contactado", "Cotización", "Negociación", "Ganado"];
const demoContacts: Contact[] = [
  { id: "crm-1", name: "Carlos Mendoza", company: "Transportes Andinos", email: "carlos@andinos.co", phone: "+57 310 555 0184", stage: "Nuevo", value: 2800000, owner: "Brandon R.", source: "WhatsApp", notes: "Busca soportes para una flota de 12 vehículos." },
  { id: "crm-2", name: "Laura Gómez", company: "Industrias LG", email: "laura@industriaslg.co", phone: "+57 315 555 0112", stage: "Cotización", value: 5400000, owner: "Brandon R.", source: "Landing page", notes: "Cotización enviada. Hacer seguimiento el viernes." },
  { id: "crm-3", name: "Miguel Torres", company: "Maquinaria del Norte", email: "miguel@mnorte.co", phone: "+57 300 555 0168", stage: "Negociación", value: 8900000, owner: "Brandon R.", source: "Referido", notes: "Solicitó descuento por volumen." },
];

const blank = (): Omit<Contact, "id"> => ({ name: "", company: "", email: "", phone: "", stage: "Nuevo", value: 0, owner: "Brandon R.", source: "Manual", notes: "" });
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function CrmStudio() {
  const [contacts, setContacts] = useState<Contact[]>(demoContacts);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setContacts(JSON.parse(stored) as Contact[]);
      } catch { /* Demo contacts remain available. */ }
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? contacts.filter((contact) => `${contact.name} ${contact.company} ${contact.email} ${contact.phone}`.toLowerCase().includes(term)) : contacts;
  }, [contacts, query]);
  const pipelineValue = useMemo(() => contacts.filter((contact) => contact.stage !== "Ganado").reduce((sum, contact) => sum + contact.value, 0), [contacts]);

  function persist(next: Contact[]) {
    setContacts(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }
  function openNew() { setEditingId(null); setForm(blank()); setDialogOpen(true); }
  function openEdit(contact: Contact) {
    const { id, ...values } = contact;
    setEditingId(id); setForm(values); setDialogOpen(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    const contact = { ...form, id: editingId ?? crypto.randomUUID() };
    persist(editingId ? contacts.map((item) => item.id === editingId ? contact : item) : [contact, ...contacts]);
    setDialogOpen(false);
  }
  function move(contact: Contact, stage: Stage) {
    persist(contacts.map((item) => item.id === contact.id ? { ...item, stage } : item));
  }

  return <section className="crm-studio-live">
    <header className="crm-head"><div><span><BriefcaseBusiness size={13}/> RELACIONES Y VENTAS</span><h1>Clientes CRM</h1><p>Organiza contactos, oportunidades y seguimientos del equipo.</p></div><button className="create-button" onClick={openNew}><Plus size={16}/> Nuevo cliente</button></header>
    <div className="crm-summary">
      <article><UserRound/><div><strong>{contacts.length}</strong><small>Contactos</small></div></article>
      <article><Building2/><div><strong>{new Set(contacts.map((contact) => contact.company)).size}</strong><small>Empresas</small></div></article>
      <article><BriefcaseBusiness/><div><strong>{money.format(pipelineValue)}</strong><small>Valor del embudo</small></div></article>
      <article><MessageCircle/><div><strong>{contacts.filter((contact) => contact.source === "WhatsApp").length}</strong><small>Desde WhatsApp</small></div></article>
    </div>
    <div className="crm-toolbar"><div><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nombre, empresa, correo o teléfono"/></div><span>{filtered.length} resultados</span></div>
    <div className="crm-board">
      {stages.map((stage) => {
        const items = filtered.filter((contact) => contact.stage === stage);
        return <section className={`crm-column stage-${stage.toLowerCase()}`} key={stage}><header><div><i/><strong>{stage}</strong><span>{items.length}</span></div><small>{money.format(items.reduce((sum, contact) => sum + contact.value, 0))}</small></header><div>
          {items.map((contact) => <article className="crm-card" key={contact.id}><button className="crm-card-main" onClick={() => openEdit(contact)}><span>{contact.name.split(" ").map((word) => word[0]).slice(0, 2).join("")}</span><div><strong>{contact.name}</strong><small>{contact.company}</small></div></button><b>{money.format(contact.value)}</b><p>{contact.notes || "Sin notas todavía."}</p><footer><em>{contact.source}</em><select aria-label={`Etapa de ${contact.name}`} value={contact.stage} onChange={(event) => move(contact, event.target.value as Stage)}>{stages.map((option) => <option key={option}>{option}</option>)}</select></footer></article>)}
          {items.length === 0 && <div className="crm-column-empty">Sin oportunidades</div>}
        </div></section>;
      })}
    </div>

    {dialogOpen && <div className="crm-modal"><form onSubmit={save}><header><div><span><UserRound size={18}/></span><div><h2>{editingId ? "Editar cliente" : "Nuevo cliente"}</h2><p>Información comercial y seguimiento.</p></div></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={18}/></button></header>
      <div className="crm-form-grid"><label>Nombre completo<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Empresa<input required value={form.company} onChange={(event) => setForm({ ...form, company: event.target.value })}/></label><label><Mail size={12}/> Correo<input type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })}/></label><label><Phone size={12}/> Teléfono<input required value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })}/></label><label>Etapa<select value={form.stage} onChange={(event) => setForm({ ...form, stage: event.target.value as Stage })}>{stages.map((stage) => <option key={stage}>{stage}</option>)}</select></label><label>Valor de oportunidad<input type="number" min="0" value={form.value} onChange={(event) => setForm({ ...form, value: Number(event.target.value) })}/></label><label>Responsable<input value={form.owner} onChange={(event) => setForm({ ...form, owner: event.target.value })}/></label><label>Origen<select value={form.source} onChange={(event) => setForm({ ...form, source: event.target.value })}><option>Manual</option><option>WhatsApp</option><option>Landing page</option><option>Instagram</option><option>Referido</option></select></label></div>
      <label className="crm-notes-label">Notas<textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} placeholder="Próximo paso, necesidades y contexto del cliente."/></label>
      <footer>{editingId && <button className="crm-delete" type="button" onClick={() => { persist(contacts.filter((contact) => contact.id !== editingId)); setDialogOpen(false); }}><Trash2 size={14}/> Eliminar</button>}<span/><button type="button" onClick={() => setDialogOpen(false)}>Cancelar</button><button className="create-button" type="submit">Guardar cliente</button></footer>
    </form></div>}
  </section>;
}
