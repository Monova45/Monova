"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, CreditCard, Download, Gauge, Plus, ReceiptText, Sparkles, Users, X } from "lucide-react";

type PlanId = "Inicial" | "Fundador" | "Pro" | "Negocio" | "Agencia";
interface Plan { id: PlanId; price: number; users: string; credits: string; description: string; features: string[] }
const plans: Plan[] = [
  { id: "Inicial", price: 149000, users: "1 usuario", credits: "300 créditos IA", description: "Para comenzar a organizar el marketing.", features: ["Creative Studio", "Planner", "CRM básico"] },
  { id: "Fundador", price: 199000, users: "3 usuarios", credits: "800 créditos IA", description: "Precio especial para las primeras empresas.", features: ["Todas las herramientas actuales", "Soporte de implementación", "Precio protegido 12 meses"] },
  { id: "Pro", price: 299000, users: "3 usuarios", credits: "1.200 créditos IA", description: "El plan principal para equipos en crecimiento.", features: ["CRM y automatizaciones", "Contenido y redes", "Analytics y Brand Center"] },
  { id: "Negocio", price: 599000, users: "10 usuarios", credits: "3.000 créditos IA", description: "Mayor capacidad, equipo e integraciones.", features: ["WhatsApp conectado", "Campañas multicanal", "Soporte prioritario"] },
  { id: "Agencia", price: 1290000, users: "Usuarios flexibles", credits: "8.000 créditos IA", description: "Para gestionar varias marcas o clientes.", features: ["Múltiples workspaces", "Reportes por cliente", "Onboarding personalizado"] },
];
const storageKey = "monova-billing-plan-v1";
const money = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });

export function BillingStudio() {
  const [planId, setPlanId] = useState<PlanId>("Fundador");
  const [notice, setNotice] = useState("");
  const usedCredits = 544;
  const current = plans.find((plan) => plan.id === planId) ?? plans[1];
  const creditLimit = Number(current.credits.replace(/\D/g, "")) || 800;
  const usagePercent = Math.min(100, Math.round(usedCredits / creditLimit * 100));

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      const stored = localStorage.getItem(storageKey) as PlanId | null;
      if (stored && plans.some((plan) => plan.id === stored)) setPlanId(stored);
    });
    return () => { active = false; };
  }, []);

  const invoiceRows = useMemo(() => [
    { id: "MON-2026-007", date: "27 jul 2026", concept: `Plan ${current.id}`, value: current.price, status: "Demostración" },
    { id: "MON-2026-006", date: "27 jun 2026", concept: "Configuración inicial", value: 500000, status: "Demostración" },
  ], [current]);

  function selectPlan(plan: Plan) {
    setPlanId(plan.id);
    try {
      localStorage.setItem(storageKey, plan.id);
    } catch {
      // The plan still changes for the current session if storage is unavailable.
    }
    setNotice(`Plan ${plan.id} seleccionado. No se realizó ningún cobro.`);
  }
  function downloadReceipt(row: typeof invoiceRows[number]) {
    const content = `MONOVA MARKETING OS\nComprobante de demostración\n\nReferencia: ${row.id}\nFecha: ${row.date}\nConcepto: ${row.concept}\nValor: ${money.format(row.value)}\nEstado: ${row.status}\n\nEste documento no es una factura fiscal ni acredita un pago.`;
    const url = URL.createObjectURL(new Blob([content], { type: "text/plain;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url; link.download = `${row.id}-demo.txt`; link.click(); URL.revokeObjectURL(url);
  }

  return <section className="billing-studio-live">
    <header className="billing-head"><div><span><CreditCard size={13}/> PLANES Y CONSUMO</span><h1>Facturación</h1><p>Administra el plan, límites de IA e historial del workspace.</p></div><span className="billing-demo-badge">PAGOS NO CONECTADOS</span></header>
    <div className="billing-current">
      <article className="billing-plan-card"><header><div><span>PLAN ACTUAL</span><h2>{current.id}</h2><p>{current.description}</p></div>{current.id === "Fundador" && <b>PRECIO FUNDADOR</b>}</header><div className="billing-price"><strong>{money.format(current.price)}</strong><span>/ mes</span></div><div className="billing-plan-details"><span><Users size={15}/>{current.users}</span><span><Sparkles size={15}/>{current.credits}</span></div><small>El cobro real comenzará cuando se conecte el proveedor de pagos.</small></article>
      <article className="billing-usage"><header><div><Gauge size={18}/><span><strong>Consumo de IA</strong><small>Periodo: julio de 2026</small></span></div><b>{usagePercent}%</b></header><div className="billing-usage-bar"><i style={{ width: `${usagePercent}%` }}/></div><p><strong>{usedCredits}</strong> de {creditLimit.toLocaleString("es-CO")} créditos utilizados</p><div><span>Imágenes, textos y análisis</span><b>{Math.max(0, creditLimit - usedCredits).toLocaleString("es-CO")} disponibles</b></div></article>
      <article className="billing-payment"><span><CreditCard size={18}/></span><div><strong>Método de pago</strong><p>Aún no hay una tarjeta conectada.</p><button disabled><Plus size={13}/> Conectar al activar Stripe</button></div></article>
    </div>
    {notice && <div className="billing-notice"><Check size={15}/>{notice}<button type="button" onClick={() => setNotice("")} aria-label="Cerrar aviso"><X size={14}/></button></div>}
    <section className="billing-plans"><header><h2>Planes de Monova</h2><p>Valores mensuales por empresa. El consumo adicional de IA se cobrará aparte.</p></header><div>{plans.map((plan) => <article className={`${plan.id === planId ? "current" : ""} ${plan.id === "Pro" ? "recommended" : ""}`} key={plan.id}>{plan.id === "Pro" && <em>RECOMENDADO</em>}<h3>{plan.id}</h3><p>{plan.description}</p><div><strong>{money.format(plan.price)}</strong><span>/mes</span></div><small>{plan.users} · {plan.credits}</small><ul>{plan.features.map((feature) => <li key={feature}><Check size={12}/>{feature}</li>)}</ul><button type="button" disabled={plan.id === planId} onClick={() => selectPlan(plan)}>{plan.id === planId ? "Plan actual" : `Cambiar a ${plan.id}`}</button></article>)}</div></section>
    <section className="billing-history"><header><div><h2>Historial</h2><p>Comprobantes de demostración; todavía no son facturas fiscales.</p></div><ReceiptText size={19}/></header><div className="billing-invoice-row head"><span>Referencia</span><span>Fecha</span><span>Concepto</span><span>Valor</span><span>Estado</span><span/></div>{invoiceRows.map((row) => <article className="billing-invoice-row" key={row.id}><strong>{row.id}</strong><time>{row.date}</time><span>{row.concept}</span><b>{money.format(row.value)}</b><em>{row.status}</em><button onClick={() => downloadReceipt(row)} title="Descargar comprobante demo" aria-label={`Descargar ${row.id}`}><Download size={14}/></button></article>)}</section>
  </section>;
}
