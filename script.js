const menuButton = document.querySelector(".menu-button");
const nav = document.querySelector(".desktop-nav");

menuButton?.addEventListener("click", () => {
  nav?.classList.toggle("open");
});

nav?.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => nav.classList.remove("open"));
});

const serviceDetails = {
  software: {
    title: "Desarrollo de Software",
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
    copy:
      "Creamos una identidad digital sólida para que tu marca se vea clara, memorable y profesional en todos sus puntos de contacto.",
    points: [
      "Identidad visual, tono de marca y dirección creativa.",
      "Piezas digitales para web, redes, presentaciones y campañas.",
      "Sistemas de marca listos para crecer con tu negocio."
    ]
  }
};

const serviceModal = document.querySelector(".service-modal");
const serviceModalTitle = document.querySelector("#service-modal-title");
const serviceModalCopy = document.querySelector(".service-modal__copy");
const serviceModalList = document.querySelector(".service-modal__list");
let lastServiceTrigger = null;

const closeServiceModal = () => {
  if (!serviceModal) return;
  serviceModal.classList.remove("is-open");
  serviceModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  lastServiceTrigger?.focus();
};

document.querySelectorAll(".service-more").forEach((button) => {
  button.addEventListener("click", () => {
    const details = serviceDetails[button.dataset.service];
    if (!details || !serviceModal || !serviceModalTitle || !serviceModalCopy || !serviceModalList) return;

    lastServiceTrigger = button;
    serviceModalTitle.textContent = details.title;
    serviceModalCopy.textContent = details.copy;
    serviceModalList.innerHTML = "";
    details.points.forEach((point) => {
      const item = document.createElement("li");
      item.textContent = point;
      serviceModalList.appendChild(item);
    });

    serviceModal.classList.add("is-open");
    serviceModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");
    serviceModal.querySelector(".service-modal__close")?.focus();
  });
});

document.querySelectorAll("[data-close-modal]").forEach((button) => {
  button.addEventListener("click", closeServiceModal);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && serviceModal?.classList.contains("is-open")) {
    closeServiceModal();
  }
});

const labInput = document.querySelector("#project-idea");
const labButton = document.querySelector("[data-generate-roadmap]");
const labOutput = document.querySelector(".lab-diagnosis");

const roadmapPresets = [
  {
    keywords: ["venta", "ventas", "crm", "cliente", "lead", "leads"],
    cards: [
      ["01", "Oportunidad", "Estás perdiendo ventas si los interesados no tienen dónde cotizar, preguntar o dejar sus datos."],
      ["02", "Solución Monova", "Landing o plataforma comercial con CRM, formularios, WhatsApp y seguimiento automático de leads."],
      ["03", "Siguiente paso", "Mapeamos tu flujo de venta y armamos una primera versión para captar oportunidades reales."]
    ]
  },
  {
    keywords: ["tienda", "ecommerce", "producto", "catalogo", "pago"],
    cards: [
      ["01", "Oportunidad", "Si vendes productos y aún todo depende de mensajes manuales, necesitas convertir interés en compra."],
      ["02", "Solución Monova", "Catálogo o ecommerce con pagos, inventario, pedidos y una experiencia clara para comprar rápido."],
      ["03", "Siguiente paso", "Organizamos productos, categorías y flujo de compra para lanzar una vitrina digital funcional."]
    ]
  },
  {
    keywords: ["app", "plataforma", "saas", "dashboard", "sistema"],
    cards: [
      ["01", "Oportunidad", "Tu operación puede estar dependiendo de hojas, chats o tareas repetidas que frenan el crecimiento."],
      ["02", "Solución Monova", "Plataforma a medida con usuarios, permisos, dashboard, datos conectados y automatizaciones."],
      ["03", "Siguiente paso", "Definimos módulos esenciales y construimos un MVP que resuelva el flujo más importante primero."]
    ]
  }
];

const defaultRoadmap = [
  ["01", "Oportunidad", "Sí, se puede. Primero necesitamos entender qué vendes, cómo te contactan hoy y dónde se pierde la venta."],
  ["02", "Solución Monova", "Podemos plantear una web, catálogo, automatización o plataforma según lo que más te ayude a vender u operar."],
  ["03", "Siguiente paso", "Cuéntanos producto, ciudad, forma de entrega y proceso actual para proponerte una versión inicial concreta."]
];

const normalizeText = (value) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const inferOffer = (idea) => {
  const normalized = normalizeText(idea)
    .replace(/[¿?¡!,.;:]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const patterns = [
    /vender\s+(.+?)(?:\s+en\s+linea|\s+online|\s+por\s+internet|$)/,
    /vendo\s+(.+?)(?:\s+y|\s+pero|\s+en\s+linea|\s+online|$)/,
    /vendemos\s+(.+?)(?:\s+y|\s+pero|\s+en\s+linea|\s+online|$)/,
    /empresa\s+de\s+(.+?)(?:\s+pero|\s+y|\s+que|$)/
  ];
  const match = patterns.map((pattern) => normalized.match(pattern)).find(Boolean);
  const rawOffer = match?.[1]?.trim();
  if (!rawOffer || rawOffer.length < 3) return "tus productos";
  return rawOffer
    .replace(/\b(una|un|mi|mis|la|el|los|las|quiero|para)\b/g, "")
    .replace(/\s+/g, " ")
    .trim() || "tus productos";
};

const isOnlineSalesIdea = (idea) => {
  const normalized = normalizeText(idea);
  const sellingWords = ["vendo", "vender", "vendemos", "venta", "ventas", "tienda", "catalogo", "producto", "productos"];
  const digitalWords = ["linea", "online", "internet", "digital", "web", "pagina", "ecommerce", "domicilio", "pedidos"];
  return sellingWords.some((word) => normalized.includes(word)) && digitalWords.some((word) => normalized.includes(word));
};

const isPricingQuestion = (idea) => {
  const normalized = normalizeText(idea);
  return [
    "que vale",
    "cuanto vale",
    "cuanto cuesta",
    "precio",
    "costaria",
    "cotizacion",
    "cotizar",
    "valor",
    "presupuesto"
  ].some((word) => normalized.includes(word));
};

const escapeHTML = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderRoadmap = (cards, ideaText) => {
  if (!labOutput) return;
  const normalizedCards = cards.map((card, index) => {
    const [number, title, copy] = Array.isArray(card)
      ? card
      : [card.number || `0${index + 1}`, card.title, card.copy];
    return { number, title, copy };
  });
  const [mainCard, ...detailCards] = normalizedCards;
  const details = detailCards
    .map((card) => `<p><strong>${escapeHTML(card.title)}:</strong> ${escapeHTML(card.copy)}</p>`)
    .join("");
  const userIdea = escapeHTML(ideaText || labInput?.value?.trim() || "Quiero mejorar mi empresa");
  labOutput.innerHTML = `
    <div class="lab-message lab-message--user">
      <p>${userIdea}</p>
    </div>
    <div class="lab-message lab-message--bot">
      <span>${escapeHTML(mainCard.number)} · ${escapeHTML(mainCard.title)}</span>
      <p>${escapeHTML(mainCard.copy)}</p>
      ${details}
    </div>
  `;
};

const renderRoadmapError = (message) => {
  if (!labOutput) return;
  labOutput.innerHTML = `
    <div class="lab-message lab-message--bot">
      <span>Monova</span>
      <p>${message}</p>
    </div>
  `;
};

const getLocalRoadmap = (idea) => {
  const normalizedIdea = normalizeText(idea);

  if (isPricingQuestion(idea)) {
    return [
      ["01", "Precio", "Depende del alcance. No es lo mismo una landing sencilla que un catálogo con pedidos, pagos, inventario y panel administrativo."],
      ["02", "Para cotizar", "Necesitamos saber cuántos productos tendrás, si manejarás pagos en línea, domicilios, WhatsApp, inventario o usuarios internos."],
      ["03", "Siguiente paso", "Lo mejor es hacer un diagnóstico corto y con eso te damos una propuesta por fases: básica, intermedia o completa."]
    ];
  }

  if (isOnlineSalesIdea(idea)) {
    const offer = inferOffer(idea);
    return [
      ["01", "Oportunidad", `Sí, se puede vender ${offer} en línea. Te falta una vitrina clara para que la gente vea, pregunte y pida sin depender solo del chat.`],
      ["02", "Solución Monova", `Haríamos una página o catálogo con fotos, precios, zonas de entrega, botón de WhatsApp y formulario de pedidos para ${offer}.`],
      ["03", "Siguiente paso", "Primero organizamos productos, precios, horarios, entregas y forma de pago. Con eso armamos una versión simple para empezar a vender."]
    ];
  }

  const preset = roadmapPresets.find((item) =>
    item.keywords.some((keyword) => normalizedIdea.includes(keyword))
  );
  return preset?.cards || defaultRoadmap;
};

labButton?.addEventListener("click", async () => {
  const rawIdea = labInput?.value?.trim() || "";
  const idea = rawIdea.toLowerCase();
  if (!rawIdea) {
    renderRoadmapError("Escribe una idea y generamos una propuesta inicial.");
    return;
  }

  labButton.disabled = true;
  labButton.textContent = "…";
  renderRoadmap([
    ["01", "Leyendo negocio", "Estamos entendiendo qué vendes, a quién y qué oportunidad digital puede haber."],
    ["02", "Detectando solución", "Revisamos si encaja mejor una web, plataforma, automatización, IA o branding."],
    ["03", "Armando propuesta", "Convertimos la idea en pasos claros, accionables y fáciles de explicar."]
  ], rawIdea);
  labInput.value = "";

  try {
    const response = await fetch("/api/roadmap", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idea })
    });
    const data = await response.json();

    if (!response.ok || !Array.isArray(data.cards)) {
      throw new Error(data.error || "No se pudo generar la ruta con IA.");
    }

    renderRoadmap(data.cards, rawIdea);
  } catch (error) {
    console.warn(error);
    renderRoadmap(getLocalRoadmap(idea), rawIdea);
  } finally {
    labButton.disabled = false;
    labButton.textContent = "➢";
    labInput?.focus();
  }
});

labInput?.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    labButton?.click();
  }
});
