import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { itemId, equipped } = await request.json().catch(() => ({}));
  if (!Number.isInteger(itemId)) return NextResponse.json({ error: "Item inválido." }, { status: 400 });
  if (typeof equipped !== "undefined" && typeof equipped !== "boolean") return NextResponse.json({ error: "Estado do equipamento inválido." }, { status: 400 });
  try { return NextResponse.json({ ok: true, result: await database.equipItem(playerId, itemId, equipped) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Falha ao equipar." }, { status: 400 }); }
}
