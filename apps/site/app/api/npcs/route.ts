import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function GET() { const playerId = await currentPlayerId(); if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 }); const dir = path.resolve(process.cwd(), "../bot/src/npc/data"); const npcs = fs.readdirSync(dir).filter(n => n.endsWith(".json")).map(name => { const npc = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); return { id: npc.id || path.basename(name, ".json"), nome: npc.nome, localizacao: npc.localizacao, profissao: npc.profissao || npc.classe || null }; }); return NextResponse.json({ npcs }); }
