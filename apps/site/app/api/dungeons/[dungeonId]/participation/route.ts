import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function POST(request: Request, context: { params: Promise<{ dungeonId: string }> }) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { dungeonId } = await context.params; const { action } = await request.json().catch(() => ({}));
  if (!["arrive", "enter"].includes(action)) return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  try {
    const result = await database.transaction(async (query: typeof database) => {
      const dungeon = await query.get("SELECT * FROM weekly_dungeons WHERE id = ? AND status = 'open' AND expires_at > ?", [dungeonId, new Date().toISOString()]);
      if (!dungeon) throw new Error("Dungeon inativa ou expirada.");
      const prior = await query.get("SELECT id FROM weekly_dungeon_participation WHERE player_id = ? AND completed_at IS NOT NULL AND strftime('%Y-%W', completed_at) = strftime('%Y-%W', 'now')", [playerId]);
      if (prior) throw new Error("Você já concluiu uma Dungeon semanal nesta semana.");
      await query.run("INSERT OR IGNORE INTO weekly_dungeon_participation (dungeon_id, player_id, arrived_at) VALUES (?, ?, CASE WHEN ? = 'arrive' THEN datetime('now') ELSE NULL END)", [dungeonId, playerId, action]);
      if (action === "arrive") await query.run("UPDATE weekly_dungeon_participation SET arrived_at = COALESCE(arrived_at, datetime('now')) WHERE dungeon_id = ? AND player_id = ?", [dungeonId, playerId]);
      if (action === "enter") { const row = await query.get("SELECT arrived_at FROM weekly_dungeon_participation WHERE dungeon_id = ? AND player_id = ?", [dungeonId, playerId]); if (!row?.arrived_at) throw new Error("Registre sua chegada pelo mapa antes de entrar."); await query.run("UPDATE weekly_dungeon_participation SET entered_at = COALESCE(entered_at, datetime('now')) WHERE dungeon_id = ? AND player_id = ?", [dungeonId, playerId]); }
      return { action, dungeon: dungeon.name };
    });
    return NextResponse.json({ ok: true, result });
  } catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Falha na participação." }, { status: 400 }); }
}
