import { NextResponse } from "next/server";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function GET() { const id = await currentPlayerId(); if (!id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); const quests = await database.all("SELECT * FROM missoes WHERE jogador_id = ? ORDER BY CASE status WHEN 'ativa' THEN 0 WHEN 'disponivel' THEN 1 ELSE 2 END, nome", [id]); return NextResponse.json({ quests }); }
