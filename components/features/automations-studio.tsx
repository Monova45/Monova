"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  BellRing, Bot, ChevronDown, Clock3, GitBranch,
  MessageSquareText, Play, Plus, Save, Tag, Trash2, UserRoundPlus, X, Zap,
} from "lucide-react";

type StepType = "Disparador" | "Mensaje" | "Condición" | "Espera" | "Etiqueta" | "Notificación";
interface FlowStep { id: string; type: StepType; title: string; detail: string }
interface Flow { id: string; name: string; active: boolean; steps: FlowStep[]; runs: number }

const storageKey = "monova-automations-v1";
const demoFlow: Flow = {
  id: "lead-demo", name: "Nuevo cliente potencial", active: false, runs: 0,
  steps: [
    { id: "trigger", type: "Disparador", title: "Nuevo lead", detail: "WhatsApp o formulario" },
    { id: "welcome", type: "Mensaje", title: "Enviar bienvenida", detail: "Mensaje personalizado" },
    { id: "tag", type: "Etiqueta", title: "Etiquetar lead", detail: "Interés: soportes" },
    { id: "notify", type: "Notificación", title: "Notificar ventas", detail: "Asignar responsable" },
  ],
};
const iconFor = {
  Disparador: Zap, Mensaje: MessageSquareText, Condición: GitBranch,
  Espera: Clock3, Etiqueta: Tag, Notificación: BellRing,
};

export function AutomationsStudio() {
  const [flows, setFlows] = useState<Flow[]>([demoFlow]);
  const [selectedId, setSelectedId] = useState(demoFlow.id);
  const [stepOpen, setStepOpen] = useState(false);
  const [flowOpen, setFlowOpen] = useState(false);
  const [stepType, setStepType] = useState<StepType>("Mensaje");
  const [stepTitle, setStepTitle] = useState("");
  const [stepDetail, setStepDetail] = useState("");
  const [flowName, setFlowName] = useState("");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed = JSON.parse(stored) as Flow[];
          if (parsed.length) { setFlows(parsed); setSelectedId(parsed[0].id); }
        }
      } catch { /* Demo flow remains available. */ }
    });
    return () => { active = false; };
  }, []);

  const selected = flows.find((flow) => flow.id === selectedId) ?? flows[0];
  const totals = useMemo(() => ({
    active: flows.filter((flow) => flow.active).length,
    steps: flows.reduce((sum, flow) => sum + flow.steps.length, 0),
    runs: flows.reduce((sum, flow) => sum + flow.runs, 0),
  }), [flows]);

  function persist(next: Flow[]) {
    setFlows(next);
    try { localStorage.setItem(storageKey, JSON.stringify(next)); } catch { /* Optional storage. */ }
  }
  function updateSelected(updater: (flow: Flow) => Flow) {
    persist(flows.map((flow) => flow.id === selected.id ? updater(flow) : flow));
  }
  function createFlow(event: FormEvent) {
    event.preventDefault();
    const flow: Flow = {
      id: crypto.randomUUID(), name: flowName.trim(), active: false, runs: 0,
      steps: [{ id: crypto.randomUUID(), type: "Disparador", title: "Nuevo contacto", detail: "Elige una fuente" }],
    };
    persist([flow, ...flows]); setSelectedId(flow.id); setFlowName(""); setFlowOpen(false);
  }
  function addStep(event: FormEvent) {
    event.preventDefault();
    updateSelected((flow) => ({ ...flow, steps: [...flow.steps, { id: crypto.randomUUID(), type: stepType, title: stepTitle.trim(), detail: stepDetail.trim() }] }));
    setStepTitle(""); setStepDetail(""); setStepOpen(false);
  }
  function removeStep(id: string) {
    updateSelected((flow) => ({ ...flow, steps: flow.steps.filter((step) => step.id !== id) }));
  }

  return <section className="automation-studio-live">
    <header className="automation-head">
      <div><span><Bot size={13}/> FLUJOS INTELIGENTES</span><h1>Automatizaciones</h1><p>Conecta acciones y deja que Monova ejecute el trabajo repetitivo.</p></div>
      <div><button className="automation-save" onClick={() => persist(flows)}><Save size={15}/> Guardado</button><button className="create-button" onClick={() => setFlowOpen(true)}><Plus size={16}/> Nuevo flujo</button></div>
    </header>

    <div className="automation-summary">
      <article><strong>{flows.length}</strong><small>Flujos</small></article>
      <article><strong>{totals.active}</strong><small>Activos</small></article>
      <article><strong>{totals.steps}</strong><small>Acciones configuradas</small></article>
      <article><strong>{totals.runs}</strong><small>Ejecuciones locales</small></article>
    </div>

    <div className="automation-workspace">
      <aside className="automation-flow-list">
        <header><strong>Mis flujos</strong><button onClick={() => setFlowOpen(true)} aria-label="Crear flujo"><Plus size={14}/></button></header>
        {flows.map((flow) => <button key={flow.id} className={flow.id === selected?.id ? "active" : ""} onClick={() => setSelectedId(flow.id)}>
          <span className={flow.active ? "on" : ""}><Zap size={13}/></span><div><strong>{flow.name}</strong><small>{flow.steps.length} pasos · {flow.active ? "Activo" : "Pausado"}</small></div><ChevronDown size={13}/>
        </button>)}
      </aside>

      {selected && <main className="automation-builder">
        <header><div><span className={selected.active ? "automation-status on" : "automation-status"}>{selected.active ? "ACTIVO" : "PAUSADO"}</span><h2>{selected.name}</h2><p>Los cambios se guardan automáticamente en este navegador.</p></div><button className={selected.active ? "automation-toggle on" : "automation-toggle"} onClick={() => updateSelected((flow) => ({ ...flow, active: !flow.active }))}><Play size={14}/>{selected.active ? "Pausar flujo" : "Activar flujo"}</button></header>
        <div className="automation-canvas">
          {selected.steps.map((step, index) => {
            const Icon = iconFor[step.type];
            return <div className="automation-node-wrap" key={step.id}>
              <article className={`automation-node node-${step.type.toLowerCase()}`}><span><Icon size={16}/></span><div><small>{step.type}</small><strong>{step.title}</strong><p>{step.detail}</p></div><button onClick={() => removeStep(step.id)} title="Eliminar paso" aria-label="Eliminar paso"><Trash2 size={13}/></button></article>
              {index < selected.steps.length - 1 && <i><em/></i>}
            </div>;
          })}
          <button className="automation-add-step" onClick={() => setStepOpen(true)}><Plus size={16}/> Agregar paso</button>
        </div>
      </main>}
    </div>

    {stepOpen && <div className="automation-modal"><form onSubmit={addStep}><header><div><span><Plus size={17}/></span><div><h2>Agregar paso</h2><p>Define la siguiente acción del flujo.</p></div></div><button type="button" onClick={() => setStepOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><label>Tipo<select value={stepType} onChange={(event) => setStepType(event.target.value as StepType)}>{Object.keys(iconFor).map((type) => <option key={type}>{type}</option>)}</select></label><label>Nombre<input required value={stepTitle} onChange={(event) => setStepTitle(event.target.value)} placeholder="Ej. Enviar catálogo"/></label><label>Configuración<textarea required value={stepDetail} onChange={(event) => setStepDetail(event.target.value)} placeholder="Describe qué debe ocurrir."/></label><footer><button type="button" onClick={() => setStepOpen(false)}>Cancelar</button><button className="create-button" type="submit">Agregar al flujo</button></footer></form></div>}
    {flowOpen && <div className="automation-modal"><form onSubmit={createFlow}><header><div><span><UserRoundPlus size={17}/></span><div><h2>Nuevo flujo</h2><p>Crea una automatización desde cero.</p></div></div><button type="button" onClick={() => setFlowOpen(false)} aria-label="Cerrar"><X size={17}/></button></header><label>Nombre del flujo<input required value={flowName} onChange={(event) => setFlowName(event.target.value)} placeholder="Ej. Seguimiento de cotizaciones"/></label><footer><button type="button" onClick={() => setFlowOpen(false)}>Cancelar</button><button className="create-button" type="submit">Crear flujo</button></footer></form></div>}
  </section>;
}
