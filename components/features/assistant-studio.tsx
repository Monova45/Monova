"use client";

import { FormEvent, useState } from "react";
import { Bot, Send, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

const initialMessages: Message[] = [{
  id: "welcome",
  role: "assistant",
  content: "Hola, soy Monova AI. Puedo ayudarte a crear campañas, copies, ideas y planes usando el contexto demo del workspace.",
}];

export function AssistantStudio() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const content = input.trim();
    if (!content || loading) return;

    const userMessage: Message = { id: crypto.randomUUID(), role: "user", content };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages.map(({ role, content: text }) => ({ role, content: text })) }),
      });
      const payload = await response.json() as { answer?: string; error?: string };
      if (!response.ok || !payload.answer) throw new Error(payload.error || "No se recibió respuesta.");
      setMessages((current) => [...current, { id: crypto.randomUUID(), role: "assistant", content: payload.answer! }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "No se pudo consultar el asistente.");
    } finally {
      setLoading(false);
    }
  }

  return <section className="live-assistant">
    <header><div><span><Bot size={18}/></span><div><h1>AI Assistant <small>OpenAI conectado</small></h1><p>Conversación real · Contexto empresarial en preparación</p></div></div><b className="live-dot">Activo</b></header>
    <div className="live-thread">
      {messages.map((message) => <article className={message.role} key={message.id}>
        {message.role === "assistant" && <span><Sparkles size={14}/></span>}
        <p>{message.content}</p>
      </article>)}
      {loading && <article className="assistant"><span><Sparkles size={14}/></span><p>Analizando…</p></article>}
    </div>
    {error && <p className="tool-error">{error}</p>}
    <form onSubmit={submit}><input value={input} onChange={(event) => setInput(event.target.value)} aria-label="Mensaje para Monova AI" placeholder="Pide una campaña, copy, idea o análisis…"/><button disabled={loading || !input.trim()} aria-label="Enviar"><Send size={17}/></button></form>
  </section>;
}
