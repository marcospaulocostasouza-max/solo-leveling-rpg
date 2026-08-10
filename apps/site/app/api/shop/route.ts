import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";

export const runtime = "nodejs";
export async function GET() {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const items = await database.shopCatalog();
  return NextResponse.json({ items });
}
export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { itemId, quantity = 1 } = await request.json().catch(() => ({}));
  if ((!Number.isInteger(itemId) && (typeof itemId !== "string" || !itemId.startsWith("legacy:"))) || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  try { return NextResponse.json({ ok: true, result: await database.purchaseItem(playerId, itemId, quantity) }); }
  catch (error) { return NextResponse.json({ error: error instanceof Error ? error.message : "Compra indisponível." }, { status: 400 }); }
}
