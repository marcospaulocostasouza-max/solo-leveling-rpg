"use client";

import { useEffect, useState } from "react";

export default function TokenLogin({ params }: { params: Promise<{ token: string }> }) {
  const [message, setMessage] = useState("Validando acesso...");
  useEffect(() => {
    params.then(async ({ token }) => {
      try {
        const response = await fetch("/api/auth/consume", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ token }) });
        if (!response.ok) { const body = await response.json().catch(() => ({})); throw new Error(body.error || "Link invalido."); }
        window.location.replace("/personagem");
      } catch (error) { setMessage(error instanceof Error ? error.message : "Link invalido."); }
    });
  }, [params]);
  return <main className="system-loading auth-loading"><div className="loading-rune"/><small>PORTAL DO CAÇADOR</small><h1>{message}</h1></main>;
}
