import { NextResponse } from "next/server";
import { currentPlayerId } from "@/lib/session";
export const runtime = "nodejs";
export async function GET() { const id = await currentPlayerId(); if (!id) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const quest = require('../../../../bot/src/systems/questSystem');
  const quests = await quest.listarMissoes(id);
  return NextResponse.json({ quests }, { headers: { 'Cache-Control': 'private, no-store' } }); }
