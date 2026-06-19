let monovaWhatsAppNumber = "57XXXXXXXXXX";

const WHATSAPP_MESSAGE =
  "Hola Monova, hice el diagnóstico IA y quiero una propuesta personalizada para mi negocio.";

const diagnosticForm = document.querySelector("#diagnosticForm");
const diagnosticResult = document.querySelector("#diagnosticResult");
const diagnosticSubmit = document.querySelector(".diagnostic-submit");

const loaderSteps = [
  "Analizando presencia digital...",
  "Detectando oportunidades...",
  "Diseñando propuesta visual...",
  "Generando mockup conceptual..."
];

const resultLabels = [
  { key: "diseno", title: "Diseño", icon: "UX" },
  { key: "marketing", title: "Marketing", icon: "↗" },
  { key: "automatizacion", title: "Automatización", icon: "AI" },
  { key: "experienciaDigital", title: "Experiencia digital", icon: "◎" }
];

const getWhatsAppLink = () =>
  `https://wa.me/${monovaWhatsAppNumber}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;

const escapeDiagnosticHTML = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const renderList = (items = []) =>
  items
    .map((item) => `<li>${escapeDiagnosticHTML(item)}</li>`)
    .join("");

const renderTags = (items = []) =>
  items
    .map((item) => `<span>${escapeDiagnosticHTML(item)}</span>`)
    .join("");

const renderColors = (items = []) =>
  items
    .map((item) => {
      const color = escapeDiagnosticHTML(item);
      const safeColor = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(item) ? item : "#ff790f";
      return `<span><i style="--swatch: ${safeColor}"></i>${color}</span>`;
    })
    .join("");

const bindDiagnosticPanelLight = (root = document) => {
  if (window.matchMedia("(pointer: coarse)").matches) return;
  root
    .querySelectorAll(
      ".diagnostic-form, .diagnostic-guide, .diagnostic-result, .diagnostic-score, .diagnostic-recommendation, .diagnostic-proposal, .diagnostic-mockup, .diagnostic-final"
    )
    .forEach((panel) => {
      if (panel.dataset.diagnosticLightBound) return;
      panel.dataset.diagnosticLightBound = "true";
      panel.addEventListener(
        "pointermove",
        (event) => {
          const rect = panel.getBoundingClientRect();
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          panel.style.setProperty("--mx", `${x.toFixed(1)}%`);
          panel.style.setProperty("--my", `${y.toFixed(1)}%`);
        },
        { passive: true }
      );
    });
};

const setSubmitState = (isLoading) => {
  if (!diagnosticSubmit) return;
  diagnosticSubmit.disabled = isLoading;
  diagnosticSubmit.textContent = isLoading ? "Analizando..." : "Analizar mi negocio";
};

const renderLoader = () => {
  diagnosticResult.classList.remove("has-result");
  diagnosticResult.innerHTML = `
    <div class="diagnostic-loader" role="status">
      <span class="diagnostic-loader__orb">IA</span>
      <h2>Monova IA está trabajando en tu diagnóstico</h2>
      <div class="diagnostic-loader__steps">
        ${loaderSteps
          .map(
            (step, index) => `
              <p style="--delay: ${index * 0.28}s">
                <span></span>
                ${escapeDiagnosticHTML(step)}
              </p>
            `
          )
          .join("")}
      </div>
    </div>
  `;
};

const renderError = (message) => {
  diagnosticResult.classList.remove("has-result");
  diagnosticResult.innerHTML = `
    <div class="diagnostic-error">
      <span>!</span>
      <h2>No pudimos generar el diagnóstico</h2>
      <p>${escapeDiagnosticHTML(message || "Intenta nuevamente en unos minutos.")}</p>
      <button class="secondary-button" type="button" onclick="document.querySelector('#diagnosticForm')?.scrollIntoView({ behavior: 'smooth' })">Revisar datos</button>
    </div>
  `;
};

const renderDiagnostic = ({ diagnostico, propuesta, imagePrompt, mockupImageUrl }) => {
  const average = Math.round(
    (diagnostico.diseno +
      diagnostico.marketing +
      diagnostico.automatizacion +
      diagnostico.experienciaDigital) /
      4
  );

  const scoreCards = resultLabels
    .map(({ key, title, icon }) => {
      const value = diagnostico[key];
      return `
        <article class="diagnostic-score">
          <span class="diagnostic-score__icon">${icon}</span>
          <div class="diagnostic-score__top">
            <h3>${title}</h3>
            <strong>${value}%</strong>
          </div>
          <div class="diagnostic-bar" aria-label="${title}: ${value}%">
            <span style="--score: ${value}%"></span>
          </div>
        </article>
      `;
    })
    .join("");

  diagnosticResult.classList.remove("has-result");
  diagnosticResult.innerHTML = `
    <div class="diagnostic-result__content">
      <div class="diagnostic-result-heading">
        <h2>2. Tu diagnóstico + propuesta visual</h2>
        <span>Generado por IA</span>
      </div>

      <div class="diagnostic-overview">
        <div class="diagnostic-total" style="--score: ${average}%">
          <strong>${average}</strong>
          <small>/100</small>
          <span>Puntuación general</span>
        </div>
        <div class="diagnostic-score-grid">
          ${scoreCards}
        </div>
      </div>

      <section class="diagnostic-recommendation">
        <p class="section-kicker">Recomendación Monova</p>
        <p>${escapeDiagnosticHTML(diagnostico.resumen)}</p>
        <div class="diagnostic-insight-grid">
          <div>
            <h3>Problemas detectados</h3>
            <ul>${renderList(diagnostico.problemasDetectados)}</ul>
          </div>
          <div>
            <h3>Acciones recomendadas</h3>
            <ul>${renderList(diagnostico.recomendaciones)}</ul>
          </div>
        </div>
        <div class="diagnostic-services" aria-label="Servicios sugeridos">
          ${renderTags(diagnostico.serviciosSugeridos)}
        </div>
      </section>

      <section class="diagnostic-proposal">
        <div>
          <p class="section-kicker">Propuesta Monova</p>
          <h3>${escapeDiagnosticHTML(propuesta.concepto)}</h3>
          <p>${escapeDiagnosticHTML(propuesta.estiloVisual)}</p>
          <blockquote>${escapeDiagnosticHTML(propuesta.copyHero)}</blockquote>
        </div>
        <div class="diagnostic-proposal__grid">
          <article>
            <h4>Estructura recomendada</h4>
            <ol>${renderList(propuesta.estructuraRecomendada)}</ol>
          </article>
          <article>
            <h4>Funcionalidades</h4>
            <ul>${renderList(propuesta.funcionalidades)}</ul>
          </article>
        </div>
        <div class="diagnostic-colors" aria-label="Paleta sugerida">
          ${renderColors(propuesta.colores)}
        </div>
      </section>

      <section class="diagnostic-mockup">
        <div>
          <p class="section-kicker">Mockup visual</p>
          <h3>Propuesta visual conceptual</h3>
          <p>Vista conceptual generada por IA para inspirar la nueva presencia digital de tu negocio.</p>
        </div>
        <figure>
          <img src="${mockupImageUrl}" alt="Mockup conceptual generado por IA para el negocio diagnosticado" loading="lazy" />
          <figcaption>${escapeDiagnosticHTML(imagePrompt)}</figcaption>
        </figure>
      </section>

      <section class="diagnostic-final">
        <h3>¿Quieres que Monova lo mejore por ti?</h3>
        <p>Podemos convertir este diagnóstico en una propuesta personalizada con estrategia, diseño, automatización e implementación.</p>
        <a class="primary-button" href="${getWhatsAppLink()}" target="_blank" rel="noopener">Quiero una propuesta personalizada</a>
      </section>
    </div>
  `;

  requestAnimationFrame(() => diagnosticResult.classList.add("has-result"));
  bindDiagnosticPanelLight(diagnosticResult);
};

const getPublicConfig = async () => {
  try {
    const response = await fetch("/api/public-config");
    const data = await response.json();
    if (data.whatsappNumber) monovaWhatsAppNumber = data.whatsappNumber;
  } catch {
    monovaWhatsAppNumber = "57XXXXXXXXXX";
  }
};

diagnosticForm?.addEventListener("submit", async (event) => {
  event.preventDefault();

  const formData = new FormData(diagnosticForm);
  const lead = {
    nombre: String(formData.get("nombre") || "").trim(),
    whatsapp: String(formData.get("whatsapp") || "").trim(),
    tipoNegocio: String(formData.get("tipoNegocio") || "").trim(),
    url: String(formData.get("url") || "").trim(),
    descripcion: String(formData.get("descripcion") || "").trim(),
    objetivo: String(formData.get("objetivo") || "").trim()
  };

  renderLoader();
  setSubmitState(true);
  diagnosticResult?.scrollIntoView({ behavior: "smooth", block: "nearest" });

  try {
    const response = await fetch("/api/diagnostico-visual", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(lead)
    });
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || "No pudimos generar el diagnóstico ahora.");
    }

    const supabaseReadyLead = {
      lead,
      diagnostico: data.diagnostico,
      propuesta: data.propuesta,
      imagePrompt: data.imagePrompt,
      mockupImageUrl: data.mockupImageUrl,
      fecha: new Date().toISOString()
    };

    // Futuro Supabase:
    // await supabase.from("diagnosticos_ia").insert(supabaseReadyLead);
    console.log("Monova diagnostic visual lead", {
      ...supabaseReadyLead,
      mockupImageUrl: `${String(data.mockupImageUrl || "").slice(0, 120)}...`
    });

    renderDiagnostic(data);
  } catch (error) {
    renderError(error.message);
  } finally {
    setSubmitState(false);
  }
});

getPublicConfig();
bindDiagnosticPanelLight();

(function diagnosticWowEffects() {
  const page = document.querySelector(".diagnostic-page");
  if (!page) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!window.matchMedia("(pointer: coarse)").matches) {
    window.addEventListener(
      "pointermove",
      (event) => {
        document.documentElement.style.setProperty("--diag-x", `${Math.round((event.clientX / window.innerWidth) * 100)}%`);
        document.documentElement.style.setProperty("--diag-y", `${Math.round((event.clientY / window.innerHeight) * 100)}%`);
      },
      { passive: true }
    );
  }

  const hero = document.querySelector(".diagnostic-hero");
  if (hero && !window.matchMedia("(pointer: coarse)").matches) {
    hero.addEventListener(
      "pointermove",
      (event) => {
        const rect = hero.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - 0.5;
        const y = (event.clientY - rect.top) / rect.height - 0.5;
        hero.style.backgroundPosition = `${62 + x * 2}% ${50 + y * 2}%`;
      },
      { passive: true }
    );
    hero.addEventListener("pointerleave", () => {
      hero.style.backgroundPosition = "";
    });
  }

  const canvas = document.createElement("canvas");
  canvas.className = "diagnostic-particle-field";
  canvas.setAttribute("aria-hidden", "true");
  page.prepend(canvas);

  const context = canvas.getContext("2d");
  if (!context) return;

  let width = 0;
  let height = 0;
  let rafId = 0;
  const count = window.innerWidth < 700 ? 42 : 132;
  const nodes = Array.from({ length: count }, (_, index) => ({
    x: Math.random(),
    y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00042,
    vy: (Math.random() - 0.5) * 0.00034,
    size: 0.7 + Math.random() * 1.6,
    phase: Math.random() * Math.PI * 2,
    link: index % 4 === 0
  }));

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const draw = (time = 0) => {
    context.clearRect(0, 0, width, height);
    context.save();
    context.globalCompositeOperation = "lighter";
    const t = time / 1000;

    nodes.forEach((node, index) => {
      if (!reduceMotion) {
        node.x += node.vx;
        node.y += node.vy;
        if (node.x < -0.04) node.x = 1.04;
        if (node.x > 1.04) node.x = -0.04;
        if (node.y < -0.04) node.y = 1.04;
        if (node.y > 1.04) node.y = -0.04;
      }

      const px = (node.x + Math.cos(t * 0.18 + node.phase) * 0.004) * width;
      const py = (node.y + Math.sin(t * 0.14 + node.phase) * 0.004) * height;
      const alpha = 0.09 + Math.sin(t + node.phase) * 0.035;

      context.fillStyle = `rgba(255, 121, 15, ${alpha})`;
      context.shadowColor = "rgba(255, 121, 15, 0.7)";
      context.shadowBlur = 10;
      context.fillRect(px, py, node.size * 4.8, node.size * 1.25);
      context.shadowBlur = 0;

      if (!node.link) return;
      for (let j = index + 9; j < nodes.length; j += 19) {
        const other = nodes[j];
        const ox = other.x * width;
        const oy = other.y * height;
        const distance = Math.hypot(px - ox, py - oy);
        if (distance > 170) continue;
        context.strokeStyle = `rgba(255, 121, 15, ${(1 - distance / 170) * 0.095})`;
        context.lineWidth = 0.6;
        context.beginPath();
        context.moveTo(px, py);
        context.lineTo(ox, oy);
        context.stroke();
      }
    });

    context.restore();
    if (!reduceMotion) rafId = requestAnimationFrame(draw);
  };

  resize();
  window.addEventListener("resize", resize, { passive: true });
  draw(0);
  window.addEventListener("beforeunload", () => cancelAnimationFrame(rafId));
})();
