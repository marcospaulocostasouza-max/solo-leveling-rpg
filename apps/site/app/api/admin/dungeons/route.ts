import { NextResponse } from "next/server";
import crypto from "crypto";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";

export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId || !(await database.isAdmin(playerId))) return NextResponse.json({ error: "Acesso administrativo necessário." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const { name, x, y, gateType, rank, rewardWon = 0, rewardXp = 0, boss = null, locationHint = null, expiresAt } = body;
  if (typeof name !== "string" || !name.trim() || !Number.isFinite(x) || x < 0 || x > 100 || !Number.isFinite(y) || y < 0 || y > 100 || !["common", "red"].includes(gateType) || typeof rank !== "string") return NextResponse.json({ error: "Dados de Dungeon inválidos." }, { status: 400 });
  const expiration = typeof expiresAt === "string" && new Date(expiresAt) > new Date() ? new Date(expiresAt).toISOString() : new Date(Date.now() + 7 * 86400000).toISOString();
  const id = `weekly-${crypto.randomBytes(8).toString("hex")}`;
  await database.run("INSERT INTO weekly_dungeons (id, name, x, y, gate_type, rank, expires_at, reward_won, reward_xp, boss, location_hint, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", [id, name.trim(), x, y, gateType, rank.trim(), expiration, Math.max(0, Number(rewardWon) || 0), Math.max(0, Number(rewardXp) || 0), boss, locationHint, String(playerId)]);
  return NextResponse.json({ ok: true, id });
}
