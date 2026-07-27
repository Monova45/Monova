"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { Check, Clock3, Mail, MoreHorizontal, Plus, Search, ShieldCheck, Trash2, UserRoundCog, Users, X } from "lucide-react";

type Role = "Propietario" | "Administrador" | "Marketing" | "Ventas" | "Solo lectura";
type Status = "Activo" | "Invitación pendiente" | "Suspendido";
interface Member {
  id: string; name: string; email: string; role: Role; status: Status;
  permissions: string[]; lastActivity: string;
}
const storageKey = "monova-team-members-v1";
const permissionOptions = ["Creative Studio", "Planner", "Redes sociales", "WhatsApp", "CRM", "Analytics", "Brand Center"];
const seedMembers: Member[] = [
  { id: "owner", name: "Brandon R.", email: "brandon@universaldecauchos.co", role: "Propietario", status: "Activo", permissions: permissionOptions, lastActivity: "Ahora" },
  { id: "member-2", name: "Laura Martínez", email: "laura@universaldecauchos.co", role: "Marketing", status: "Activo", permissions: ["Creative Studio", "Planner", "Redes sociales", "Analytics"], lastActivity: "Hace 2 h" },
  { id: "member-3", name: "Carlos Ruiz", email: "carlos@universaldecauchos.co", role: "Ventas", status: "Activo", permissions: ["WhatsApp", "CRM", "Analytics"], lastActivity: "Ayer" },
];
const initials = (name: string) => name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();

export function TeamStudio() {
  const [members, setMembers] = useState<Member[]>(seedMembers);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("Marketing");
  const [permissions, setPermissions] = useState<string[]>(["Creative Studio", "Planner"]);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setMembers(JSON.parse(stored) as Member[]);
      } catch { /* Seed members remain available. */ }
    });
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return term ? members.filter((member) => `${member.name} ${member.email} ${member.role}`.toLowerCase().includes(term)) : members;
  }, [members, query]);
  const activeCount = members.filter((member) => member.status === "Activo").length;

  function persist(next: Member[]) {
    setMembers(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Optional persistence. */ }
  }
  function resetForm() { setName(""); setEmail(""); setRole("Marketing"); setPermissions(["Creative Studio", "Planner"]); }
  function openInvite() { setEditingId(null); resetForm(); setDialogOpen(true); }
  function openEdit(member: Member) {
    setEditingId(member.id); setName(member.name); setEmail(member.email);
    setRole(member.role); setPermissions(member.permissions); setDialogOpen(true);
  }
  function save(event: FormEvent) {
    event.preventDefault();
    if (editingId) {
      persist(members.map((member) => member.id === editingId ? { ...member, name, email, role, permissions } : member));
    } else {
      persist([{ id: crypto.randomUUID(), name, email, role, permissions, status: "Invitación pendiente", lastActivity: "Invitación local" }, ...members]);
    }
    setDialogOpen(false);
  }
  function togglePermission(permission: string) {
    setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission]);
  }
  function changeStatus(member: Member, status: Status) {
    persist(members.map((item) => item.id === member.id ? { ...item, status } : item));
  }

  return <section className="team-studio-live">
    <header className="team-head"><div><span><Users size={13}/> PERSONAS Y PERMISOS</span><h1>Equipo</h1><p>Administra quién puede acceder y qué puede hacer dentro del workspace.</p></div><button className="create-button" onClick={openInvite}><Plus size={16}/> Invitar integrante</button></header>
    <div className="team-summary">
      <article><Users/><div><strong>{members.length}</strong><small>Integrantes</small></div></article>
      <article><Check/><div><strong>{activeCount}</strong><small>Activos</small></div></article>
      <article><Clock3/><div><strong>{members.filter((member) => member.status === "Invitación pendiente").length}</strong><small>Invitaciones pendientes</small></div></article>
      <article><ShieldCheck/><div><strong>{members.filter((member) => ["Propietario", "Administrador"].includes(member.role)).length}</strong><small>Administradores</small></div></article>
    </div>
    <div className="team-panel">
      <header><div><Search size={15}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar integrante, correo o rol"/></div><span>{filtered.length} personas</span></header>
      <div className="team-table">
        <div className="team-row head"><span>Integrante</span><span>Rol</span><span>Permisos</span><span>Estado</span><span>Actividad</span><span/></div>
        {filtered.map((member) => <article className="team-row" key={member.id}><div className="team-person"><b>{initials(member.name)}</b><span><strong>{member.name}</strong><small>{member.email}</small></span></div><select aria-label={`Rol de ${member.name}`} value={member.role} disabled={member.id === "owner"} onChange={(event) => persist(members.map((item) => item.id === member.id ? { ...item, role: event.target.value as Role } : item))}>{["Propietario", "Administrador", "Marketing", "Ventas", "Solo lectura"].map((option) => <option key={option}>{option}</option>)}</select><button className="team-permissions" onClick={() => openEdit(member)}>{member.permissions.length} módulos</button><select className={`team-status status-${member.status.toLowerCase().replaceAll(" ", "-")}`} aria-label={`Estado de ${member.name}`} value={member.status} disabled={member.id === "owner"} onChange={(event) => changeStatus(member, event.target.value as Status)}><option>Activo</option><option>Invitación pendiente</option><option>Suspendido</option></select><time>{member.lastActivity}</time><button className="team-more" onClick={() => openEdit(member)} aria-label={`Editar ${member.name}`}><MoreHorizontal size={16}/></button></article>)}
      </div>
    </div>
    <aside className="team-note"><ShieldCheck size={17}/><div><strong>Permisos locales activos</strong><p>Los roles y accesos se guardan en este navegador. Cuando conectemos autenticación, estas reglas se aplicarán a las cuentas reales.</p></div></aside>

    {dialogOpen && <div className="team-modal"><form onSubmit={save}><header><div><span><UserRoundCog size={18}/></span><div><h2>{editingId ? "Editar integrante" : "Invitar integrante"}</h2><p>{editingId ? "Actualiza el rol y los accesos." : "La invitación quedará pendiente hasta conectar email."}</p></div></div><button type="button" onClick={() => setDialogOpen(false)} aria-label="Cerrar"><X size={18}/></button></header>
      <label>Nombre completo<input required value={name} onChange={(event) => setName(event.target.value)} placeholder="Nombre y apellido"/></label>
      <label><Mail size={12}/> Correo<input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="persona@empresa.com"/></label>
      <label>Rol<select value={role} onChange={(event) => setRole(event.target.value as Role)}><option>Administrador</option><option>Marketing</option><option>Ventas</option><option>Solo lectura</option></select></label>
      <fieldset><legend>Permisos por módulo</legend><div>{permissionOptions.map((permission) => <label key={permission}><input type="checkbox" checked={permissions.includes(permission)} onChange={() => togglePermission(permission)}/><span>{permission}</span></label>)}</div></fieldset>
      <footer>{editingId && editingId !== "owner" && <button className="team-delete" type="button" onClick={() => { persist(members.filter((member) => member.id !== editingId)); setDialogOpen(false); }}><Trash2 size={14}/> Eliminar</button>}<span/><button type="button" onClick={() => setDialogOpen(false)}>Cancelar</button><button className="create-button" type="submit">{editingId ? "Guardar cambios" : "Crear invitación"}</button></footer>
    </form></div>}
  </section>;
}
