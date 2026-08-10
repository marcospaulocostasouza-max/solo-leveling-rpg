import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";

export const runtime = "nodejs";
export async function GET() {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const player = await database.playerById(playerId);
  if (!player) return NextResponse.json({ error: "Personagem não encontrado." }, { status: 404 });
  const publicPlayer = Object.fromEntries(Object.entries(player).filter(([key]) => !["numero", "personalidade", "aparencia", "historia"].includes(key)));
  const [inventory, skills, guild, location, titles] = await Promise.all([database.inventory(playerId), database.playerSkills(playerId), database.playerGuild(playerId), database.playerLocation(playerId), database.playerTitles(playerId)]);
  let passives: unknown[] = [];
  try { passives = JSON.parse(String(player.passivas_ativas || "[]")); } catch { passives = []; }
  return NextResponse.json({ player: publicPlayer, inventory, skills, guild, location, titles, passives, slots: database.slots });
}
