"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export function AuthForm({ register }: { register: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch(register ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(register ? {
        email: data.get("email"),
        password: data.get("password"),
        fullName: data.get("fullName"),
        workspaceName: data.get("workspaceName"),
      } : { testAccess: true }),
    }).catch(() => null);
    if (!response?.ok) {
      const payload = await response?.json().catch(() => null);
      setError(payload?.error ?? "No fue posible completar el acceso.");
      setLoading(false);
      return;
    }
    router.push("/app/dashboard");
    router.refresh();
  }

  return <form onSubmit={submit}>
    {register && <><label>Nombre completo<input name="fullName" autoComplete="name" placeholder="Tu nombre" required minLength={2}/></label><label>Empresa o workspace<input name="workspaceName" autoComplete="organization" placeholder="Nombre de tu empresa" required minLength={2}/></label><label>Correo<input name="email" type="email" autoComplete="email" placeholder="tu@empresa.com" required/></label><label>Contraseña<input name="password" type="password" autoComplete="new-password" placeholder="Mínimo 8 caracteres" required minLength={8}/></label></>}
    {error && <p className="auth-error" role="alert">{error}</p>}
    <button className="button primary full" type="submit" disabled={loading}>{loading ? <LoaderCircle className="auth-spinner" size={17}/> : <ArrowRight size={17}/>} {loading ? "Procesando…" : register ? "Crear workspace" : "Entrar"}</button>
  </form>;
}
