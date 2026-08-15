import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function GET() {
  try {
    const playerId = await currentPlayerId();
    if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    const player = await database.playerById(playerId);
    if (!player) return NextResponse.json({ error: "Jogador não encontrado." }, { status: 404 });
    const dir = path.resolve(process.cwd(), "../bot/src/npc/data");
    const profiles = fs.readdirSync(dir).filter(name => name.endsWith(".json")).map(name => { const npc = JSON.parse(fs.readFileSync(path.join(dir, name), "utf8")); return { id: npc.id || path.basename(name, ".json"), nome: npc.nome, localizacao: npc.localizacao, profissao: npc.profissao || npc.classe || null, rank: npc.rank || null, descricao: npc.personalidade || null, aparencia: npc.aparencia || null }; });
    const ids = new Set(profiles.map(npc => npc.id));
    const [relationships, scenes, overrides] = await Promise.all([
      database.all('SELECT "npcId", vinculo, hostilidade FROM npc_relationships WHERE "jogadorId" = ?', [player.numero]),
      database.all('SELECT "npcId", "jogadorId" FROM npc_cenas_ativas'),
      database.all('SELECT npc_id, base_location_id, temporary_location_id FROM npc_location_overrides WHERE active = 1')
    ]);
    const rel = new Map((relationships as any[]).filter(row => ids.has(row.npcId)).map(row => [row.npcId, row]));
    const scene = new Map((scenes as any[]).filter(row => ids.has(row.npcId)).map(row => [row.npcId, row]));
    const location = new Map((overrides as any[]).filter(row => ids.has(row.npc_id)).map(row => [row.npc_id, row]));
    return NextResponse.json({ npcs: profiles.map(npc => { const currentScene = scene.get(npc.id); const relation = rel.get(npc.id); const override = location.get(npc.id); return { ...npc, localizacaoAtual: override?.temporary_location_id || override?.base_location_id || null, vinculo: Number(relation?.vinculo || 0), hostilidade: Number(relation?.hostilidade || 0), disponibilidade: !currentScene || currentScene.jogadorId === player.numero, emCenaComJogador: currentScene?.jogadorId === player.numero }; }) });
  } catch (error) {
    console.error("[NPC] Falha ao listar NPCs:", error instanceof Error ? error.message : "erro desconhecido");
    return NextResponse.json({ error: "Não foi possível carregar os NPCs." }, { status: 500 });
  }
}
