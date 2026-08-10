import "server-only";
import crypto from "crypto";
import database from "./rpg";

export async function consumeLoginToken(token: string) {
  if (typeof token !== "string" || token.length < 32 || token.length > 512) throw new Error("Token invalido.");
  const hash = crypto.createHash("sha256").update(token).digest("hex");
  // Atomic consumption prevents concurrent reuse of a valid token.
  const result = await database.get(
    "UPDATE site_login_tokens SET used_at = CURRENT_TIMESTAMP WHERE token_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING player_id",
    [hash, new Date().toISOString()]
  );
  if (!result?.player_id) throw new Error("Token expirado, usado ou invalido.");
  return Number(result.player_id);
}
