import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function GET(_: Request, context: { params: Promise<{ npcId: string }> }) {
  try {
    const playerId = await currentPlayerId();
    if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const { npcId } = await context.params;
    if (!/^[a-z0-9_-]{2,80}$/i.test(npcId)) return NextResponse.json({ error: "NPC inválido." }, { status: 400 });
    const dir = path.resolve(process.cwd(), "../bot/src/npc/data"); const file = path.resolve(dir, `${npcId}.json`);
    if (!file.startsWith(dir + path.sep) || !fs.existsSync(file)) return NextResponse.json({ error: "NPC não encontrado." }, { status: 404 });
    const result = await database.canInteractWithNpc(playerId, npcId);
    return NextResponse.json(result, { status: result.allowed ? 200 : 403 });
  } catch (error) {
    console.error("[NPC-LOCATION] Falha ao validar interação:", error instanceof Error ? error.message : "erro desconhecido");
    return NextResponse.json({ error: "Não foi possível validar a interação." }, { status: 500 });
  }
}
