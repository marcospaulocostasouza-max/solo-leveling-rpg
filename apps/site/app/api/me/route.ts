import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const playerId = await currentPlayerId();
    if (!playerId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (new URL(request.url).searchParams.get('summary') === '1') {
      const player = await database.get('SELECT id,nome,rank,nivel,maestria,won FROM jogadores WHERE id=?', [playerId]);
      if (!player) return NextResponse.json({ error: 'Personagem não encontrado.' }, { status: 404 });
      const location = await database.playerLocation(playerId);
      return NextResponse.json({ player, location, inventory: [], skills: [], guild: null, titles: [], passives: [], slots: {} }, { headers: { 'Cache-Control': 'private, no-store' } });
    }
    const player = await database.playerById(playerId);
    if (!player) return NextResponse.json({ error: "Personagem não encontrado." }, { status: 404 });
    const publicPlayer = Object.fromEntries(Object.entries(player).filter(([key]) => !["numero", "personalidade", "aparencia", "historia"].includes(key)));
    const [inventory, skills, guild, location, titles] = await Promise.all([database.inventory(playerId), database.playerSkills(playerId), database.playerGuild(playerId), database.playerLocation(playerId), database.playerTitles(playerId)]);
    let passives: unknown[] = [];
    try { passives = JSON.parse(String(player.passivas_ativas || "[]")); } catch { passives = []; }
    return NextResponse.json({ player: publicPlayer, inventory, skills, guild, location, titles, passives, slots: database.slots });
  } catch {
    return NextResponse.json({ error: "Não foi possível carregar o personagem." }, { status: 500 });
  }
}
