"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  BrainCircuit,
  BriefcaseBusiness,
  Cloud,
  FolderKanban,
  Home,
  LayoutGrid,
  Link2,
  Mail,
  Megaphone,
  Palette,
  Send,
  Sparkles,
  Users,
  X
} from "lucide-react";
import { type FormEvent, useEffect, useRef, useState } from "react";

const hotspots = [
  {
    id: "ux",
    serviceKey: "ux",
    title: "UX/UI",
    description: "Experiencias digitales que convierten y enamoran.",
    icon: Palette,
    position: "right-[12%] top-[17%]",
    desktopPosition: "right-[11%] top-[22%]",
    mobilePosition: "UX/UI"
  },
  {
    id: "cloud",
    serviceKey: "cloud",
    title: "Cloud",
    description: "Infraestructura escalable, segura y de alto rendimiento.",
    icon: Cloud,
    position: "right-[20%] top-[44%]",
    desktopPosition: "right-[17%] top-[45%]",
    mobilePosition: "Cloud"
  },
  {
    id: "integraciones",
    serviceKey: "integraciones",
    title: "Integraciones",
    description: "Conectamos herramientas, aplicaciones y datos.",
    icon: Link2,
    position: "left-[32%] bottom-[14%]",
    desktopPosition: "left-[45%] bottom-[20%]",
    mobilePosition: "APIs"
  },
  {
    id: "branding",
    serviceKey: "branding",
    title: "Branding",
    description: "Identidad, estrategia y contenido que posiciona tu marca.",
    icon: Sparkles,
    position: "right-[4%] top-[62%]",
    desktopPosition: "right-[6%] top-[60%]",
    mobilePosition: "Marca"
  },
  {
    id: "redes",
    serviceKey: "redes",
    title: "Redes",
    description: "Contenido visual coherente, atractivo y listo para publicar.",
    icon: Megaphone,
    position: "right-[17%] bottom-[9%]",
    desktopPosition: "right-[12%] bottom-[17%]",
    mobilePosition: "Redes"
  },
  {
    id: "inhouse",
    serviceKey: "inhouse",
    title: "Inhouse",
    description: "Capacidad creativa flexible para necesidades recurrentes.",
    icon: BriefcaseBusiness,
    position: "right-[34%] bottom-[9%]",
    desktopPosition: "right-[28%] bottom-[17%]",
    mobilePosition: "Inhouse"
  }
];

const serviceDetails = {
  software: {
    title: "Desarrollo de Software",
    image: "/assets/service-software.png",
    copy:
      "Construimos productos digitales a medida para que tu operación sea más rápida, clara y escalable. Desde una landing de alto impacto hasta plataformas completas, cuidamos arquitectura, rendimiento y experiencia de usuario.",
    points: [
      "Aplicaciones web, móviles, SaaS y paneles administrativos.",
      "Arquitectura escalable, código limpio e integraciones seguras.",
      "Acompañamiento desde la idea inicial hasta el lanzamiento."
    ]
  },
  ia: {
    title: "Inteligencia Artificial",
    image: "/assets/service-ai.png",
    copy:
      "Integramos IA donde realmente aporta valor: automatización de procesos, asistentes inteligentes, análisis de datos y flujos que reducen tareas repetitivas sin perder control humano.",
    points: [
      "Agentes inteligentes para atención, ventas y operaciones.",
      "Automatización de reportes, procesos internos y decisiones.",
      "Modelos conectados a tus herramientas y datos de negocio."
    ]
  },
  ux: {
    title: "Diseño UX/UI",
    image: "/assets/service-design.png",
    copy:
      "Diseñamos interfaces intuitivas, modernas y enfocadas en conversión. Cada pantalla se piensa para que el usuario entienda, confíe y avance sin fricción.",
    points: [
      "Wireframes, prototipos navegables y sistemas visuales.",
      "Diseño responsive para web, móvil y dashboards.",
      "Experiencias alineadas con marca, negocio y usuarios reales."
    ]
  },
  cloud: {
    title: "Cloud & DevOps",
    image: "/assets/service-cloud.png",
    copy:
      "Preparamos infraestructura confiable para que tu producto cargue rápido, crezca sin drama y tenga despliegues ordenados. Nos enfocamos en seguridad, observabilidad y continuidad.",
    points: [
      "Deployments, servidores, contenedores y pipelines.",
      "Optimización de rendimiento, backups y monitoreo.",
      "Infraestructura en AWS, Docker, Kubernetes y servicios cloud."
    ]
  },
  integraciones: {
    title: "Integraciones & APIs",
    image: "/assets/service-integrations.png",
    copy:
      "Conectamos tus sistemas para que la información fluya sin trabajo manual. Integramos pagos, CRM, ERP, formularios, automatizaciones y herramientas internas.",
    points: [
      "APIs propias y conexión con servicios externos.",
      "Integraciones con Stripe, Notion, Slack, GitHub y más.",
      "Sincronización de datos y automatización entre plataformas."
    ]
  },
  branding: {
    title: "Branding Digital",
    image: "/assets/service-branding.png",
    copy:
      "Creamos una identidad digital sólida para que tu marca se vea clara, memorable y profesional en todos sus puntos de contacto.",
    points: [
      "Identidad visual, tono de marca y dirección creativa.",
      "Piezas digitales para web, redes, presentaciones y campañas.",
      "Sistemas de marca listos para crecer con tu negocio."
    ]
  },
  redes: {
    title: "Diseño de Redes",
    image: "/assets/service-social-design.png",
    copy:
      "Diseñamos contenido visual para redes sociales con una línea gráfica coherente, piezas atractivas y mensajes pensados para captar atención y convertir.",
    points: [
      "Posts, historias, carruseles, reels covers y piezas promocionales.",
      "Diseño alineado con tu identidad, campañas y objetivos comerciales.",
      "Contenido visual listo para publicar en Instagram, Facebook, TikTok y más."
    ]
  },
  corporativo: {
    title: "Diseño Corporativo",
    image: "/assets/service-corporate-design.png",
    copy:
      "Creamos piezas visuales profesionales para presentar tu marca, fortalecer tu comunicación y elevar la percepción de tu negocio en cada punto de contacto.",
    points: [
      "Presentaciones, brochures, portafolios, propuestas y documentos comerciales.",
      "Material gráfico para ventas, eventos, lanzamientos y comunicación interna.",
      "Diseños consistentes con tu marca para proyectar confianza y valor."
    ]
  },
  inhouse: {
    title: "Diseño Inhouse",
    image: "/assets/service-inhouse-design.png",
    copy:
      "Ponemos capacidad creativa a disposición de tu empresa para resolver necesidades de diseño recurrentes sin tener que contratar un equipo interno completo.",
    points: [
      "Soporte de diseño por demanda para campañas, redes, presentaciones y piezas internas.",
      "Acompañamiento flexible según la carga visual de tu empresa.",
      "Un flujo ágil para pedir, revisar y recibir piezas con calidad Monova."
    ]
  }
};

type ServiceKey = keyof typeof serviceDetails;

const monovaWhatsappNumber = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "573214198831";

function getServiceWhatsappLink(serviceTitle: string) {
  const message = `Hola Monova, quiero cotizar el servicio de ${serviceTitle}.`;
  return `https://wa.me/${monovaWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

function getProjectWhatsappLink() {
  const message = "Hola Monova, quiero un proyecto así para mi empresa.";
  return `https://wa.me/${monovaWhatsappNumber}?text=${encodeURIComponent(message)}`;
}

const servicePills = [
  "Software a medida",
  "UX/UI premium",
  "Agentes IA",
  "Automatización",
  "Estrategia digital"
];

const heroMetrics = [
  { value: "+100", label: "Proyectos entregados" },
  { value: "+50", label: "Clientes felices" },
  { value: "+10", label: "Industrias impactadas" },
  { value: "+∞", label: "Ideas creadas" }
];

const railItems = [
  { label: "Inicio", icon: Home, action: "inicio", active: true },
  { label: "Servicios", icon: LayoutGrid, action: "servicios" },
  { label: "Proyectos", icon: FolderKanban, action: "proyectos" },
  { label: "Nosotros", icon: Users, action: "nosotros" },
  { label: "Diagnóstico IA", icon: BrainCircuit, action: "diagnostico" },
  { label: "Contacto", icon: Mail, action: "contacto" }
];

const railPanels = {
  proyectos: {
    eyebrow: "Portafolio Monova",
    title: "Proyectos que hablan por nosotros",
    copy: "Soluciones reales para problemas reales. Resultados que generan impacto.",
    cta: "Quiero un proyecto así",
    image: "/assets/monova-projects-hero.png",
    stats: ["Web/App", "SaaS", "Automatización"],
    items: [
      {
        title: "Kliniu",
        meta: "Web / App",
        image: "/assets/project-kliniu.png",
        href: "https://kliniu.vercel.app",
        text: "Plataforma digital para gestionar servicios de limpieza con experiencia clara y comercial."
      },
      {
        title: "Drokex",
        meta: "Marketplace B2B",
        image: "/assets/project-drokex.png",
        href: "https://drokex.com",
        text: "Catálogo digital para conectar empresas de LATAM con compradores internacionales."
      },
      {
        title: "Unipars Tech",
        meta: "Industrial / Web",
        image: "/assets/project-unipars.png",
        href: "https://unipars-tech.vercel.app",
        text: "Sitio tecnológico para presentar soluciones, líneas de negocio y presencia industrial."
      },
      {
        title: "4U Studio Academy",
        meta: "Academia / Web",
        image: "/assets/project-4ustudio.png",
        href: "https://4ustudioacademy.com",
        text: "Academia musical con experiencia de marca, lecciones, planes y captación de estudiantes."
      }
    ]
  },
  nosotros: {
    eyebrow: "Sobre Monova",
    title: "Nuestra historia es el código de nuestro futuro",
    copy:
      "MONOVA nació de la pasión por crear tecnología con propósito. Creemos en la innovación, la creatividad y en el poder de la inteligencia artificial para transformar vidas y negocios.",
    cta: "Hablemos con Monova",
    image: "/assets/monova-about-hero-poster.png",
    stats: ["Código", "Diseño", "IA"],
    items: [
      {
        title: "Innovación",
        meta: "01",
        text: "Diseñamos soluciones con visión de futuro, sin perder claridad ni utilidad."
      },
      {
        title: "Creatividad",
        meta: "02",
        text: "Unimos diseño, estrategia y tecnología para que cada producto se sienta memorable."
      },
      {
        title: "Propósito",
        meta: "03",
        text: "Construimos herramientas que ayudan a vender, operar y crecer mejor."
      }
    ]
  },
  diagnostico: {
    eyebrow: "Diagnóstico IA",
    title: "Descubre qué está frenando tu negocio digital",
    copy:
      "Pasa el link de tu web y Monova IA detecta qué está fallando, qué podrías mejorar y cómo se vería una versión más clara, moderna y lista para convertir.",
    cta: "Abrir diagnóstico",
    image: "/assets/diagnostico-ia-banner.png",
    stats: ["Datos", "Análisis", "Propuesta"],
    items: [
      {
        title: "1. Entrada de datos",
        meta: "Paso 1",
        text: "Nombre, WhatsApp, tipo de negocio, web o Instagram y una descripción breve."
      },
      {
        title: "2. Análisis IA",
        meta: "Paso 2",
        text: "Revisamos presencia digital, objetivos y oportunidades accionables."
      },
      {
        title: "3. Propuesta visual",
        meta: "Paso 3",
        text: "Recibes recomendaciones y una ruta conceptual para mejorar tu sistema digital."
      }
    ]
  },
  contacto: {
    eyebrow: "Contacto Monova",
    title: "Cuéntanos qué quieres construir",
    copy:
      "Déjanos tus datos y una idea breve de lo que necesitas. Revisamos tu caso y te contactamos para proponerte una ruta clara.",
    cta: "Enviar mensaje",
    image: "/assets/monova-contact-cat-new.png",
    stats: ["Proyecto", "WhatsApp", "Respuesta"],
    items: []
  }
};

type RailPanelKey = keyof typeof railPanels;

type DiagnosticResult = {
  auditedUrl?: string;
  mockupImageUrl?: string;
  diagnostico: {
    diseno: number;
    marketing: number;
    automatizacion: number;
    experienciaDigital: number;
    resumen: string;
    problemasDetectados: string[];
    recomendaciones: string[];
    serviciosSugeridos: string[];
  };
  propuesta: {
    concepto: string;
    estiloVisual: string;
    estructuraRecomendada: string[];
    copyHero: string;
    colores: string[];
    funcionalidades: string[];
  };
};

type ChatMessage = {
  role: "bot" | "user";
  text: string;
};

const chatSuggestions = [
  "Quiero vender más por mi web",
  "Necesito automatizar WhatsApp",
  "Quiero una plataforma para mi negocio"
];

const introMinimumDuration = 9000;

function BootOverlay({ onEnter }: { onEnter: () => void }) {
  const fieldRef = useRef<HTMLCanvasElement>(null);
  const markRef = useRef<HTMLCanvasElement>(null);
  const introStartedAt = useRef<number | null>(null);
  const exitTimeout = useRef<number | null>(null);

  const enterAfterMinimumDuration = () => {
    if (exitTimeout.current) return;

    const elapsed = Date.now() - (introStartedAt.current ?? Date.now());
    const remaining = Math.max(0, introMinimumDuration - elapsed);
    exitTimeout.current = window.setTimeout(onEnter, remaining);
  };

  useEffect(() => {
    introStartedAt.current = Date.now();
    const done = window.setTimeout(onEnter, introMinimumDuration);

    return () => {
      window.clearTimeout(done);
      if (exitTimeout.current) window.clearTimeout(exitTimeout.current);
    };
  }, [onEnter]);

  useEffect(() => {
    const canvas = fieldRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const nodes = Array.from({ length: 150 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      z: 0.35 + Math.random() * 0.9,
      vx: (Math.random() - 0.5) * 0.00055,
      vy: (Math.random() - 0.5) * 0.00045,
      phase: Math.random() * Math.PI * 2,
      warm: index % 4 !== 0
    }));

    let width = 0;
    let height = 0;
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const time = (now - start) / 1000;
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      nodes.forEach((node, index) => {
        node.x += node.vx * node.z;
        node.y += node.vy * node.z;
        if (node.x < -0.05) node.x = 1.05;
        if (node.x > 1.05) node.x = -0.05;
        if (node.y < -0.05) node.y = 1.05;
        if (node.y > 1.05) node.y = -0.05;

        const px = (node.x + Math.cos(time * 0.24 + node.phase) * 0.006) * width;
        const py = (node.y + Math.sin(time * 0.2 + node.phase) * 0.005) * height;
        const radius = 0.8 + node.z * 1.35;
        const alpha = 0.06 + node.z * 0.13;

        ctx.beginPath();
        ctx.fillStyle = node.warm
          ? `rgba(255, 134, 34, ${alpha})`
          : `rgba(16, 243, 109, ${alpha * 0.55})`;
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fill();

        for (let next = index + 1; next < nodes.length; next += 13) {
          const other = nodes[next];
          const dx = px - other.x * width;
          const dy = py - other.y * height;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 122) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 121, 15, ${(1 - distance / 122) * 0.052})`;
            ctx.lineWidth = 0.34;
            ctx.moveTo(px, py);
            ctx.lineTo(other.x * width, other.y * height);
            ctx.stroke();
          }
        }
      });

      ctx.restore();
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    frame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const canvas = markRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    const host = canvas.parentElement;
    if (!ctx || !host) return;

    const points: Array<{ x: number; y: number }> = [];
    const addSegment = (x1: number, y1: number, x2: number, y2: number, count: number) => {
      for (let index = 0; index <= count; index++) {
        const t = index / count;
        points.push({ x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t });
      }
    };

    addSegment(0.13, 0.83, 0.13, 0.18, 68);
    addSegment(0.13, 0.18, 0.28, 0.18, 24);
    addSegment(0.28, 0.18, 0.5, 0.43, 56);
    addSegment(0.5, 0.43, 0.72, 0.18, 56);
    addSegment(0.72, 0.18, 0.87, 0.18, 24);
    addSegment(0.87, 0.18, 0.87, 0.83, 68);
    addSegment(0.26, 0.48, 0.5, 0.72, 48);
    addSegment(0.5, 0.72, 0.74, 0.48, 48);

    const particles = points.map((point, index) => ({
      tx: point.x,
      ty: point.y,
      x: Math.random(),
      y: Math.random(),
      radius: 0.8 + (index % 4) * 0.08 + Math.random() * 0.18,
      alpha: 0.56 + Math.random() * 0.32,
      phase: Math.random() * Math.PI * 2
    }));

    let width = 0;
    let height = 0;
    let frame = 0;
    const start = performance.now();

    const resize = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = Math.max(1, Math.round(rect.width * 1.24));
      height = Math.max(1, Math.round(rect.height * 1.32));
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (now: number) => {
      const time = (now - start) / 1000;
      const progress = Math.min(1, time / 1.4);
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      particles.forEach((particle) => {
        const ease = 1 - Math.pow(1 - progress, 3);
        const targetX = particle.tx * width;
        const targetY = particle.ty * height;
        const driftX = Math.cos(time * 1.6 + particle.phase) * 1.6;
        const driftY = Math.sin(time * 1.3 + particle.phase) * 1.4;
        const x = (particle.x * width) * (1 - ease) + targetX * ease + driftX;
        const y = (particle.y * height) * (1 - ease) + targetY * ease + driftY;

        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 190, 105, ${particle.alpha})`;
        ctx.arc(x, y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      ctx.restore();
      frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize, { passive: true });
    frame = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <motion.button
      type="button"
      aria-label="Entrar a Monova"
      className="fixed inset-0 z-[100] cursor-pointer overflow-hidden bg-black text-left text-white"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      onClick={onEnter}
    >
      <video
        src="/assets/monova-intro.mp4"
        className="h-full w-full bg-black object-contain"
        autoPlay
        muted
        playsInline
        preload="auto"
        onEnded={enterAfterMinimumDuration}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,transparent_45%,rgba(0,0,0,0.35)_100%)]" />
      <span className="pointer-events-none absolute bottom-8 left-1/2 -translate-x-1/2 rounded-full border border-white/10 bg-black/35 px-4 py-2 font-display text-[10px] font-black uppercase tracking-[0.28em] text-white/45 backdrop-blur">
        Click para entrar
      </span>
    </motion.button>
  );
}

function ChatModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "¡Hola! Soy Monova, estoy aquí para ayudarte a sistematizar tu empresa. ¿En qué puedo apoyarte hoy?"
    }
  ]);
  const [input, setInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState("");

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sendChatMessage = async (value: string) => {
    if (!value) return;

    const nextMessages: ChatMessage[] = [...messages, { role: "user", text: value }];
    setMessages(nextMessages);
    setInput("");
    setChatLoading(true);
    setChatError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map((message) => ({
            role: message.role === "user" ? "user" : "assistant",
            content: message.text
          }))
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) throw new Error(data.error || "No pudimos responder ahora.");

      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text:
            data.answer ||
            "Puedo ayudarte a aterrizarlo. Cuéntame qué vendes, qué proceso te quita más tiempo y qué quieres mejorar primero."
        }
      ]);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "No pudimos responder ahora. Intenta de nuevo.";
      setChatError(message);
      setMessages((current) => [
        ...current,
        {
          role: "bot",
          text: "No pude conectar con la IA en este momento, pero puedo seguir orientándote si me cuentas qué vendes y qué quieres mejorar."
        }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const submitMessage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendChatMessage(input.trim());
  };

  return (
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center bg-black/72 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-label="Chat Monova"
        className="relative grid w-full max-w-7xl overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_18%_50%,rgba(255,121,15,0.18),transparent_22rem),radial-gradient(circle_at_82%_18%,rgba(105,200,255,0.12),transparent_22rem),linear-gradient(135deg,#050709_0%,#020303_54%,#070402_100%)] p-5 shadow-[0_35px_120px_rgba(0,0,0,0.72)] md:grid-cols-[0.98fr_1.22fr] md:gap-8 md:p-8"
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar chat"
          onClick={onClose}
          className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 transition hover:border-monova-orange/50 hover:text-monova-orange"
        >
          <X size={18} />
        </button>

        <div className="relative hidden min-h-[560px] items-center overflow-hidden rounded-[28px] border border-white/[0.08] bg-[linear-gradient(145deg,rgba(255,255,255,0.055),rgba(255,255,255,0.015))] md:grid md:grid-cols-[0.82fr_1fr] md:gap-10 md:px-7">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.018)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
          <div className="absolute bottom-12 left-16 h-60 w-60 rounded-full bg-monova-orange/18 blur-3xl" />
          <div className="absolute right-10 top-10 h-48 w-48 rounded-full bg-monova-cyan/10 blur-3xl" />
          <div className="relative z-10 flex min-h-[470px] items-end justify-center pb-8">
            <span className="absolute bottom-6 left-1/2 h-8 w-44 -translate-x-1/2 rounded-full bg-black/65 blur-md" />
            <span className="absolute bottom-8 left-1/2 h-px w-48 -translate-x-1/2 bg-gradient-to-r from-transparent via-monova-orange/35 to-transparent" />
            <img
              src="/assets/monova-assistant-cat.png"
              alt="Monova asistente"
              className="relative z-10 max-h-[405px] w-auto translate-y-2 drop-shadow-[0_24px_80px_rgba(255,121,15,0.28)]"
            />
          </div>
          <div className="relative z-10 max-w-[330px]">
            <p className="mb-7 font-display text-xs font-black uppercase tracking-[0.32em] text-monova-orange">
              Monova Lab
            </p>
            <h2 className="font-display text-[2.7rem] font-black leading-[1.06] tracking-[-0.045em]">
              Te ayudamos a <span className="text-monova-orange">automatizar</span> tu empresa con IA.
            </h2>
            <p className="mt-7 text-[15px] font-semibold leading-8 text-white/62">
              Aterrizamos tus ideas, detectamos oportunidades y te mostramos qué sistema inteligente puede ayudarte a vender, operar o crecer mejor.
            </p>
            <div className="mt-7 grid gap-2">
              {["Diagnóstico comercial", "Ruta de producto", "Automatización IA"].map((item) => (
                <span
                  key={item}
                  className="rounded-2xl border border-white/10 bg-black/24 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-white/58"
                >
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="relative min-h-[560px] overflow-hidden rounded-[28px] border border-monova-orange/30 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.01)),#020202] p-5 shadow-[0_0_70px_rgba(255,121,15,0.22)] md:p-7">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent" />
          <div className="absolute -right-20 -top-20 h-48 w-48 rounded-full bg-monova-orange/12 blur-3xl" />
          <div className="relative flex items-center justify-between border-b border-white/10 pb-5">
            <div className="flex items-center gap-4">
              <span className="grid h-12 w-12 place-items-center rounded-2xl border border-monova-orange/30 bg-monova-orange/15 shadow-orange">
                <span className="h-4 w-4 rounded-full bg-monova-orange" />
              </span>
              <div>
                <h3 className="font-display text-2xl font-black">Monova</h3>
                <p className="text-sm font-black text-emerald-400">
                  {chatLoading ? "Pensando una ruta..." : "En línea ahora"}
                </p>
              </div>
            </div>
            <span className="hidden rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/48 sm:inline-flex">
              Asistente IA
            </span>
          </div>

          <div className="relative flex h-[330px] flex-col gap-4 overflow-y-auto py-6 pr-2 md:h-[360px]">
            {messages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "bot" ? (
                  <img
                    src="/assets/monova-assistant-cat.png"
                    alt=""
                    className="mt-1 h-12 w-12 rounded-full border border-monova-orange/35 bg-black object-cover shadow-orange"
                  />
                ) : null}
                <p
                  className={`max-w-[82%] rounded-2xl border px-4 py-3 text-sm font-semibold leading-6 shadow-2xl shadow-black/20 ${
                    message.role === "user"
                      ? "border-monova-orange/45 bg-monova-orange/16 text-white"
                      : "border-white/14 bg-white/[0.065] text-white/82"
                  }`}
                >
                  {message.text}
                </p>
              </div>
            ))}
            {chatLoading ? (
              <div className="flex gap-3">
                <img
                  src="/assets/monova-assistant-cat.png"
                  alt=""
                  className="mt-1 h-12 w-12 rounded-full border border-monova-orange/35 bg-black object-cover shadow-orange"
                />
                <p className="rounded-2xl border border-white/14 bg-white/[0.065] px-4 py-3 text-sm font-semibold leading-6 text-white/72">
                  Analizando tu idea...
                </p>
              </div>
            ) : null}
          </div>

          <div className="mb-3 flex flex-wrap gap-2">
            {chatSuggestions.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                onClick={() => void sendChatMessage(suggestion)}
                disabled={chatLoading}
                className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/50 transition hover:border-monova-orange/40 hover:text-monova-orange"
              >
                {suggestion}
              </button>
            ))}
          </div>
          {chatError ? (
            <p className="mb-3 rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-xs font-bold text-red-100">
              {chatError}
            </p>
          ) : null}

          <form
            onSubmit={submitMessage}
            className="relative flex items-center gap-3 rounded-2xl border border-monova-orange/45 bg-black/76 p-2 shadow-[0_0_38px_rgba(255,121,15,0.18)]"
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={chatLoading}
              placeholder="Escribe tu mensaje..."
              className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm font-bold text-white outline-none placeholder:text-white/42"
            />
            <button
              type="submit"
              aria-label="Enviar mensaje"
              disabled={chatLoading}
              className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-monova-orange text-black transition hover:scale-[1.03]"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </motion.section>
    </motion.div>
  );
}

function ServiceModal({
  serviceKey,
  onClose
}: {
  serviceKey: ServiceKey | null;
  onClose: () => void;
}) {
  const service = serviceKey ? serviceDetails[serviceKey] : null;

  useEffect(() => {
    if (!service) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [service, onClose]);

  if (!service) return null;

  return (
    <motion.div
      className="fixed inset-0 z-[92] grid place-items-center bg-black/76 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="service-modal-title"
        className="relative grid w-full max-w-5xl overflow-hidden rounded-[30px] border border-monova-orange/30 bg-[radial-gradient(circle_at_18%_0%,rgba(255,121,15,0.2),transparent_18rem),linear-gradient(145deg,#080808_0%,#020202_100%)] p-4 text-white shadow-[0_32px_110px_rgba(0,0,0,0.72)] sm:p-5 lg:grid-cols-[0.92fr_1.08fr] lg:gap-7"
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar servicio"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 transition hover:border-monova-orange/50 hover:text-monova-orange"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[220px] overflow-hidden rounded-[24px] border border-white/10 bg-black/35 lg:min-h-full">
          <img
            src={service.image}
            alt={service.title}
            className="h-full min-h-[220px] w-full object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.74)_100%)]" />
          <span className="absolute bottom-4 left-4 rounded-full border border-monova-orange/45 bg-black/45 px-4 py-2 font-display text-[10px] font-black uppercase tracking-[0.22em] text-monova-orange backdrop-blur">
            {service.title}
          </span>
        </div>

        <div className="p-2 sm:p-3 lg:py-6 lg:pr-5">
          <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-monova-orange">
            Servicio Monova
          </p>
          <h2
            id="service-modal-title"
            className="mt-4 pr-12 font-display text-3xl font-black leading-tight tracking-[-0.035em] sm:text-4xl"
          >
            {service.title}
          </h2>
          <p className="mt-5 text-sm font-semibold leading-7 text-white/68 sm:text-base">
            {service.copy}
          </p>
          <ul className="mt-6 grid gap-3">
            {service.points.map((point) => (
              <li
                key={point}
                className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 text-sm font-semibold leading-6 text-white/74"
              >
                {point}
              </li>
            ))}
          </ul>
          <a
            className="mt-7 inline-flex rounded-full bg-monova-orange px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.02]"
            href={getServiceWhatsappLink(service.title)}
            target="_blank"
            rel="noopener noreferrer"
          >
            Cotizar este servicio
          </a>
        </div>
      </motion.section>
    </motion.div>
  );
}

function RailPanelModal({
  panelKey,
  onClose,
  onContact
}: {
  panelKey: RailPanelKey | null;
  onClose: () => void;
  onContact: () => void;
}) {
  const panel = panelKey ? railPanels[panelKey] : null;
  const [panelFormSent, setPanelFormSent] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [diagnosticError, setDiagnosticError] = useState("");
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);

  useEffect(() => {
    if (!panel) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [panel, onClose]);

  const submitDiagnostic = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setDiagnosticLoading(true);
    setDiagnosticError("");

    try {
      const response = await fetch("/api/diagnostico-visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre: formData.get("nombre"),
          whatsapp: formData.get("whatsapp"),
          tipoNegocio: formData.get("tipoNegocio"),
          url: formData.get("url"),
          descripcion: formData.get("descripcion"),
          objetivo: formData.get("objetivo")
        })
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.error || "No pudimos generar el diagnóstico ahora.");
      }

      setDiagnosticResult(data as DiagnosticResult);
      setPanelFormSent(true);
    } catch (error) {
      setDiagnosticError(
        error instanceof Error
          ? error.message
          : "No pudimos generar el diagnóstico ahora. Intenta de nuevo."
      );
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const openMockupPreview = () => {
    if (!diagnosticResult?.mockupImageUrl) return;

    const previewWindow = window.open("", "_blank");
    if (!previewWindow) {
      setDiagnosticError("No pudimos abrir la previsualización. Revisa si el navegador bloqueó la pestaña.");
      return;
    }

    const doc = previewWindow.document;
    doc.title = "Previsualización de home - Monova";
    doc.body.innerHTML = "";

    const style = doc.createElement("style");
    style.textContent = `
      * { box-sizing: border-box; }
      body {
        margin: 0;
        min-height: 100vh;
        background:
          radial-gradient(circle at 18% 0%, rgba(255, 121, 15, 0.28), transparent 28rem),
          radial-gradient(circle at 86% 14%, rgba(105, 200, 255, 0.14), transparent 24rem),
          linear-gradient(145deg, #05070a 0%, #020202 100%);
        color: white;
        font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        padding: 28px;
      }
      .shell { max-width: 1320px; margin: 0 auto; }
      .topbar {
        display: flex;
        align-items: end;
        justify-content: space-between;
        gap: 24px;
        margin-bottom: 22px;
      }
      .eyebrow {
        color: #ff790f;
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.24em;
        text-transform: uppercase;
      }
      h1 {
        max-width: 820px;
        margin: 10px 0 0;
        font-size: clamp(34px, 5vw, 74px);
        line-height: 0.95;
        letter-spacing: -0.035em;
      }
      .summary {
        max-width: 560px;
        margin: 12px 0 0;
        color: rgba(255,255,255,0.66);
        font-size: 15px;
        line-height: 1.7;
        font-weight: 700;
      }
      .badge {
        border: 1px solid rgba(255, 121, 15, 0.4);
        border-radius: 999px;
        padding: 12px 16px;
        color: #ff790f;
        background: rgba(255, 121, 15, 0.08);
        font-size: 11px;
        font-weight: 900;
        letter-spacing: 0.14em;
        text-transform: uppercase;
        white-space: nowrap;
      }
      .frame {
        overflow: hidden;
        border: 1px solid rgba(255,255,255,0.13);
        border-radius: 30px;
        background: rgba(0,0,0,0.56);
        box-shadow: 0 34px 120px rgba(0,0,0,0.64), 0 0 80px rgba(255, 121, 15, 0.18);
      }
      .browser {
        display: flex;
        align-items: center;
        gap: 8px;
        border-bottom: 1px solid rgba(255,255,255,0.1);
        padding: 14px 18px;
        background: rgba(255,255,255,0.04);
      }
      .dot { width: 10px; height: 10px; border-radius: 999px; background: rgba(255,255,255,0.24); }
      .url {
        margin-left: 10px;
        height: 26px;
        flex: 1;
        border-radius: 999px;
        background: rgba(255,255,255,0.08);
      }
      img { display: block; width: 100%; height: auto; }
      @media (max-width: 760px) {
        body { padding: 16px; }
        .topbar { display: block; }
        .badge { display: inline-flex; margin-top: 18px; }
      }
    `;
    doc.head.appendChild(style);

    const shell = doc.createElement("main");
    shell.className = "shell";

    const topbar = doc.createElement("section");
    topbar.className = "topbar";

    const copy = doc.createElement("div");
    const eyebrow = doc.createElement("p");
    eyebrow.className = "eyebrow";
    eyebrow.textContent = "Previsualización Monova IA";
    const title = doc.createElement("h1");
    title.textContent = "Así podría verse tu home mejorada";
    const summary = doc.createElement("p");
    summary.className = "summary";
    summary.textContent = diagnosticResult.propuesta.concepto;
    copy.append(eyebrow, title, summary);

    const badge = doc.createElement("span");
    badge.className = "badge";
    badge.textContent = "Mockup generado";
    topbar.append(copy, badge);

    const frame = doc.createElement("section");
    frame.className = "frame";
    const browser = doc.createElement("div");
    browser.className = "browser";
    browser.innerHTML = '<span class="dot"></span><span class="dot"></span><span class="dot"></span><span class="url"></span>';
    const image = doc.createElement("img");
    image.src = diagnosticResult.mockupImageUrl;
    image.alt = "Mockup de home mejorada";
    frame.append(browser, image);
    shell.append(topbar, frame);
    doc.body.appendChild(shell);
  };

  if (!panel) return null;

  if (panelKey === "proyectos") {
    const projectPanel = railPanels.proyectos;

    return (
      <motion.div
        className="fixed inset-0 z-[91] grid place-items-center bg-black/74 px-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseDown={onClose}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="rail-panel-title"
          className="relative w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(255,121,15,0.18),transparent_20rem),radial-gradient(circle_at_88%_12%,rgba(105,200,255,0.13),transparent_22rem),linear-gradient(145deg,#07090c_0%,#020202_100%)] p-5 text-white shadow-[0_32px_110px_rgba(0,0,0,0.74)] sm:p-8"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={onClose}
            className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 transition hover:border-monova-orange/50 hover:text-monova-orange"
          >
            <X size={18} />
          </button>

          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-monova-orange">
                {projectPanel.eyebrow}
              </p>
              <h2
                id="rail-panel-title"
                className="mt-4 max-w-2xl pr-12 font-display text-3xl font-black leading-tight tracking-[-0.035em] sm:text-5xl"
              >
                {projectPanel.title}
              </h2>
              <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/66 sm:text-base">
                {projectPanel.copy}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {projectPanel.stats.map((stat) => (
                <span
                  key={stat}
                  className="rounded-full border border-monova-orange/35 bg-monova-orange/10 px-3 py-2 font-display text-[10px] font-black uppercase tracking-[0.18em] text-monova-orange"
                >
                  {stat}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            {projectPanel.items.map((item) => (
              <a
                key={item.title}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid overflow-hidden rounded-[24px] border border-white/10 bg-white/[0.04] shadow-2xl shadow-black/20 transition hover:-translate-y-1 hover:border-monova-orange/35 hover:bg-white/[0.06] sm:grid-cols-[180px_minmax(0,1fr)]"
              >
                <div className="relative min-h-[160px] overflow-hidden bg-black">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-full w-full object-cover opacity-85 saturate-[1.12] transition duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent_35%,rgba(0,0,0,0.58)_100%)]" />
                </div>
                <div className="flex min-w-0 flex-col justify-between p-5">
                  <div>
                    <span className="font-display text-[10px] font-black uppercase tracking-[0.22em] text-monova-cyan">
                      {item.meta}
                    </span>
                    <h3 className="mt-2 font-display text-2xl font-black text-white">{item.title}</h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-white/64">{item.text}</p>
                  </div>
                  <span className="mt-5 inline-flex w-fit rounded-full border border-white/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-white/58 transition group-hover:border-monova-orange/45 group-hover:text-monova-orange">
                    Ver caso
                  </span>
                </div>
              </a>
            ))}
          </div>

          <a
            href={getProjectWhatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex rounded-full bg-monova-orange px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.02]"
          >
            {projectPanel.cta}
          </a>
        </motion.section>
      </motion.div>
    );
  }

  if (panelKey === "nosotros") {
    const aboutPanel = railPanels.nosotros;

    return (
      <motion.div
        className="fixed inset-0 z-[91] grid place-items-center bg-black/74 px-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseDown={onClose}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="rail-panel-title"
          className="relative w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(255,121,15,0.2),transparent_20rem),radial-gradient(circle_at_84%_22%,rgba(105,200,255,0.16),transparent_22rem),linear-gradient(145deg,#07090c_0%,#020202_100%)] p-5 text-white shadow-[0_32px_110px_rgba(0,0,0,0.74)] sm:p-8"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 transition hover:border-monova-orange/50 hover:text-monova-orange"
          >
            <X size={18} />
          </button>

          <div className="grid gap-7 lg:grid-cols-[0.96fr_1.04fr] lg:items-stretch">
            <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/35 p-5">
              <div className="absolute inset-0 bg-[linear-gradient(rgba(105,200,255,0.065)_1px,transparent_1px),linear-gradient(90deg,rgba(255,121,15,0.055)_1px,transparent_1px)] bg-[size:46px_46px] opacity-50" />
              <div className="absolute -left-24 top-16 h-64 w-64 rounded-full bg-monova-cyan/14 blur-3xl" />
              <div className="absolute -right-20 bottom-12 h-72 w-72 rounded-full bg-monova-orange/22 blur-3xl" />
              <div className="relative min-h-[420px] overflow-hidden rounded-[24px] border border-white/10">
                <img
                  src={aboutPanel.image}
                  alt={aboutPanel.title}
                  className="h-full min-h-[420px] w-full object-cover object-[76%_center] opacity-76 saturate-[1.22] contrast-[1.08] brightness-[1.2]"
                />
                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12)_0%,rgba(0,0,0,0.2)_48%,rgba(0,0,0,0.72)_100%)]" />
              </div>

              <div className="relative -mt-24 grid gap-3 px-4 pb-1">
                {aboutPanel.items.map((item) => (
                  <article
                    key={item.title}
                    className="rounded-2xl border border-white/10 bg-black/58 p-4 shadow-2xl shadow-black/30 backdrop-blur-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-monova-cyan/30 bg-monova-cyan/10 font-display text-[10px] font-black text-monova-cyan">
                        {item.meta}
                      </span>
                      <div>
                        <h3 className="font-display text-base font-black text-white">{item.title}</h3>
                        <p className="mt-1 text-xs font-semibold leading-5 text-white/62">{item.text}</p>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-center py-2 lg:py-8">
              <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-monova-orange">
                {aboutPanel.eyebrow}
              </p>
              <h2
                id="rail-panel-title"
                className="mt-4 max-w-2xl pr-12 font-display text-4xl font-black leading-[0.98] tracking-[-0.045em] sm:text-6xl"
              >
                Tecnología con propósito.
                <span className="mt-2 block bg-gradient-to-r from-monova-orange to-monova-amber bg-clip-text text-transparent">
                  Creatividad sin límites.
                </span>
              </h2>
              <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-white/68">
                {aboutPanel.copy}
              </p>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {aboutPanel.stats.map((stat) => (
                  <div
                    key={stat}
                    className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 text-center"
                  >
                    <strong className="font-display text-xl font-black text-monova-orange">
                      {stat}
                    </strong>
                    <span className="mt-1 block text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
                      Monova
                    </span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onContact();
                }}
                className="mt-8 inline-flex w-fit rounded-full bg-monova-orange px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.02]"
              >
                {aboutPanel.cta}
              </button>
            </div>
          </div>
        </motion.section>
      </motion.div>
    );
  }

  if (panelKey === "diagnostico" || panelKey === "contacto") {
    const formPanel = railPanels[panelKey];
    const isDiagnostic = panelKey === "diagnostico";
    const diagnosticScores = diagnosticResult
      ? [
          { label: "Diseño", value: diagnosticResult.diagnostico.diseno },
          { label: "Marketing", value: diagnosticResult.diagnostico.marketing },
          { label: "Automatización", value: diagnosticResult.diagnostico.automatizacion },
          { label: "Experiencia", value: diagnosticResult.diagnostico.experienciaDigital }
        ]
      : [];

    return (
      <motion.div
        className="fixed inset-0 z-[91] grid place-items-center bg-black/74 px-4 backdrop-blur-md"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onMouseDown={onClose}
      >
        <motion.section
          role="dialog"
          aria-modal="true"
          aria-labelledby="rail-panel-title"
          className="relative grid w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_18%_0%,rgba(255,121,15,0.18),transparent_20rem),radial-gradient(circle_at_86%_18%,rgba(105,200,255,0.15),transparent_22rem),linear-gradient(145deg,#07090c_0%,#020202_100%)] p-5 text-white shadow-[0_32px_110px_rgba(0,0,0,0.74)] sm:p-8 lg:grid-cols-[0.92fr_1.08fr] lg:gap-8"
          initial={{ opacity: 0, y: 22, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.24 }}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            aria-label="Cerrar panel"
            onClick={onClose}
            className="absolute right-5 top-5 z-10 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 transition hover:border-monova-orange/50 hover:text-monova-orange"
          >
            <X size={18} />
          </button>

          <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-black/35 p-5">
            <div className="absolute inset-0 bg-[linear-gradient(rgba(105,200,255,0.06)_1px,transparent_1px),linear-gradient(90deg,rgba(255,121,15,0.055)_1px,transparent_1px)] bg-[size:46px_46px] opacity-45" />
            <div className="absolute -left-20 top-16 h-64 w-64 rounded-full bg-monova-cyan/14 blur-3xl" />
            <div className="absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-monova-orange/20 blur-3xl" />

            {isDiagnostic && diagnosticResult ? (
              <div className="relative overflow-hidden rounded-[24px] border border-monova-orange/25 bg-black/72 shadow-orange">
                <div className="flex items-start justify-between gap-4 border-b border-white/10 p-4">
                  <div>
                    <p className="font-display text-[10px] font-black uppercase tracking-[0.24em] text-monova-orange">
                      Previsualiza cómo se vería tu home
                    </p>
                    <p className="mt-2 text-xs font-semibold leading-5 text-white/58">
                      Mockup generado con base en el análisis de tu web actual.
                    </p>
                  </div>
                  {diagnosticResult.mockupImageUrl ? (
                    <button
                      type="button"
                      onClick={openMockupPreview}
                      className="shrink-0 rounded-full border border-monova-orange/40 bg-monova-orange/10 px-4 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-monova-orange transition hover:bg-monova-orange hover:text-black"
                    >
                      Abrir grande
                    </button>
                  ) : null}
                </div>
                {diagnosticResult.mockupImageUrl ? (
                  <img
                    src={diagnosticResult.mockupImageUrl}
                    alt="Previsualización de home mejorada"
                    className="h-[620px] w-full object-cover object-top"
                  />
                ) : (
                  <div className="relative h-[620px] overflow-hidden bg-[radial-gradient(circle_at_72%_18%,rgba(255,121,15,0.3),transparent_15rem),linear-gradient(135deg,#050505,#111827)] p-5">
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] bg-[size:38px_38px] opacity-50" />
                    <div className="relative h-full rounded-2xl border border-white/10 bg-black/45 p-4 shadow-2xl">
                      <div className="mb-5 flex items-center justify-between border-b border-white/10 pb-4">
                        <span className="h-3 w-28 rounded-full bg-white/20" />
                        <div className="flex gap-2">
                          <span className="h-2 w-10 rounded-full bg-white/14" />
                          <span className="h-2 w-10 rounded-full bg-white/14" />
                          <span className="h-2 w-10 rounded-full bg-monova-orange" />
                        </div>
                      </div>
                      <div className="grid h-[250px] grid-cols-[1fr_0.85fr] gap-5">
                        <div className="flex flex-col justify-center">
                          <span className="mb-4 h-2 w-20 rounded-full bg-monova-orange" />
                          <p className="font-display text-3xl font-black leading-tight text-white">
                            {diagnosticResult.propuesta.copyHero}
                          </p>
                          <span className="mt-6 h-11 w-40 rounded-full bg-monova-orange" />
                        </div>
                        <div className="rounded-2xl border border-monova-orange/25 bg-monova-orange/10" />
                      </div>
                      <div className="mt-5 grid grid-cols-2 gap-3">
                        <span className="h-24 rounded-2xl border border-white/10 bg-white/10" />
                        <span className="h-24 rounded-2xl border border-white/10 bg-white/10" />
                        <span className="h-24 rounded-2xl border border-white/10 bg-white/10" />
                        <span className="h-24 rounded-2xl border border-white/10 bg-white/10" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="relative min-h-[360px] overflow-hidden rounded-[24px] border border-white/10">
                  <img
                    src={formPanel.image}
                    alt={formPanel.title}
                    className={`h-full min-h-[360px] w-full object-cover opacity-82 saturate-[1.18] contrast-[1.08] brightness-[1.1] ${
                      isDiagnostic ? "scale-[1.12] object-[88%_center]" : "object-center"
                    }`}
                  />
                  {isDiagnostic ? (
                    <div className="absolute inset-y-0 left-0 w-[46%] bg-gradient-to-r from-black via-black/90 to-transparent" />
                  ) : null}
                  <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16)_0%,rgba(0,0,0,0.22)_42%,rgba(0,0,0,0.76)_100%)]" />
                </div>

                <div className="relative -mt-20 rounded-3xl border border-white/12 bg-black/62 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl">
                  <p className="font-display text-[10px] font-black uppercase tracking-[0.24em] text-monova-cyan">
                    {isDiagnostic ? "Monova IA" : "Monova contacto"}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
                    {isDiagnostic
                      ? diagnosticLoading
                        ? "Analizando tu web y preparando una previsualización de la home."
                        : "Completa el diagnóstico y revisamos oportunidades para mejorar tu presencia digital."
                      : "Cuéntanos tu idea y te respondemos con el siguiente paso recomendado."}
                  </p>
                </div>
              </>
            )}
          </div>

          <div className="flex flex-col justify-center py-2 lg:py-5">
            <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-monova-orange">
              {formPanel.eyebrow}
            </p>
            <h2
              id="rail-panel-title"
              className="mt-4 max-w-2xl pr-12 font-display text-3xl font-black leading-tight tracking-[-0.035em] sm:text-5xl"
            >
              {formPanel.title}
            </h2>
            <p className="mt-5 max-w-xl text-sm font-semibold leading-7 text-white/66 sm:text-base">
              {formPanel.copy}
            </p>

            {isDiagnostic && diagnosticResult ? (
              <div className="mt-7 max-h-[58vh] space-y-4 overflow-y-auto pr-2">
                <div className="rounded-3xl border border-monova-orange/35 bg-monova-orange/10 p-5">
                  <p className="font-display text-xl font-black text-white">
                    Diagnóstico generado
                  </p>
                  <p className="mt-3 text-sm font-semibold leading-7 text-white/70">
                    {diagnosticResult.diagnostico.resumen}
                  </p>
                  {diagnosticResult.auditedUrl ? (
                    <a
                      href={diagnosticResult.auditedUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex text-xs font-black uppercase tracking-[0.14em] text-monova-orange hover:text-monova-amber"
                    >
                      Web auditada
                    </a>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  {diagnosticScores.map((score) => (
                    <div
                      key={score.label}
                      className="rounded-2xl border border-white/10 bg-white/[0.045] p-3"
                    >
                      <span className="text-[10px] font-black uppercase tracking-[0.16em] text-white/45">
                        {score.label}
                      </span>
                      <strong className="mt-1 block font-display text-2xl font-black text-white">
                        {score.value}
                      </strong>
                      <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
                        <span
                          className="block h-full rounded-full bg-monova-orange"
                          style={{ width: `${score.value}%` }}
                        />
                      </span>
                    </div>
                  ))}
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <h3 className="font-display text-sm font-black uppercase tracking-[0.18em] text-monova-orange">
                      Qué está mal
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {diagnosticResult.diagnostico.problemasDetectados.map((item) => (
                        <li key={item} className="text-sm font-semibold leading-6 text-white/70">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="rounded-3xl border border-white/10 bg-white/[0.045] p-5">
                    <h3 className="font-display text-sm font-black uppercase tracking-[0.18em] text-monova-cyan">
                      Qué haríamos
                    </h3>
                    <ul className="mt-4 space-y-3">
                      {diagnosticResult.diagnostico.recomendaciones.map((item) => (
                        <li key={item} className="text-sm font-semibold leading-6 text-white/70">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="rounded-3xl border border-white/10 bg-black/45 p-5">
                  <p className="font-display text-[11px] font-black uppercase tracking-[0.24em] text-monova-orange">
                    Concepto visual propuesto
                  </p>
                  <p className="mt-3 font-display text-lg font-black text-white">
                    {diagnosticResult.propuesta.concepto}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white/62">
                    {diagnosticResult.propuesta.estiloVisual}
                  </p>
                  {diagnosticResult.mockupImageUrl ? (
                    <button
                      type="button"
                      onClick={openMockupPreview}
                      className="mt-4 inline-flex rounded-full bg-monova-orange px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.02]"
                    >
                      Abrir mockup en pestaña
                    </button>
                  ) : null}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {diagnosticResult.diagnostico.serviciosSugeridos.map((service) => (
                      <span
                        key={service}
                        className="rounded-full border border-monova-orange/30 bg-monova-orange/10 px-3 py-2 text-[10px] font-black uppercase tracking-[0.14em] text-monova-orange"
                      >
                        {service}
                      </span>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setDiagnosticResult(null);
                    setPanelFormSent(false);
                  }}
                  className="inline-flex rounded-full border border-white/12 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-white/70 transition hover:border-monova-orange/60 hover:text-monova-orange"
                >
                  Hacer otro diagnóstico
                </button>
              </div>
            ) : panelFormSent ? (
              <div className="mt-7 rounded-3xl border border-monova-orange/35 bg-monova-orange/10 p-6">
                <p className="font-display text-xl font-black text-white">Listo, recibimos tus datos.</p>
                <p className="mt-3 text-sm font-semibold leading-7 text-white/68">
                  Gracias. Revisamos la información y te contactamos pronto para continuar.
                </p>
              </div>
            ) : (
              <form
                className="mt-7 grid gap-3"
                onSubmit={isDiagnostic ? submitDiagnostic : (event) => {
                  event.preventDefault();
                  setPanelFormSent(true);
                }}
              >
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    required
                    name="nombre"
                    placeholder="Tu nombre"
                    className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/38 focus:border-monova-orange/50"
                  />
                  <input
                    required
                    name="whatsapp"
                    placeholder="WhatsApp"
                    className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/38 focus:border-monova-orange/50"
                  />
                </div>
                <input
                  required
                  name={isDiagnostic ? "tipoNegocio" : "empresa"}
                  placeholder={isDiagnostic ? "Tipo de negocio o empresa" : "Empresa o proyecto"}
                  className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/38 focus:border-monova-orange/50"
                />
                {isDiagnostic ? (
                  <input
                    required
                    name="url"
                    type="url"
                    placeholder="Link de tu web actual"
                    className="rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold text-white outline-none placeholder:text-white/38 focus:border-monova-orange/50"
                  />
                ) : null}
                <textarea
                  required
                  name={isDiagnostic ? "descripcion" : "mensaje"}
                  rows={4}
                  placeholder={
                    isDiagnostic
                      ? "Cuéntanos qué vendes, qué no te gusta de tu web y qué quieres mejorar."
                      : "Cuéntanos qué necesitas construir, automatizar o mejorar."
                  }
                  className="resize-none rounded-2xl border border-white/10 bg-white/[0.055] px-4 py-3 text-sm font-bold leading-6 text-white outline-none placeholder:text-white/38 focus:border-monova-orange/50"
                />
                {isDiagnostic ? (
                  <select
                    required
                    name="objetivo"
                    defaultValue=""
                    className="rounded-2xl border border-white/10 bg-[#111820] px-4 py-3 text-sm font-bold text-white outline-none focus:border-monova-orange/50"
                  >
                    <option value="" disabled>
                      Objetivo principal
                    </option>
                    <option value="vender mas">Vender más</option>
                    <option value="mejorar imagen">Mejorar imagen</option>
                    <option value="captar leads">Captar leads</option>
                    <option value="automatizar atencion">Automatizar atención</option>
                    <option value="redisenar web">Rediseñar la web</option>
                  </select>
                ) : null}
                {diagnosticError ? (
                  <p className="rounded-2xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm font-bold text-red-100">
                    {diagnosticError}
                  </p>
                ) : null}
                <button
                  type="submit"
                  disabled={diagnosticLoading}
                  className="mt-2 inline-flex w-fit rounded-full bg-monova-orange px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.02]"
                >
                  {diagnosticLoading
                    ? "Analizando web..."
                    : isDiagnostic
                      ? "Generar diagnóstico"
                      : "Enviar mensaje"}
                </button>
              </form>
            )}
          </div>
        </motion.section>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="fixed inset-0 z-[91] grid place-items-center bg-black/74 px-4 backdrop-blur-md"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onMouseDown={onClose}
    >
      <motion.section
        role="dialog"
        aria-modal="true"
        aria-labelledby="rail-panel-title"
        className="relative grid w-full max-w-6xl overflow-hidden rounded-[34px] border border-white/10 bg-[radial-gradient(circle_at_12%_0%,rgba(255,121,15,0.24),transparent_19rem),radial-gradient(circle_at_88%_18%,rgba(105,200,255,0.16),transparent_20rem),linear-gradient(145deg,#07090c_0%,#020202_100%)] p-4 text-white shadow-[0_32px_110px_rgba(0,0,0,0.74)] sm:p-5 lg:grid-cols-[0.9fr_1.1fr] lg:gap-7"
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.24 }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Cerrar panel"
          onClick={onClose}
          className="absolute right-5 top-5 grid h-10 w-10 place-items-center rounded-full border border-white/10 bg-black/35 text-white/70 transition hover:border-monova-orange/50 hover:text-monova-orange"
        >
          <X size={18} />
        </button>

        <div className="relative min-h-[300px] overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_50%_22%,rgba(255,121,15,0.16),transparent_18rem),#050505] lg:min-h-full">
          <img
            src={panel.image}
            alt={panel.title}
            className="h-full min-h-[300px] w-full object-cover opacity-88 saturate-[1.28] contrast-[1.12] brightness-[1.38]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.24)_48%,rgba(0,0,0,0.68)_100%),radial-gradient(circle_at_62%_26%,rgba(255,121,15,0.08)_0%,rgba(0,0,0,0.05)_34%,rgba(0,0,0,0.58)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(105,200,255,0.09)_1px,transparent_1px),linear-gradient(90deg,rgba(255,121,15,0.07)_1px,transparent_1px)] bg-[size:54px_54px] opacity-35 mix-blend-screen" />
          <div className="absolute -right-20 top-20 h-72 w-72 rounded-full bg-monova-orange/25 blur-3xl" />
          <div className="absolute -left-24 bottom-28 h-64 w-64 rounded-full bg-monova-cyan/15 blur-3xl" />
          <div className="absolute right-8 top-1/2 hidden -translate-y-1/2 font-display text-[12rem] font-black leading-none text-white/[0.035] lg:block">
            M
          </div>
          <div className="absolute left-5 right-5 top-5 flex flex-wrap gap-2">
            {panel.stats.map((stat) => (
              <span
                key={stat}
                className="rounded-full border border-monova-orange/45 bg-black/48 px-3 py-2 font-display text-[10px] font-black uppercase tracking-[0.18em] text-monova-orange shadow-[0_0_22px_rgba(255,121,15,0.16)] backdrop-blur"
              >
                {stat}
              </span>
            ))}
          </div>
          <div className="absolute bottom-5 left-5 right-5 rounded-3xl border border-white/12 bg-black/58 p-5 shadow-[0_18px_60px_rgba(0,0,0,0.5)] backdrop-blur-xl">
            <p className="font-display text-[10px] font-black uppercase tracking-[0.24em] text-monova-cyan">
              Monova system
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/70">
              Estrategia, estética y tecnología trabajando como un solo sistema.
            </p>
          </div>
        </div>

        <div className="p-2 sm:p-4 lg:py-6 lg:pr-5">
          <p className="font-display text-[11px] font-black uppercase tracking-[0.28em] text-monova-orange">
            {panel.eyebrow}
          </p>
          <h2
            id="rail-panel-title"
            className="mt-4 max-w-2xl pr-12 font-display text-3xl font-black leading-tight tracking-[-0.035em] sm:text-5xl"
          >
            {panel.title}
          </h2>
          <p className="mt-5 max-w-2xl text-sm font-semibold leading-7 text-white/68 sm:text-base">
            {panel.copy}
          </p>

          <div className="mt-7 grid gap-3">
            {panel.items.map((item) => (
              <article
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-4 transition hover:border-monova-orange/35 hover:bg-monova-orange/[0.055]"
              >
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-monova-orange via-monova-amber to-monova-cyan opacity-70" />
                <div className="flex items-start gap-4 pl-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl border border-monova-cyan/25 bg-monova-cyan/10 font-display text-[10px] font-black uppercase tracking-[0.14em] text-monova-cyan">
                    {item.meta}
                  </span>
                  <div>
                    <h3 className="font-display text-lg font-black text-white">{item.title}</h3>
                    <p className="mt-2 text-sm font-semibold leading-6 text-white/62">{item.text}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onContact();
            }}
            className="mt-7 inline-flex rounded-full bg-monova-orange px-6 py-3 text-xs font-black uppercase tracking-[0.16em] text-black transition hover:scale-[1.02]"
          >
            {panel.cta}
          </button>
        </div>
      </motion.section>
    </motion.div>
  );
}

export function OfficeExperience() {
  const [activeHotspot, setActiveHotspot] = useState("ux");
  const [showBoot, setShowBoot] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceKey | null>(null);
  const [selectedRailPanel, setSelectedRailPanel] = useState<RailPanelKey | null>(null);
  const openHotspotService = (serviceKey: ServiceKey) => setSelectedService(serviceKey);
  const openContact = () => setChatOpen(true);
  const handleRailAction = (action: string) => {
    if (action === "inicio") {
      document.getElementById("oficina")?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    if (action === "servicios") {
      setActiveHotspot("software");
      setSelectedService("software");
      return;
    }

    if (action === "contacto") {
      setSelectedRailPanel("contacto");
      return;
    }

    setSelectedRailPanel(action as RailPanelKey);
  };

  return (
    <section
      id="oficina"
      className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_68%_26%,rgba(30,123,255,0.22),transparent_30rem),radial-gradient(circle_at_85%_62%,rgba(255,121,15,0.2),transparent_24rem),linear-gradient(145deg,#02050a_0%,#07111d_48%,#02050a_100%)] lg:h-screen lg:min-h-[760px]"
    >
      <div className="absolute inset-0 hidden lg:block">
        <Image
          src="/images/monova-office.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-[58%_center]"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(2,5,10,0.97)_0%,rgba(2,5,10,0.84)_17%,rgba(2,5,10,0.42)_32%,rgba(2,5,10,0.08)_66%,rgba(2,5,10,0.42)_100%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,5,10,0.78)_0%,rgba(2,5,10,0.06)_18%,rgba(2,5,10,0.05)_66%,rgba(2,5,10,0.8)_100%)]" />
      </div>
      <div className="absolute inset-0 bg-[linear-gradient(rgba(105,200,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(105,200,255,0.04)_1px,transparent_1px)] bg-[size:72px_72px] opacity-45" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.22)_54%,rgba(0,0,0,0.8)_100%)] lg:bg-[radial-gradient(ellipse_at_70%_48%,transparent_0%,rgba(0,0,0,0.08)_52%,rgba(0,0,0,0.72)_100%)]" />

      {showBoot ? <BootOverlay onEnter={() => setShowBoot(false)} /> : null}

      <header className="relative z-30 mx-auto flex w-full max-w-[1640px] items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <a href="#oficina" className="flex items-center gap-4">
          <span className="relative grid h-11 w-14 place-items-center overflow-hidden rounded-xl border border-monova-orange/25 bg-monova-orange/10">
            <img src="/assets/monova-mark.svg" alt="" className="h-7 w-auto" />
          </span>
          <span className="font-display text-xl font-black tracking-[0.34em] text-white">
            MONOVA
          </span>
        </a>

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="inline-flex items-center gap-3 rounded-full border border-monova-orange/60 bg-black/25 px-5 py-3 text-xs font-black uppercase tracking-[0.16em] text-monova-amber backdrop-blur-xl transition hover:bg-monova-orange hover:text-black hover:shadow-orange sm:px-6 sm:text-sm"
        >
          Hablemos <ArrowRight size={18} />
        </button>
      </header>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.38, duration: 0.55 }}
        className="pointer-events-auto absolute bottom-28 left-1/2 z-30 hidden -translate-x-1/2 items-center gap-3 lg:flex"
      >
        <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/42 p-2 shadow-2xl shadow-black/40 backdrop-blur-2xl">
          <span className="hidden rounded-full border border-monova-orange/30 bg-monova-orange/10 px-4 py-3 font-display text-[10px] font-black uppercase tracking-[0.24em] text-monova-orange xl:inline-flex">
            Servicios
          </span>
          {hotspots.map((hotspot) => {
            const Icon = hotspot.icon;
            const isActive = activeHotspot === hotspot.id;

            const className = `monova-click-pulse grid h-11 w-11 place-items-center rounded-full border transition ${
              isActive
                ? "border-monova-orange/70 bg-monova-orange/16 text-monova-orange shadow-orange"
                : "border-white/10 bg-white/[0.035] text-white/74 hover:border-monova-cyan/50 hover:text-monova-cyan"
            }`;

            return (
              <button
                key={`desktop-${hotspot.id}`}
                id={hotspot.id}
                type="button"
                aria-label={hotspot.title}
                onClick={() => openHotspotService(hotspot.serviceKey as ServiceKey)}
                onMouseEnter={() => setActiveHotspot(hotspot.id)}
                onFocus={() => setActiveHotspot(hotspot.id)}
                className={className}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

      </motion.div>

      <aside className="monova-rail-pulse absolute right-7 top-1/2 z-30 hidden -translate-y-1/2 overflow-hidden rounded-[24px] border border-white/10 bg-black/38 shadow-2xl shadow-black/40 backdrop-blur-2xl xl:block">
        {railItems.map((item) => {
          const Icon = item.icon;
          const className = `grid h-16 w-16 place-items-center border-b border-white/10 transition last:border-b-0 ${
            item.active
              ? "bg-monova-orange/12 text-monova-orange shadow-orange"
              : "text-white/76 hover:bg-white/8 hover:text-monova-cyan"
          }`;

          return (
            <button
              key={item.label}
              type="button"
              aria-label={item.label}
              onClick={() => handleRailAction(item.action)}
              className={className}
            >
              <Icon size={22} />
            </button>
          );
        })}
      </aside>

      <div className="relative z-10 mx-auto grid min-h-[calc(100svh-94px)] w-full max-w-[1640px] grid-cols-1 items-center gap-8 px-5 pb-10 pt-4 sm:px-8 lg:h-[calc(100svh-94px)] lg:min-h-[650px] lg:px-10 lg:pb-36 xl:grid-cols-[390px_minmax(0,1fr)] 2xl:grid-cols-[410px_minmax(0,1fr)]">
        <span id="servicios" className="absolute top-24" />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="relative z-20 max-w-[350px] xl:pb-16"
        >
          <p className="mb-4 inline-flex rounded-full border border-monova-cyan/20 bg-monova-cyan/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-monova-cyan">
            Oficina holográfica interactiva
          </p>
          <h1 className="font-display text-4xl font-black leading-[1.02] tracking-[-0.05em] text-white sm:text-5xl lg:text-[clamp(2.75rem,3vw,3.95rem)]">
            Bienvenido a la oficina de{" "}
            <span className="bg-gradient-to-r from-monova-orange to-monova-amber bg-clip-text text-transparent">
              Monova
            </span>
          </h1>
          <p className="mt-5 max-w-sm text-[15px] font-semibold leading-7 text-white/68">
            Aquí las ideas se convierten en soluciones digitales que impulsan negocios.
          </p>
          <div className="mt-6 flex max-w-xs flex-wrap gap-2">
            {servicePills.map((pill) => (
              <span
                key={pill}
                className="rounded-full border border-white/10 bg-black/25 px-3 py-1.5 text-[11px] font-semibold text-white/60"
              >
                {pill}
              </span>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.85, delay: 0.12, ease: "easeOut" }}
          className="relative z-10 lg:hidden"
        >
          <div className="relative mx-auto aspect-[16/10] w-full max-w-[1120px] lg:max-w-none xl:w-[min(68vw,1280px)] 2xl:w-[min(70vw,1360px)]">
            <div className="absolute inset-[-5%] rounded-[44px] bg-monova-cyan/10 blur-3xl" />
            <div className="relative h-full overflow-hidden rounded-[26px] border border-white/[0.06] bg-black/10 shadow-holo lg:rounded-[18px]">
              <Image
                src="/images/monova-office.png"
                alt="Oficina holográfica de Monova con zonas interactivas de servicios digitales"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 74vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_48%_48%,transparent_0%,rgba(2,5,10,0.08)_54%,rgba(2,5,10,0.55)_100%)]" />

              <motion.button
                type="button"
                onClick={() => setChatOpen(true)}
                className="absolute bottom-[9%] right-[23%] hidden h-20 w-20 rounded-full border border-monova-orange/70 bg-monova-orange/15 shadow-orange md:block"
                animate={{ scale: [1, 1.08, 1], opacity: [0.8, 1, 0.8] }}
                transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
                aria-label="Ir a Hablemos"
              />
            </div>

            <motion.div
              className="absolute left-4 top-4 hidden max-w-[280px] rounded-3xl border border-white/10 bg-black/68 p-4 shadow-2xl backdrop-blur-xl sm:block"
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.65 }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-monova-orange/15 text-monova-orange">
                  <Bot size={21} />
                </span>
                <div>
                  <p className="text-sm font-bold text-white">Monova está en línea</p>
                  <p className="text-xs text-white/45">Asistente de oficina</p>
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-white/72">
                ¿Qué quieres construir hoy?
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.85, duration: 0.55 }}
        className="absolute bottom-4 left-8 right-8 z-30 hidden grid-cols-[1.05fr_repeat(4,0.82fr)_0.9fr] items-center gap-0 overflow-hidden rounded-2xl border border-white/10 bg-black/42 shadow-2xl shadow-black/40 backdrop-blur-2xl lg:grid xl:left-16 xl:right-16"
      >
        <div className="flex items-center gap-3 border-r border-white/10 px-4 py-2.5">
          <span className="grid h-8 w-10 place-items-center rounded-xl bg-monova-orange/12">
            <img src="/assets/monova-mark.svg" alt="" className="h-5 w-auto" />
          </span>
          <p className="font-display text-[10px] font-black uppercase leading-4 tracking-[0.22em] text-white">
            Creamos el <span className="text-monova-orange">presente</span>,
            <br />
            diseñamos el <span className="text-monova-orange">futuro</span>.
          </p>
        </div>

        {heroMetrics.map((metric) => (
          <div key={metric.label} className="border-r border-white/10 px-4 py-2.5">
            <strong className="font-display text-xl font-black text-white">{metric.value}</strong>
            <p className="mt-0.5 text-[10px] font-bold uppercase leading-4 tracking-[0.16em] text-white/52">
              {metric.label}
            </p>
          </div>
        ))}

        <button
          type="button"
          onClick={() => setChatOpen(true)}
          className="flex h-full items-center justify-center gap-3 px-4 py-2.5 text-[11px] font-black uppercase tracking-[0.18em] text-monova-orange transition hover:bg-monova-orange hover:text-black"
        >
          Hablemos <ArrowRight size={16} />
        </button>
      </motion.div>

      <div className="relative z-20 mx-auto grid w-full max-w-7xl gap-3 px-5 pb-12 sm:px-8 md:hidden">
        {hotspots.map((hotspot) => {
          const Icon = hotspot.icon;

          return (
            <button
              key={hotspot.id}
              type="button"
              onClick={() => openHotspotService(hotspot.serviceKey as ServiceKey)}
              className="monova-click-pulse flex items-center gap-4 rounded-3xl border border-white/10 bg-white/[0.05] p-4 text-left backdrop-blur"
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-monova-cyan/10 text-monova-cyan">
                <Icon size={22} />
              </span>
              <span className="min-w-0 flex-1">
                <strong className="block font-display text-sm uppercase tracking-[0.16em]">
                  {hotspot.title}
                </strong>
                <small className="mt-1 block text-sm leading-5 text-white/58">
                  {hotspot.description}
                </small>
              </span>
              <ArrowRight className="text-monova-orange" size={18} />
            </button>
          );
        })}
      </div>
      <ChatModal isOpen={chatOpen} onClose={() => setChatOpen(false)} />
      <ServiceModal serviceKey={selectedService} onClose={() => setSelectedService(null)} />
      <RailPanelModal
        key={selectedRailPanel ?? "closed"}
        panelKey={selectedRailPanel}
        onClose={() => setSelectedRailPanel(null)}
        onContact={openContact}
      />
    </section>
  );
}
