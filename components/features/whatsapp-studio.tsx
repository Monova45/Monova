"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Check,
  CheckCheck,
  ChevronDown,
  Copy,
  Inbox,
  Link2Off,
  LoaderCircle,
  LogIn,
  Megaphone,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Phone,
  Plus,
  QrCode,
  RefreshCw,
  Rocket,
  Search,
  Send,
  Settings2,
  Sparkles,
  SlidersHorizontal,
  Users,
  Webhook,
} from "lucide-react";

type Status = {
  configured: boolean;
  webhookConfigured: boolean;
  phoneNumberId: string | null;
  businessAccountId: string | null;
  source?: "facebook" | "environment";
  profile?: { displayPhoneNumber: string; verifiedName: string; qualityRating: string | null };
  error?: string;
};

type MetaConfig = { ready: boolean; appId: string | null; configId: string | null; missing: string[] };
type SignupData = { phoneNumberId: string; businessAccountId: string };
type KommoStatus = {
  configured: boolean;
  crmAccess?: boolean;
  chatAccess?: boolean;
  chatAccessReason?: string;
  account?: { name: string; subdomain: string; country: string };
  error?: string;
};
type WatiConversation = {
  id: string;
  target: string;
  name: string;
  lastMessage: string;
  lastMessageAt?: string | number | null;
  unread?: boolean;
  messages: Array<{ id: string; text: string; outgoing: boolean; timestamp: string | number | null }>;
};
type WatiInbox = { configured: boolean; contactCount?: number; conversations: WatiConversation[]; error?: string };
type LeadStatus = "new" | "interested" | "follow_up" | "no_response" | "not_interested";
type LeadInfo = { status: LeadStatus; reason: string };
type InboxView = "active" | "mine" | "unassigned";

const leadStatusOptions: Array<{ value: LeadStatus; label: string }> = [
  { value: "new", label: "Nuevo" },
  { value: "interested", label: "Interesado" },
  { value: "follow_up", label: "Seguimiento" },
  { value: "no_response", label: "No respondió" },
  { value: "not_interested", label: "No interesado" },
];

function leadStatusLabel(status?: LeadStatus) {
  return leadStatusOptions.find((option) => option.value === status)?.label || "Sin clasificar";
}

function formatWatiTime(value: string | number | null | undefined) {
  if (!value) return "";
  let date: Date;
  if (typeof value === "number" || /^\d+$/.test(value)) {
    const numeric = Number(value);
    date = new Date(numeric < 10_000_000_000 ? numeric * 1000 : numeric);
  } else {
    date = new Date(value);
  }
  return Number.isNaN(date.getTime()) ? "" : date.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
}

declare global {
  interface Window {
    fbAsyncInit?: () => void;
    FB?: {
      init: (options: { appId: string; autoLogAppEvents: boolean; xfbml: boolean; version: string }) => void;
      login: (
        callback: (response: { authResponse?: { code?: string } }) => void,
        options: Record<string, unknown>,
      ) => void;
    };
  }
}

export function WhatsAppStudio() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [kind, setKind] = useState<"template" | "text">("template");
  const [to, setTo] = useState("");
  const [message, setMessage] = useState("Hola, este es un mensaje de prueba enviado desde Monova.");
  const [template, setTemplate] = useState("hello_world");
  const [language, setLanguage] = useState("en_US");
  const [result, setResult] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [metaConfig, setMetaConfig] = useState<MetaConfig | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [kommo, setKommo] = useState<KommoStatus | null>(null);
  const [wati, setWati] = useState<WatiInbox | null>(null);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [inboxView, setInboxView] = useState<InboxView>("active");
  const [chatAssignments, setChatAssignments] = useState<Record<string, "me">>(() => {
    if (typeof window === "undefined") return {};
    try {
      return JSON.parse(window.localStorage.getItem("monova-wa-chat-assignments") || "{}") as Record<string, "me">;
    } catch {
      return {};
    }
  });
  const [reply, setReply] = useState("");
  const [chatSearch, setChatSearch] = useState("");
  const [leadFilter, setLeadFilter] = useState<"all" | LeadStatus>("all");
  const [leadClassifications, setLeadClassifications] = useState<Record<string, LeadInfo>>({});
  const [classifying, setClassifying] = useState(false);
  const [newConversationOpen, setNewConversationOpen] = useState(false);
  const [newTarget, setNewTarget] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [aiEnabled, setAiEnabled] = useState(false);
  const [aiReplying, setAiReplying] = useState(false);
  const [aiActivity, setAiActivity] = useState("Esperando mensajes nuevos");
  const [recoveryNonce, setRecoveryNonce] = useState(0);
  const signupDataRef = useRef<SignupData | null>(null);
  const signupCodeRef = useRef<string | null>(null);
  const seenIncomingRef = useRef(new Set<string>());
  const aiInitializedRef = useRef(false);
  const classificationStartedRef = useRef(false);
  const webhookUrl = `${typeof window === "undefined" ? "" : window.location.origin}/api/whatsapp/webhook`;

  async function refresh() {
    setLoading(true);
    try {
      const response = await fetch("/api/whatsapp/status", { cache: "no-store" });
      const data = await response.json() as Status;
      setStatus(data);
    } catch {
      setStatus({ configured: false, webhookConfigured: false, phoneNumberId: null, businessAccountId: null, error: "No se pudo consultar el servidor." });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    fetch("/api/whatsapp/status", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<Status>)
      .then((data) => { if (active) setStatus(data); })
      .catch(() => { if (active) setStatus({ configured: false, webhookConfigured: false, phoneNumberId: null, businessAccountId: null, error: "No se pudo consultar el servidor." }); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!wati?.configured) return;
    const interval = window.setInterval(() => void refreshWati(), 12_000);
    return () => window.clearInterval(interval);
  }, [wati?.configured]);

  useEffect(() => {
    const stored = window.localStorage.getItem("peluvi-ai-enabled");
    setAiEnabled(stored === null ? true : stored === "true");
    const seenVersion = window.localStorage.getItem("peluvi-ai-seen-version");
    const savedSeenMessages = seenVersion === "2" ? window.localStorage.getItem("peluvi-ai-seen-messages") : null;
    if (seenVersion !== "2") {
      seenIncomingRef.current = new Set();
      window.localStorage.setItem("peluvi-ai-seen-version", "2");
      window.localStorage.removeItem("peluvi-ai-seen-messages");
    }
    if (savedSeenMessages) {
      try {
        const ids = JSON.parse(savedSeenMessages) as string[];
        seenIncomingRef.current = new Set(Array.isArray(ids) ? ids.slice(-500) : []);
      } catch { /* Ignore invalid local data. */ }
    }
    const savedClassifications = window.localStorage.getItem("peluvi-lead-classifications");
    if (savedClassifications) {
      try { setLeadClassifications(JSON.parse(savedClassifications) as Record<string, LeadInfo>); } catch { /* Ignore invalid local data. */ }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("peluvi-lead-classifications", JSON.stringify(leadClassifications));
  }, [leadClassifications]);

  useEffect(() => {
    window.localStorage.setItem("peluvi-ai-enabled", String(aiEnabled));
    if (!aiEnabled) {
      aiInitializedRef.current = false;
      setAiActivity("Pausado");
    }
  }, [aiEnabled]);

  function rememberIncomingMessage(id: string) {
    seenIncomingRef.current.add(id);
    const recentIds = Array.from(seenIncomingRef.current).slice(-500);
    window.localStorage.setItem("peluvi-ai-seen-messages", JSON.stringify(recentIds));
  }

  useEffect(() => {
    if (!aiEnabled || !wati?.configured || aiReplying) return;
    const incoming = wati.conversations.flatMap((conversation) =>
      conversation.messages.filter((message) => !message.outgoing).map((message) => ({ conversation, message })));
    if (!aiInitializedRef.current) {
      aiInitializedRef.current = true;
      setAiActivity(seenIncomingRef.current.size ? "Esperando mensajes nuevos" : "Revisando mensajes pendientes…");
    }
    const pending = incoming.find(({ conversation, message }) => {
      const latest = conversation.messages[conversation.messages.length - 1];
      return latest?.id === message.id && !seenIncomingRef.current.has(message.id);
    });
    if (!pending) return;
    rememberIncomingMessage(pending.message.id);
    setAiReplying(true);
    setAiActivity(`Respondiendo a ${pending.conversation.name}…`);
    fetch("/api/wati/ai/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: pending.conversation.target,
        messages: pending.conversation.messages.slice(-12).map((message) => ({ text: message.text, outgoing: message.outgoing })),
      }),
    })
      .then(async (response) => {
        const data = await response.json() as { error?: string };
        if (!response.ok) throw new Error(data.error || "No se pudo responder.");
        setAiActivity(`Respuesta enviada a ${pending.conversation.name}`);
        await refreshWati();
      })
      .catch((error) => setAiActivity(error instanceof Error ? error.message : "La IA no pudo responder"))
      .finally(() => setAiReplying(false));
  }, [aiEnabled, aiReplying, recoveryNonce, wati]);

  function recoverPendingMessages() {
    seenIncomingRef.current = new Set();
    aiInitializedRef.current = true;
    window.localStorage.removeItem("peluvi-ai-seen-messages");
    setAiActivity("Revisando mensajes pendientes…");
    setRecoveryNonce((value) => value + 1);
  }

  async function refreshWati(retry = true) {
    const response = await fetch("/api/wati/inbox", { cache: "no-store" });
    let data = await response.json() as WatiInbox;
    if (retry && data.configured && (data.contactCount || 0) > 0 && !data.conversations.length) {
      await new Promise((resolve) => window.setTimeout(resolve, 1200));
      const secondResponse = await fetch("/api/wati/inbox", { cache: "no-store" });
      data = await secondResponse.json() as WatiInbox;
    }
    setWati((current) => {
      if (data.configured && !data.conversations.length && current?.conversations.length) return current;
      return data;
    });
    setSelectedChat((current) => current || data.conversations[0]?.id || null);
  }

  useEffect(() => {
    let active = true;
    fetch("/api/wati/inbox", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<WatiInbox>)
      .then(async (firstData) => {
        if (!active) return;
        let data = firstData;
        if (data.configured && (data.contactCount || 0) > 0 && !data.conversations.length) {
          await new Promise((resolve) => window.setTimeout(resolve, 1200));
          const retryResponse = await fetch("/api/wati/inbox", { cache: "no-store" });
          data = await retryResponse.json() as WatiInbox;
        }
        if (!active) return;
        setWati(data);
        setSelectedChat(data.conversations[0]?.id || null);
      })
      .catch(() => { if (active) setWati({ configured: false, conversations: [], error: "No se pudo consultar WATI." }); });
    return () => { active = false; };
  }, []);

  async function sendWatiReply(event: FormEvent) {
    event.preventDefault();
    const conversation = wati?.conversations.find((item) => item.id === selectedChat);
    if (!conversation || !reply.trim()) return;
    setSending(true);
    const response = await fetch("/api/wati/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: conversation.target, text: reply }),
    });
    const data = await response.json() as { error?: string };
    if (response.ok) {
      setReply("");
      await refreshWati();
    } else setResult({ type: "error", text: data.error || "No se pudo enviar." });
    setSending(false);
  }

  async function startWatiConversation(event: FormEvent) {
    event.preventDefault();
    if (!newTarget.trim() || !newMessage.trim()) return;
    setSending(true);
    setResult(null);
    const response = await fetch("/api/wati/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ target: newTarget.replace(/\D/g, ""), text: newMessage }),
    });
    const data = await response.json() as { error?: string; info?: string };
    if (response.ok) {
      setResult({ type: "ok", text: data.info || "Mensaje enviado correctamente." });
      setNewConversationOpen(false);
      setNewTarget("");
      setNewMessage("");
      await refreshWati();
    } else {
      setResult({ type: "error", text: data.error || "No se pudo iniciar la conversación. Si pasaron más de 24 horas, debes usar una plantilla aprobada." });
    }
    setSending(false);
  }

  async function suggestAiReply() {
    if (!selectedConversation?.messages.length) return;
    setAiReplying(true);
    setAiActivity(`Preparando respuesta para ${selectedConversation.name}…`);
    const response = await fetch("/api/wati/ai/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: selectedConversation.target,
        preview: true,
        messages: selectedConversation.messages.slice(-12).map((item) => ({ text: item.text, outgoing: item.outgoing })),
      }),
    });
    const data = await response.json() as { answer?: string; error?: string };
    if (response.ok && data.answer) {
      setReply(data.answer);
      setAiActivity("Sugerencia lista para revisar");
    } else {
      setAiActivity(data.error || "No se pudo preparar la respuesta");
    }
    setAiReplying(false);
  }

  async function classifyLeads() {
    if (!wati?.conversations.length || classifying) return;
    setClassifying(true);
    const response = await fetch("/api/wati/ai/classify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        conversations: wati.conversations.map((conversation) => ({
          id: conversation.id,
          name: conversation.name,
          messages: conversation.messages.slice(-12).map((item) => ({ text: item.text, outgoing: item.outgoing })),
        })),
      }),
    });
    const data = await response.json() as {
      classifications?: Array<{ id: string; status: LeadStatus; reason?: string }>;
      error?: string;
    };
    if (response.ok && data.classifications) {
      setLeadClassifications((current) => {
        const next = { ...current };
        data.classifications?.forEach((item) => {
          next[item.id] = { status: item.status, reason: item.reason || "Clasificado por Peluvi IA" };
        });
        return next;
      });
      setAiActivity(`${data.classifications.length} conversaciones clasificadas`);
    } else {
      setAiActivity(data.error || "No se pudieron clasificar los chats");
    }
    setClassifying(false);
  }

  useEffect(() => {
    if (!wati?.conversations.length || classificationStartedRef.current) return;
    classificationStartedRef.current = true;
    const timeout = window.setTimeout(() => void classifyLeads(), 800);
    return () => window.clearTimeout(timeout);
  }, [wati?.conversations.length]);

  function updateLeadStatus(id: string, status: LeadStatus) {
    setLeadClassifications((current) => ({
      ...current,
      [id]: { status, reason: "Clasificación ajustada manualmente" },
    }));
  }

  useEffect(() => {
    fetch("/api/kommo/status", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<KommoStatus>)
      .then(setKommo)
      .catch(() => setKommo({ configured: false, error: "No se pudo consultar Kommo." }));
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/whatsapp/embedded-signup/config", { cache: "no-store" })
      .then(async (response) => response.json() as Promise<MetaConfig>)
      .then((config) => {
        if (!active) return;
        setMetaConfig(config);
        if (!config.ready || !config.appId || document.getElementById("facebook-jssdk")) return;
        window.fbAsyncInit = () => window.FB?.init({ appId: config.appId!, autoLogAppEvents: true, xfbml: true, version: "v23.0" });
        const script = document.createElement("script");
        script.id = "facebook-jssdk";
        script.async = true;
        script.defer = true;
        script.crossOrigin = "anonymous";
        script.src = "https://connect.facebook.net/es_LA/sdk.js";
        document.body.appendChild(script);
      })
      .catch(() => setMetaConfig({ ready: false, appId: null, configId: null, missing: ["META_APP_ID", "META_LOGIN_CONFIG_ID"] }));
    return () => { active = false; };
  }, []);

  useEffect(() => {
    function receiveMetaMessage(event: MessageEvent) {
      if (!event.origin.endsWith("facebook.com")) return;
      let payload: unknown = event.data;
      if (typeof payload === "string") {
        try { payload = JSON.parse(payload); } catch { return; }
      }
      const message = payload as { type?: string; event?: string; data?: { phone_number_id?: string; waba_id?: string } };
      if (message.type !== "WA_EMBEDDED_SIGNUP") return;
      if (message.event === "FINISH" && message.data?.phone_number_id && message.data.waba_id) {
        signupDataRef.current = { phoneNumberId: message.data.phone_number_id, businessAccountId: message.data.waba_id };
        void completeEmbeddedSignup();
      } else if (message.event === "CANCEL" || message.event === "ERROR") {
        setConnecting(false);
        setResult({ type: "error", text: message.event === "CANCEL" ? "La conexión fue cancelada." : "Meta no pudo completar la conexión." });
      }
    }
    window.addEventListener("message", receiveMetaMessage);
    return () => window.removeEventListener("message", receiveMetaMessage);
  });

  async function completeEmbeddedSignup() {
    const code = signupCodeRef.current;
    const signup = signupDataRef.current;
    if (!code || !signup) return;
    signupCodeRef.current = null;
    signupDataRef.current = null;
    try {
      const response = await fetch("/api/whatsapp/embedded-signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, ...signup }),
      });
      const data = await response.json() as { error?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo guardar la conexión.");
      setResult({ type: "ok", text: "WhatsApp Business quedó conectado correctamente." });
      await refresh();
    } catch (error) {
      setResult({ type: "error", text: error instanceof Error ? error.message : "No se pudo conectar." });
    } finally {
      setConnecting(false);
    }
  }

  function connectWithFacebook() {
    if (!metaConfig?.ready || !metaConfig.configId || !window.FB) {
      setResult({ type: "error", text: "La aplicación de Meta todavía no está configurada o el SDK sigue cargando." });
      return;
    }
    setConnecting(true);
    setResult(null);
    window.FB.login((response) => {
      const code = response.authResponse?.code;
      if (!code) {
        setConnecting(false);
        setResult({ type: "error", text: "Facebook no autorizó la conexión." });
        return;
      }
      signupCodeRef.current = code;
      void completeEmbeddedSignup();
    }, {
      config_id: metaConfig.configId,
      response_type: "code",
      override_default_response_type: true,
      extras: { feature: "whatsapp_embedded_signup", sessionInfoVersion: "3" },
    });
  }

  async function disconnect() {
    await fetch("/api/whatsapp/embedded-signup", { method: "DELETE" });
    setResult(null);
    await refresh();
  }

  async function send(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setResult(null);
    try {
      const body = kind === "text" ? { kind, to, message } : { kind, to, template, language };
      const response = await fetch("/api/whatsapp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await response.json() as { error?: string; messageId?: string };
      if (!response.ok) throw new Error(data.error || "No se pudo enviar.");
      setResult({ type: "ok", text: `Mensaje aceptado por WhatsApp · ${data.messageId || "ID pendiente"}` });
    } catch (error) {
      setResult({ type: "error", text: error instanceof Error ? error.message : "No se pudo enviar." });
    } finally {
      setSending(false);
    }
  }

  function toggleChatAssignment(conversationId: string) {
    setChatAssignments((current) => {
      const next = { ...current };
      if (next[conversationId] === "me") delete next[conversationId];
      else next[conversationId] = "me";
      window.localStorage.setItem("monova-wa-chat-assignments", JSON.stringify(next));
      return next;
    });
  }

  const visibleConversations = (wati?.conversations || []).filter((conversation) => {
    const query = chatSearch.trim().toLowerCase();
    const matchesSearch = !query || conversation.name.toLowerCase().includes(query) || conversation.target.includes(query);
    const matchesFilter = leadFilter === "all" || leadClassifications[conversation.id]?.status === leadFilter;
    const isAssignedToMe = chatAssignments[conversation.id] === "me";
    const matchesView = inboxView === "active" || (inboxView === "mine" && isAssignedToMe) || (inboxView === "unassigned" && !isAssignedToMe);
    return matchesSearch && matchesFilter && matchesView;
  });
  const selectedConversation = wati?.conversations.find((item) => item.id === selectedChat);
  const isConnected = Boolean(status?.configured || kommo?.configured || wati?.configured);
  const inboxViewLabel = inboxView === "mine" ? "Asignados a mí" : inboxView === "unassigned" ? "Sin asignar" : "Chats activos";

  return <section className="whatsapp-studio wa-workspace">
    <header className="wa-topbar">
      <div>
        <div className="wa-title-row"><h1>WhatsApp</h1><span className={isConnected ? "connected-badge" : "pending-badge"}>{loading ? "VALIDANDO…" : wati?.configured ? "CONECTADO" : status?.configured ? "CONECTADO" : kommo?.configured ? "KOMMO" : "SIN CONEXIÓN"}</span></div>
        <p>Gestiona tus conversaciones desde un solo lugar.</p>
      </div>
      <div className="wa-top-actions">
        <button type="button" className={`wa-ai-toggle ${aiEnabled ? "active" : ""}`} onClick={() => setAiEnabled((value) => !value)} title={aiActivity}>
          <Sparkles size={16}/><span>Peluvi IA</span><i/>
        </button>
        <button type="button" className="wa-classify-action" onClick={() => void classifyLeads()} disabled={classifying || !wati?.conversations.length}>
          {classifying ? <LoaderCircle className="spin" size={15}/> : <SlidersHorizontal size={15}/>} <span>Clasificar</span>
        </button>
        <button type="button" className="wa-icon-button" onClick={() => void refreshWati()} aria-label="Actualizar conversaciones"><RefreshCw size={17}/></button>
        <button type="button" className="wa-primary-action" onClick={() => setNewConversationOpen(true)}><Plus size={17}/> Nueva conversación</button>
      </div>
    </header>

    <div className={`wa-inbox-shell ${selectedConversation ? "mobile-chat-open" : ""}`}>
      <aside className="wa-channel-panel">
        <div className="wa-panel-title"><strong>Bandeja de entrada</strong><button type="button" aria-label="Ajustes"><Settings2 size={16}/></button></div>
        <small>CANALES</small>
        <button type="button" className="active"><MessageCircle size={17}/><span>WhatsApp</span><em>{wati?.conversations.length || 0}</em></button>
        <button type="button"><Inbox size={17}/><span>Todos los chats</span></button>
        <div className="wa-channel-divider"/>
        <small>VISTAS</small>
        <button type="button" className={inboxView === "active" ? "active-soft" : ""} onClick={() => setInboxView("active")}><MessageCircle size={16}/><span>Chats activos</span></button>
        <button type="button" className={inboxView === "mine" ? "active-soft" : ""} onClick={() => setInboxView("mine")}><Users size={16}/><span>Asignados a mí</span></button>
        <button type="button" className={inboxView === "unassigned" ? "active-soft" : ""} onClick={() => setInboxView("unassigned")}><Users size={16}/><span>Sin asignar</span></button>
        <div className="wa-channel-health"><span><Check size={13}/></span><div><strong>WATI conectado</strong><small>Canal funcionando</small></div></div>
      </aside>

      <aside className="wa-chat-list">
        <div className="wa-chat-list-head">
          <div><strong>{inboxViewLabel}</strong><ChevronDown size={15}/></div>
          <span>{visibleConversations.length} conversaciones</span>
        </div>
        <div className="wa-search-row">
          <label><Search size={15}/><input value={chatSearch} onChange={(event) => setChatSearch(event.target.value)} placeholder="Buscar conversación"/></label>
          <button type="button" aria-label="Filtrar"><SlidersHorizontal size={16}/></button>
        </div>
        <div className="wa-filter-tabs wa-lead-filters">
          <button type="button" className={leadFilter === "all" ? "active" : ""} onClick={() => setLeadFilter("all")}>Todos</button>
          {leadStatusOptions.map((option) =>
            <button type="button" key={option.value} className={`${leadFilter === option.value ? "active" : ""} status-${option.value}`} onClick={() => setLeadFilter(option.value)}>{option.label}</button>)}
        </div>
        <div className="wa-conversation-list">
          {visibleConversations.map((conversation) => <button type="button" className={`${selectedChat === conversation.id ? "active" : ""} lead-${leadClassifications[conversation.id]?.status || "unclassified"}`} onClick={() => setSelectedChat(conversation.id)} key={conversation.id}>
            <span className="wa-avatar">{conversation.name.slice(0, 2).toUpperCase()}</span>
            <span><strong>{conversation.name}</strong><small>{conversation.lastMessage || "Nueva conversación"}</small><span className="wa-chat-badges"><em className={`wa-lead-badge status-${leadClassifications[conversation.id]?.status || "unclassified"}`}>{leadStatusLabel(leadClassifications[conversation.id]?.status)}</em>{chatAssignments[conversation.id] === "me" && <em className="wa-assigned-badge">Para mí</em>}</span></span>
            <time>{formatWatiTime(conversation.lastMessageAt)}</time>
          </button>)}
          {!visibleConversations.length && <div className="wa-list-empty"><MessageCircle size={22}/><strong>{inboxView === "mine" ? "No tienes chats asignados" : inboxView === "unassigned" ? "No hay chats sin asignar" : "No hay chats todavía"}</strong><span>{inboxView === "mine" ? "Abre un chat y pulsa “Asignar a mí”." : "Los mensajes nuevos aparecerán aquí."}</span></div>}
        </div>
      </aside>

      <main className="wa-conversation-stage">
        {selectedConversation ? <>
          <header className="wa-conversation-head">
            <button type="button" className="wa-mobile-back" onClick={() => setSelectedChat(null)} aria-label="Volver a conversaciones"><ArrowLeft size={18}/></button>
            <div className="wa-contact"><span className="wa-avatar">{selectedConversation.name.slice(0, 2).toUpperCase()}</span><div><strong>{selectedConversation.name}</strong><small><i/> WhatsApp · {selectedConversation.target}</small></div></div>
            <div className="wa-lead-control">
              <button type="button" className={`wa-assignment-button ${chatAssignments[selectedConversation.id] === "me" ? "assigned" : ""}`} onClick={() => toggleChatAssignment(selectedConversation.id)}>
                <Users size={14}/>{chatAssignments[selectedConversation.id] === "me" ? "Quitar asignación" : "Asignar a mí"}
              </button>
              <select value={leadClassifications[selectedConversation.id]?.status || "new"} onChange={(event) => updateLeadStatus(selectedConversation.id, event.target.value as LeadStatus)} aria-label="Clasificación del contacto">
                {leadStatusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
              <button type="button" aria-label="Llamar"><Phone size={17}/></button><button type="button" aria-label="Más opciones"><MoreHorizontal size={19}/></button>
            </div>
          </header>
          {leadClassifications[selectedConversation.id]?.reason && <div className={`wa-lead-reason status-${leadClassifications[selectedConversation.id].status}`}><Sparkles size={13}/><strong>{leadStatusLabel(leadClassifications[selectedConversation.id].status)}:</strong> {leadClassifications[selectedConversation.id].reason}</div>}
          <div className="wa-message-canvas">
            <div className="wa-day-pill">Hoy</div>
            {selectedConversation.messages.map((item) => <div className={`wa-message ${item.outgoing ? "outgoing" : "incoming"}`} key={item.id}>
              <p>{item.text}</p>
              <span>{formatWatiTime(item.timestamp) || "Ahora"} {item.outgoing && <CheckCheck size={13}/>}</span>
            </div>)}
          </div>
          <form className="wa-composer" onSubmit={sendWatiReply}>
            <button type="button" aria-label="Adjuntar archivo"><Paperclip size={19}/></button>
            <button type="button" className="ai-suggest" onClick={() => void suggestAiReply()} disabled={aiReplying || !selectedConversation.messages.length} aria-label="Sugerir respuesta con Peluvi IA"><Sparkles size={17}/></button>
            <input value={reply} onChange={(event) => setReply(event.target.value)} placeholder="Escribe un mensaje…"/>
            <button className="send" disabled={sending || !reply.trim()} aria-label="Enviar mensaje">{sending ? <LoaderCircle className="spin" size={17}/> : <Send size={17}/>}</button>
          </form>
        </> : <div className="wa-welcome">
          <div className="wa-orbit">
            <span className="wa-orbit-main"><MessageCircle size={39}/></span>
            <span className="wa-orbit-item phone"><Phone size={17}/></span>
            <span className="wa-orbit-item campaign"><Megaphone size={17}/></span>
            <span className="wa-orbit-item users"><Users size={17}/></span>
          </div>
          <h2>WhatsApp está conectado.<br/>¡Empecemos!</h2>
          <p>Cuando llegue un mensaje nuevo podrás leerlo y responderlo desde esta bandeja.</p>
          <div className="wa-quick-actions">
            <article><Phone size={20}/><div><strong>Recibir conversaciones</strong><p>Envía un mensaje al número conectado para iniciar una prueba real.</p></div><span className="wa-action-ready"><Check size={14}/> Listo</span></article>
            <article><Megaphone size={20}/><div><strong>Enviar una difusión</strong><p>Llega a varios clientes con un solo mensaje aprobado.</p></div><button type="button" onClick={() => window.open("https://app.wati.io", "_blank", "noopener,noreferrer")}>Abrir WATI</button></article>
            <article><Rocket size={20}/><div><strong>Lanzar una campaña</strong><p>Dirige nuevos contactos a tu bandeja de WhatsApp.</p></div><button type="button" onClick={() => window.open("https://app.wati.io", "_blank", "noopener,noreferrer")}>Crear campaña</button></article>
            <article><QrCode size={20}/><div><strong>Nueva conversación</strong><p>Escribe a un contacto dentro de una sesión activa.</p></div><button type="button" onClick={() => setNewConversationOpen(true)}>Escribir mensaje</button></article>
          </div>
        </div>}
      </main>
    </div>

    <div className={`wa-ai-status ${aiEnabled ? "active" : ""}`}>
      <span><Sparkles size={15}/></span>
      <div><strong>Peluvi IA {aiEnabled ? "activa" : "pausada"}</strong><small>{aiActivity}</small></div>
      {aiReplying && <LoaderCircle className="spin" size={16}/>}
      {aiEnabled && !aiReplying && <button type="button" onClick={recoverPendingMessages}>Revisar pendientes</button>}
    </div>

    {newConversationOpen && <div className="wa-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setNewConversationOpen(false); }}>
      <form className="wa-new-conversation" onSubmit={startWatiConversation}>
        <header><div><span><MessageCircle size={18}/></span><div><h2>Nueva conversación</h2><p>Envía un mensaje a una sesión activa de WhatsApp.</p></div></div><button type="button" onClick={() => setNewConversationOpen(false)} aria-label="Cerrar">×</button></header>
        <label>Número de WhatsApp<small>Incluye código de país, sin “+” ni espacios.</small><input autoFocus inputMode="numeric" value={newTarget} onChange={(event) => setNewTarget(event.target.value.replace(/\D/g, ""))} placeholder="573001234567" required/></label>
        <label>Mensaje<textarea value={newMessage} onChange={(event) => setNewMessage(event.target.value)} placeholder="Hola, ¿cómo podemos ayudarte?" maxLength={4096} required/></label>
        <div className="wa-modal-note">Los mensajes libres funcionan durante las 24 horas posteriores al último mensaje del cliente.</div>
        {result?.type === "error" && <p className="wa-result error">{result.text}</p>}
        <footer><button type="button" className="wa-secondary" onClick={() => setNewConversationOpen(false)}>Cancelar</button><button className="wa-primary-action" disabled={sending || !newTarget || !newMessage.trim()}>{sending ? <LoaderCircle className="spin" size={16}/> : <Send size={16}/>} Enviar mensaje</button></footer>
      </form>
    </div>}

    <details className="wa-advanced">
      <summary><Settings2 size={17}/><span><strong>Configuración avanzada</strong><small>Conexiones, webhook y pruebas técnicas</small></span><ChevronDown size={17}/></summary>
      <div className="wa-advanced-content">
    {kommo?.configured && <article className="wa-kommo-banner">
      <div className="wa-card-heading"><span><Check size={20}/></span><div><small>PUENTE ACTIVO</small><h2>Kommo · {kommo.account?.name}</h2></div></div>
      <div className="wa-kommo-checks">
        <span className="ok"><Check size={14}/> Cuenta validada</span>
        <span className="ok"><Check size={14}/> CRM y leads disponibles</span>
        <span className={kommo.chatAccess ? "ok" : "blocked"}>{kommo.chatAccess ? <Check size={14}/> : <span>!</span>} {kommo.chatAccess ? "Historial de WhatsApp disponible" : "Historial de WhatsApp bloqueado"}</span>
      </div>
      {!kommo.chatAccess && <p>{kommo.chatAccessReason} Actívalo en los permisos de la integración y genera un token nuevo.</p>}
    </article>}

    <div className="wa-status-grid">
      <article className="wa-connection-card">
        <div className="wa-card-heading"><span><MessageCircle size={20}/></span><div><small>CANAL</small><h2>{status?.profile?.verifiedName || "WhatsApp Cloud API"}</h2></div></div>
        {loading ? <p><LoaderCircle className="spin" size={17}/> Comprobando la conexión…</p> :
          status?.configured ? <>
            <dl><div><dt>Número</dt><dd>{status.profile?.displayPhoneNumber || "Validado"}</dd></div><div><dt>Calidad</dt><dd>{status.profile?.qualityRating || "Sin dato"}</dd></div><div><dt>Phone Number ID</dt><dd>{status.phoneNumberId}</dd></div></dl>
            <div className="wa-button-row"><button type="button" className="wa-secondary" onClick={() => void refresh()}><RefreshCw size={14}/> Volver a validar</button>{status.source === "facebook" && <button type="button" className="wa-secondary danger" onClick={() => void disconnect()}><Link2Off size={14}/> Desconectar</button>}</div>
          </> : <>
            <p>{status?.error || "Inicia sesión con la cuenta de Facebook administradora del negocio y selecciona tu número."}</p>
            <button type="button" className="wa-facebook-button" disabled={!metaConfig?.ready || connecting} onClick={connectWithFacebook}>{connecting ? <LoaderCircle className="spin" size={17}/> : <LogIn size={17}/>} {connecting ? "Conectando…" : "Continuar con Facebook"}</button>
            {!metaConfig?.ready && <div className="wa-config-note"><strong>Configuración inicial pendiente</strong><span>{metaConfig?.missing?.join(" · ") || "Consultando aplicación de Meta…"}</span></div>}
            <details><summary>Conexión manual para desarrollo</summary><ol><li><code>WHATSAPP_ACCESS_TOKEN</code></li><li><code>WHATSAPP_PHONE_NUMBER_ID</code></li><li><code>WHATSAPP_BUSINESS_ACCOUNT_ID</code></li></ol></details>
          </>}
      </article>

      <article className="wa-webhook-card">
        <div className="wa-card-heading"><span><Webhook size={20}/></span><div><small>RECEPCIÓN</small><h2>Webhook</h2></div></div>
        <p>URL que debes registrar en Meta. En local necesita un túnel HTTPS público.</p>
        <label>Callback URL<div className="wa-copy-field"><input readOnly value={webhookUrl}/><button type="button" onClick={() => void navigator.clipboard.writeText(webhookUrl)} aria-label="Copiar URL"><Copy size={15}/></button></div></label>
        <div className={`wa-mini-status ${status?.webhookConfigured ? "ok" : ""}`}>{status?.webhookConfigured ? <Check size={14}/> : <span>!</span>} {status?.webhookConfigured ? "Secretos del webhook configurados" : "Faltan VERIFY_TOKEN y APP_SECRET"}</div>
      </article>
    </div>

    <form className="wa-send-card" onSubmit={send}>
      <div className="wa-card-heading"><span><Send size={20}/></span><div><small>PRUEBA REAL</small><h2>Enviar mensaje</h2></div></div>
      <div className="wa-kind-tabs">
        <button type="button" className={kind === "template" ? "active" : ""} onClick={() => setKind("template")}>Plantilla</button>
        <button type="button" className={kind === "text" ? "active" : ""} onClick={() => setKind("text")}>Texto libre</button>
      </div>
      <label>Número destinatario<small>Incluye código de país, sin “+”, espacios ni guiones.</small><input value={to} onChange={(event) => setTo(event.target.value.replace(/\D/g, ""))} placeholder="573001234567" inputMode="numeric" required/></label>
      {kind === "template" ? <div className="wa-fields-row"><label>Nombre de plantilla<input value={template} onChange={(event) => setTemplate(event.target.value)} required/></label><label>Idioma<input value={language} onChange={(event) => setLanguage(event.target.value)} required/></label></div> :
        <label>Mensaje<textarea value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4096} required/><small>El texto libre solo funciona dentro de la ventana de atención de 24 horas.</small></label>}
      <button className="generate-main" disabled={!status?.configured || sending}>{sending ? <><LoaderCircle className="spin" size={16}/> Enviando…</> : <><Send size={16}/> Enviar prueba</>}</button>
      {result && <p className={`wa-result ${result.type}`}>{result.type === "ok" && <Check size={15}/>} {result.text}</p>}
    </form>
      </div>
    </details>
  </section>;
}
