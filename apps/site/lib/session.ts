import "server-only";
import { cookies } from "next/headers";
import crypto from "crypto";
import database from "./rpg";

export const SESSION_COOKIE = "slrpg_session";
const sessionDurationMs = 7 * 24 * 60 * 60 * 1000;

export async function createSession(playerId: number) {
  const id = crypto.randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + sessionDurationMs).toISOString();
  await database.run("INSERT INTO site_sessions (id, player_id, created_at, expires_at) VALUES (?, ?, ?, ?)", [id, playerId, new Date().toISOString(), expiresAt]);
  const store = await cookies();
  store.set(SESSION_COOKIE, id, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(expiresAt) });
}

export async function currentPlayerId() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (!id) return null;
  const session = await database.get("SELECT player_id FROM site_sessions WHERE id = ? AND revoked_at IS NULL AND expires_at > ?", [id, new Date().toISOString()]);
  return session?.player_id ?? null;
}

export async function destroySession() {
  const store = await cookies();
  const id = store.get(SESSION_COOKIE)?.value;
  if (id) await database.run("UPDATE site_sessions SET revoked_at = CURRENT_TIMESTAMP WHERE id = ? AND revoked_at IS NULL", [id]);
  store.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: new Date(0) });
}
