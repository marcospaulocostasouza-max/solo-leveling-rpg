import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function GET(_: Request, context: { params: Promise<{ npcId: string }> }) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { npcId } = await context.params;
  if (!/^[a-z0-9_-]{2,80}$/i.test(npcId)) return NextResponse.json({ error: "NPC inválido." }, { status: 400 });
  return NextResponse.json(await database.canInteractWithNpc(playerId, npcId));
}
