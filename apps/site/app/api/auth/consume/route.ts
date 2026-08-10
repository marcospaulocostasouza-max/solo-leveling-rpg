import { NextResponse } from "next/server";
import { consumeLoginToken } from "@/lib/auth-token";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const { token } = await request.json().catch(() => ({}));
  if (typeof token !== "string") return NextResponse.json({ error: "Token invalido." }, { status: 400 });
  try {
    const playerId = await consumeLoginToken(token);
    await createSession(playerId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao validar token." }, { status: 401 });
  }
}
