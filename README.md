# MONOVA

<p align="center">
  <strong>AI Software Studio · Enterprise Automation</strong>
</p>

<p align="center">
  Sistemas de IA con estética premium y poder real. Creamos agentes inteligentes, plataformas a medida y automatizaciones para empresas que quieren operar más rápido, vender mejor y verse inolvidables.
</p>

---

## ✨ Descripción

MONOVA es un estudio digital que combina **software**, **diseño**, **branding** e **inteligencia artificial**. Este repositorio contiene el sitio web oficial: una oficina holográfica interactiva de una sola página con un asistente AI integrado que diagnostica necesidades de negocio y propone soluciones personalizadas.

### 🚀 Stack Tecnológico

| Categoría | Tecnologías |
|-----------|-------------|
| **Framework** | Next.js (App Router) |
| **UI** | React, TypeScript, Tailwind CSS, Framer Motion |
| **AI** | OpenAI Responses API (`gpt-4.1-mini`) + generación de imágenes (`gpt-image-1`) |
| **Tipografía** | Inter, Space Grotesk (Google Fonts) |
| **Despliegue** | Vercel |

---

## 🛠️ Instalación

```bash
# 1. Clonar el repositorio
git clone https://github.com/Monova45/Monova.git
cd Monova

# 2. Instalar dependencias
npm install

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tu OPENAI_API_KEY

# 4. Iniciar servidor de desarrollo
npm run dev
# → http://localhost:3000
```

## 🔐 Variables de Entorno

| Variable | Descripción | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | API key de OpenAI | — |
| `OPENAI_MODEL` | Modelo de texto de OpenAI | `gpt-4.1-mini` |
| `OPENAI_IMAGE_MODEL` | Modelo de imágenes de OpenAI | `gpt-image-1` |

## 📁 Estructura

```
Monova/
├── app/
│   ├── api/
│   │   ├── chat/route.ts               # Chat asistente Monova
│   │   └── diagnostico-visual/route.ts # Diagnóstico + mockup con IA
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   └── office-experience.tsx  # Componente principal (oficina holográfica)
├── public/
│   ├── assets/       # Imágenes, SVGs, video
│   └── images/       # Imagen de la oficina
└── package.json
```

## 🤖 API Endpoints

### `POST /api/chat`
Chat asistente con contexto comercial de MONOVA.

```json
{
  "messages": [
    { "role": "user", "content": "Necesito un sistema de inventario" }
  ]
}
```

### `POST /api/diagnostico-visual`
Analiza la web de un cliente y genera un diagnóstico con propuesta visual (incluye mockup generado por IA).

```json
{
  "nombre": "...",
  "whatsapp": "...",
  "tipoNegocio": "...",
  "url": "https://ejemplo.com",
  "descripcion": "...",
  "objetivo": "vender mas"
}
```

---

<p align="center">
  Hecho con ♠ por <strong>MONOVA</strong><br>
  <sub>Código. Diseño. Inteligencia. Pasión.</sub>
</p>
