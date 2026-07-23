import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, LockKeyhole } from "lucide-react";
import { notFound } from "next/navigation";
import { PRODUCT, PUBLIC_ROUTES } from "@/config/product";

const content: Record<string, { title: string; copy: string }> = {
  funciones: { title: "Un sistema para cada parte de tu marketing", copy: "IA, creación, programación, conversaciones, campañas y analítica trabajando con el mismo contexto de marca." },
  precios: { title: "Un plan que crece contigo", copy: "Starter, Pro, Business, Agency y Enterprise. La facturación real se habilitará cuando el proveedor de pagos esté configurado." },
  soluciones: { title: "Menos herramientas. Más claridad.", copy: "Coordina estrategia, contenido, aprobaciones y resultados en un flujo común para todo el equipo." },
  agencias: { title: "Opera todas tus marcas sin perder el control", copy: "Workspaces separados, aprobaciones, permisos y consumo por cliente desde una sola cuenta." },
  empresas: { title: "Marketing conectado con la operación", copy: "Une equipos, datos, marca y canales con una arquitectura preparada para crecer." },
  recursos: { title: "Ideas para operar mejor tu marketing", copy: "Guías, plantillas y recursos de Monova. La biblioteca editorial se encuentra en preparación." },
  contacto: { title: "Hablemos de tu sistema de marketing", copy: `Escríbenos a ${PRODUCT.supportEmail} para diseñar la implementación adecuada para tu equipo.` }
};

export default async function PublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (slug === "login" || slug === "registro") return <AuthPage mode={slug} />;
  if (!PUBLIC_ROUTES.includes(slug as typeof PUBLIC_ROUTES[number])) notFound();
  const page = content[slug];
  return <main className="simple-page"><Link href="/" className="back-link"><ArrowLeft size={16}/> Inicio</Link><section><span className="brand-mark">M</span><div className="eyebrow">Monova Marketing OS</div><h1>{page.title}</h1><p>{page.copy}</p><div className="feature-lines">{["Multiworkspace y permisos","Datos demo identificados","Integraciones desacopladas"].map(x=><span key={x}><Check size={16}/>{x}</span>)}</div><Link className="button primary" href="/registro">Empezar ahora <ArrowRight size={17}/></Link></section></main>;
}

function AuthPage({ mode }: { mode: string }) {
  const register = mode === "registro";
  return <main className="auth-page"><div className="auth-brand"><Link href="/" className="brand-lockup"><span className="brand-mark">M</span><span>MONOVA</span></Link><div><div className="eyebrow light">Marketing OS</div><h1>Tu marca, tus canales y tu equipo en un solo lugar.</h1><p>Esta primera entrega incluye acceso de demostración. Supabase Auth se conectará cuando existan las credenciales del proyecto.</p></div></div><section className="auth-card"><div><LockKeyhole size={22}/><span>Acceso seguro</span></div><h2>{register ? "Crea tu cuenta" : "Bienvenido de nuevo"}</h2><p>{register ? "Empieza con tu primer workspace." : "Ingresa a tu espacio de trabajo."}</p><form><label>Correo<input type="email" placeholder="tu@empresa.com" required/></label><label>Contraseña<input type="password" placeholder="Mínimo 8 caracteres" required minLength={8}/></label><Link className="button primary full" href="/app/dashboard">{register ? "Crear workspace demo" : "Entrar a la demo"}<ArrowRight size={17}/></Link></form><small>Demo local · No se almacenan credenciales</small><p className="auth-switch">{register ? "¿Ya tienes cuenta?" : "¿Aún no tienes cuenta?"} <Link href={register?"/login":"/registro"}>{register?"Ingresar":"Registrarme"}</Link></p></section></main>;
}
