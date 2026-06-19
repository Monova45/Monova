let toolsWhatsappNumber = "57XXXXXXXXXX";

const tabs = document.querySelectorAll("[data-tool-tab]");
const panels = document.querySelectorAll("[data-tool-panel]");
const toolsVisual = document.querySelector("#toolsVisual");
const toolsOutput = document.querySelector("#toolsOutput");
const toolsTitle = document.querySelector("#toolsConsoleTitle");
const toolsWhatsapp = document.querySelector("#toolsWhatsapp");

const escapeToolsHTML = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getChecked = (form, name) => [...form.querySelectorAll(`input[name="${name}"]:checked`)].map((item) => item.value);

const setTool = (tool) => {
  tabs.forEach((tab) => tab.classList.toggle("is-active", tab.dataset.toolTab === tool));
  panels.forEach((panel) => panel.classList.toggle("is-active", panel.dataset.toolPanel === tool));
};

const setWhatsapp = (message) => {
  if (!toolsWhatsapp) return;
  toolsWhatsapp.href = `https://wa.me/${toolsWhatsappNumber}?text=${encodeURIComponent(message)}`;
};

const renderNodes = (nodes) => {
  if (!toolsVisual) return;
  toolsVisual.innerHTML = nodes
    .map(
      (node, index) => `
        <div class="tools-node ${index % 2 === 0 ? "is-hot" : ""}" style="--i: ${index}">
          ${escapeToolsHTML(node)}
        </div>
      `
    )
    .join("");
};

const renderOutput = ({ title, summary, metrics, actions, tags }) => {
  if (toolsTitle) toolsTitle.textContent = title;
  if (!toolsOutput) return;
  toolsOutput.innerHTML = `
    <p>${escapeToolsHTML(summary)}</p>
    <div class="tools-metrics">
      ${metrics
        .map(
          (metric) => `
            <article>
              <strong>${escapeToolsHTML(metric.value)}</strong>
              <span>${escapeToolsHTML(metric.label)}</span>
            </article>
          `
        )
        .join("")}
    </div>
    <div class="tools-actions">
      ${actions.map((item) => `<span>${escapeToolsHTML(item)}</span>`).join("")}
    </div>
    <div class="tools-tags">
      ${tags.map((item) => `<i>${escapeToolsHTML(item)}</i>`).join("")}
    </div>
  `;
};

const handleSystem = (form) => {
  const business = String(new FormData(form).get("business") || "tu negocio").trim();
  const modules = getChecked(form, "modules");
  const selected = modules.length ? modules : ["WhatsApp IA", "CRM", "Dashboard"];
  const nodes = ["Cliente", ...selected, "Venta"];
  renderNodes(nodes);
  renderOutput({
    title: "Arquitectura recomendada",
    summary: `Para ${business}, Monova conectaría ${selected.join(", ")} en un flujo que captura leads, ordena la atención y convierte conversaciones en oportunidades medibles.`,
    metrics: [
      { value: selected.length, label: "módulos conectados" },
      { value: `${Math.min(92, 48 + selected.length * 8)}%`, label: "potencial de automatización" },
      { value: "3 fases", label: "roadmap sugerido" }
    ],
    actions: ["Mapa de procesos", "Prototipo UX", "Integraciones", "Dashboard"],
    tags: ["Software a medida", "Automatización", "IA operacional"]
  });
  setWhatsapp(`Hola Monova, construí mi sistema ideal para ${business} y quiero que lo revisemos.`);
};

const handleWhatsapp = (form) => {
  const data = new FormData(form);
  const messages = Number(data.get("messages") || 0);
  const responseTime = Number(data.get("responseTime") || 20);
  const issues = getChecked(form, "issues");
  const risk = Math.min(96, Math.round(messages * 0.9 + responseTime * 0.35 + issues.length * 9));
  const savedHours = Math.max(4, Math.round((messages * responseTime) / 180));
  renderNodes(["Lead", "WhatsApp", "IA", "Etiquetas", "Seguimiento", "Cierre"]);
  renderOutput({
    title: "Auditoría WhatsApp generada",
    summary: `Tu WhatsApp tiene una fuga comercial estimada de ${risk} puntos. Las automatizaciones más urgentes están en respuestas iniciales, clasificación de leads y seguimiento.`,
    metrics: [
      { value: `${risk}/100`, label: "riesgo comercial" },
      { value: `${savedHours}h`, label: "ahorro semanal estimado" },
      { value: issues.length || 1, label: "procesos por automatizar" }
    ],
    actions: ["Bot de bienvenida", "Preguntas frecuentes", "Etiquetas CRM", "Recordatorios"],
    tags: issues.length ? issues : ["Atención inicial", "Seguimiento"]
  });
  setWhatsapp("Hola Monova, audité mi WhatsApp comercial y quiero automatizarlo con IA.");
};

const handleQuote = (form) => {
  const data = new FormData(form);
  const project = String(data.get("project") || "Proyecto digital");
  const scope = getChecked(form, "scope");
  const complexity = Math.min(10, Math.max(2, scope.length + (project.includes("Software") ? 4 : project.includes("Ecommerce") ? 3 : 1)));
  const phase = complexity <= 4 ? "MVP premium" : complexity <= 7 ? "Versión Pro" : "Sistema Full";
  renderNodes(["Estrategia", "UX/UI", project, ...scope.slice(0, 3), "Lanzamiento"]);
  renderOutput({
    title: "Alcance preliminar",
    summary: `${project} entra como ${phase}. La recomendación es iniciar con una fase visual y funcional para validar rápido antes de escalar integraciones.`,
    metrics: [
      { value: phase, label: "nivel sugerido" },
      { value: `${complexity}/10`, label: "complejidad" },
      { value: `${Math.max(3, complexity)} sem`, label: "rango inicial" }
    ],
    actions: ["Definir alcance", "Diseñar prototipo", "Construir MVP", "Optimizar"],
    tags: scope.length ? scope : ["Diseño UX/UI", "Desarrollo"]
  });
  setWhatsapp(`Hola Monova, usé el cotizador para ${project} y quiero una propuesta formal.`);
};

const handlers = {
  system: handleSystem,
  whatsapp: handleWhatsapp,
  quote: handleQuote
};

tabs.forEach((tab) => {
  tab.addEventListener("click", () => setTool(tab.dataset.toolTab));
});

document.querySelectorAll("[data-tool-form]").forEach((form) => {
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const handler = handlers[form.dataset.toolForm];
    if (!handler) return;
    handler(form);
    toolsOutput?.classList.remove("is-live");
    requestAnimationFrame(() => toolsOutput?.classList.add("is-live"));
  });
});

fetch("/api/public-config")
  .then((response) => response.json())
  .then((data) => {
    if (data.whatsappNumber) toolsWhatsappNumber = data.whatsappNumber;
  })
  .catch(() => {});

(function toolsCanvas() {
  const canvas = document.querySelector("#toolsHeroCanvas");
  const hero = document.querySelector(".tools-hero");
  if (!canvas || !hero) return;
  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let width = 0;
  let height = 0;
  let raf = 0;
  const nodes = Array.from({ length: 72 }, () => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.0008,
    vy: (Math.random() - 0.5) * 0.0006,
    r: 1 + Math.random() * 2,
    p: Math.random() * Math.PI * 2
  }));

  const resize = () => {
    const rect = hero.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = Math.max(1, Math.round(rect.width));
    height = Math.max(1, Math.round(rect.height));
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (time = 0) => {
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";
    const t = time / 1000;
    nodes.forEach((node, index) => {
      if (!reduceMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < 0) node.x = 1;
        if (node.x > 1) node.x = 0;
        if (node.y < 0) node.y = 1;
        if (node.y > 1) node.y = 0;
      }
      const x = (node.x + Math.cos(t * 0.2 + node.p) * 0.006) * width;
      const y = (node.y + Math.sin(t * 0.16 + node.p) * 0.006) * height;
      ctx.fillStyle = `rgba(255, 121, 15, ${0.12 + Math.sin(t + node.p) * 0.04})`;
      ctx.shadowColor = "rgba(255, 121, 15, 0.8)";
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.arc(x, y, node.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      for (let j = index + 6; j < nodes.length; j += 14) {
        const other = nodes[j];
        const ox = other.x * width;
        const oy = other.y * height;
        const distance = Math.hypot(x - ox, y - oy);
        if (distance > 180) continue;
        ctx.strokeStyle = `rgba(255, 121, 15, ${(1 - distance / 180) * 0.13})`;
        ctx.lineWidth = 0.7;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(ox, oy);
        ctx.stroke();
      }
    });
    if (!reduceMotion) raf = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  draw(0);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(raf));
})();
