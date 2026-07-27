"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import {
  Bell, Check, Globe2, LockKeyhole, Save, Settings2, ShieldCheck,
  SlidersHorizontal, UserRound, Users, X,
} from "lucide-react";

type SettingsData = {
  workspace: string;
  ownerName: string;
  email: string;
  website: string;
  timezone: string;
  language: string;
  weekStarts: string;
  emailNotifications: boolean;
  campaignNotifications: boolean;
  weeklySummary: boolean;
  aiSuggestions: boolean;
};

const storageKey = "monova-settings-v1";
const defaults: SettingsData = {
  workspace: "Universal de Cauchos",
  ownerName: "Brandon R.",
  email: "brandon@universalcauchos.com",
  website: "https://universalcauchos.com",
  timezone: "America/Bogota",
  language: "Español",
  weekStarts: "Lunes",
  emailNotifications: true,
  campaignNotifications: true,
  weeklySummary: true,
  aiSuggestions: false,
};

const tabs = [
  { id: "general", label: "General", icon: Settings2 },
  { id: "preferences", label: "Preferencias", icon: SlidersHorizontal },
  { id: "notifications", label: "Notificaciones", icon: Bell },
  { id: "security", label: "Seguridad", icon: ShieldCheck },
] as const;

type TabId = typeof tabs[number]["id"];

export function SettingsStudio() {
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) setSettings({ ...defaults, ...JSON.parse(stored) });
      } catch {
        // Keep demo defaults if browser storage is unavailable or malformed.
      }
    });
    return () => { active = false; };
  }, []);

  function update<K extends keyof SettingsData>(key: K, value: SettingsData[K]) {
    setSettings((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function save(event?: FormEvent) {
    event?.preventDefault();
    try {
      localStorage.setItem(storageKey, JSON.stringify(settings));
    } catch {
      // The current session still reflects the changes.
    }
    setSaved(true);
  }

  return (
    <section className="settings-studio-live">
      <header className="settings-live-head">
        <div>
          <span><Settings2 size={13}/> CONFIGURACIÓN DEL WORKSPACE</span>
          <h1>Ajustes</h1>
          <p>Personaliza el espacio de trabajo y las preferencias de tu cuenta.</p>
        </div>
        <button type="button" className={`settings-save ${saved ? "saved" : ""}`} onClick={() => save()}>
          {saved ? <Check size={15}/> : <Save size={15}/>}
          {saved ? "Cambios guardados" : "Guardar cambios"}
        </button>
      </header>

      {saved && <div className="settings-notice"><Check size={15}/>La configuración se guardó correctamente en este navegador.<button type="button" onClick={() => setSaved(false)} aria-label="Cerrar aviso"><X size={14}/></button></div>}

      <div className="settings-layout">
        <nav className="settings-tabs" aria-label="Secciones de ajustes">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button type="button" className={activeTab === id ? "active" : ""} onClick={() => setActiveTab(id)} key={id}>
              <Icon size={16}/><span>{label}</span>
            </button>
          ))}
          <div><ShieldCheck size={17}/><span><strong>Datos protegidos</strong><small>Configuración local de demostración</small></span></div>
        </nav>

        <form className="settings-live-panel" onSubmit={save}>
          {activeTab === "general" && <>
            <header><span><Globe2 size={18}/></span><div><h2>Información general</h2><p>Datos principales visibles para los miembros del workspace.</p></div></header>
            <div className="settings-form-grid">
              <label>Nombre del workspace<input value={settings.workspace} onChange={(event) => update("workspace", event.target.value)} required/></label>
              <label>Sitio web<input type="url" value={settings.website} onChange={(event) => update("website", event.target.value)} placeholder="https://"/></label>
              <label>Nombre del propietario<input value={settings.ownerName} onChange={(event) => update("ownerName", event.target.value)} required/></label>
              <label>Correo de contacto<input type="email" value={settings.email} onChange={(event) => update("email", event.target.value)} required/></label>
            </div>
            <aside className="settings-summary"><span>{settings.workspace.slice(0, 2).toUpperCase()}</span><div><strong>{settings.workspace || "Sin nombre"}</strong><small>{settings.email || "Sin correo"}</small></div><em>Workspace activo</em></aside>
          </>}

          {activeTab === "preferences" && <>
            <header><span><SlidersHorizontal size={18}/></span><div><h2>Preferencias regionales</h2><p>Define cómo se muestran fechas, idioma y calendario.</p></div></header>
            <div className="settings-form-grid">
              <label>Idioma<select value={settings.language} onChange={(event) => update("language", event.target.value)}><option>Español</option><option>English</option><option>Português</option></select></label>
              <label>Zona horaria<select value={settings.timezone} onChange={(event) => update("timezone", event.target.value)}><option>America/Bogota</option><option>America/Mexico_City</option><option>America/New_York</option><option>Europe/Madrid</option></select></label>
              <label>Primer día de la semana<select value={settings.weekStarts} onChange={(event) => update("weekStarts", event.target.value)}><option>Lunes</option><option>Domingo</option></select></label>
            </div>
            <aside className="settings-info"><Globe2 size={17}/><div><strong>Vista previa regional</strong><p>27 de julio de 2026 · 10:19 a. m. · {settings.timezone}</p></div></aside>
          </>}

          {activeTab === "notifications" && <>
            <header><span><Bell size={18}/></span><div><h2>Notificaciones</h2><p>Elige qué actualizaciones quieres recibir dentro de Monova.</p></div></header>
            <div className="settings-switches">
              <SwitchRow title="Notificaciones por correo" description="Novedades importantes del workspace." checked={settings.emailNotifications} onChange={(value) => update("emailNotifications", value)}/>
              <SwitchRow title="Actividad de campañas" description="Avisos cuando una campaña cambia de estado." checked={settings.campaignNotifications} onChange={(value) => update("campaignNotifications", value)}/>
              <SwitchRow title="Resumen semanal" description="Resultados principales enviados cada lunes." checked={settings.weeklySummary} onChange={(value) => update("weeklySummary", value)}/>
              <SwitchRow title="Sugerencias de IA" description="Recomendaciones automáticas de contenido y optimización." checked={settings.aiSuggestions} onChange={(value) => update("aiSuggestions", value)}/>
            </div>
          </>}

          {activeTab === "security" && <>
            <header><span><LockKeyhole size={18}/></span><div><h2>Seguridad y acceso</h2><p>Revisa la protección disponible en esta versión de demostración.</p></div></header>
            <div className="settings-security-grid">
              <article><UserRound size={19}/><div><strong>Cuenta del propietario</strong><p>{settings.email}</p></div><b>ACTIVA</b></article>
              <article><Users size={19}/><div><strong>Miembros del equipo</strong><p>Gestiona roles y permisos desde Equipo.</p></div><Link href="/app/team">Administrar</Link></article>
              <article><ShieldCheck size={19}/><div><strong>Autenticación en dos pasos</strong><p>Disponible al conectar el proveedor de autenticación.</p></div><button type="button" disabled>Próximamente</button></article>
              <article><LockKeyhole size={19}/><div><strong>Sesiones activas</strong><p>Este navegador · Bogotá, Colombia</p></div><b>ACTUAL</b></article>
            </div>
          </>}

          <footer><span>Los cambios de esta demostración se guardan solamente en este navegador.</span><button type="submit"><Save size={14}/>Guardar cambios</button></footer>
        </form>
      </div>
    </section>
  );
}

function SwitchRow({ title, description, checked, onChange }: { title: string; description: string; checked: boolean; onChange: (value: boolean) => void }) {
  return <label><span><strong>{title}</strong><small>{description}</small></span><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)}/><i aria-hidden="true"/></label>;
}
