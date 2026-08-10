import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";

export const runtime = "nodejs";
export async function GET() {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const active = await database.all("SELECT id, name, x, y, rank, gate_type AS type, status, reward_won AS rewardWon, reward_xp AS rewardXp, boss, location_hint FROM weekly_dungeons WHERE status = 'open' AND expires_at > ? ORDER BY opened_at DESC", [new Date().toISOString()]);
  return NextResponse.json({ active, generatorStatus: "coordinates_ready_rules_pending" });
}
