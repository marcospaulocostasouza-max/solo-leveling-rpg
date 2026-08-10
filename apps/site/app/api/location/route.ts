import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import database from "@/lib/rpg";
import { currentPlayerId } from "@/lib/session";

export const runtime = "nodejs";
export async function POST(request: Request) {
  const playerId = await currentPlayerId();
  if (!playerId) return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  const { cityId, regionId = null, placeId = null } = await request.json().catch(() => ({}));
  if (typeof cityId !== "string" || !/^[a-z0-9-]{2,64}$/.test(cityId)) return NextResponse.json({ error: "Destino inválido." }, { status: 400 });
  const placesFile = path.resolve(process.cwd(), "public/data/places.json");
  const places = JSON.parse(fs.readFileSync(placesFile, "utf8")).places || [];
  if (!places.some((place: { id: string }) => place.id === cityId)) return NextResponse.json({ error: "Destino não existe no mapa oficial." }, { status: 400 });
  // Travel cost/time are deliberately not invented: persistence is prepared for the official travel rules.
  await database.run("INSERT INTO player_locations (player_id, city_id, region_id, place_id, arrived_at) VALUES (?, ?, ?, ?, datetime('now')) ON CONFLICT(player_id) DO UPDATE SET city_id = excluded.city_id, region_id = excluded.region_id, place_id = excluded.place_id, arrived_at = excluded.arrived_at, travel_started_at = NULL, travel_destination_id = NULL, travel_arrives_at = NULL", [playerId, cityId, regionId, placeId]);
  await database.run("UPDATE jogadores SET localizacao = ? WHERE id = ?", [cityId, playerId]);
  return NextResponse.json({ ok: true, location: await database.playerLocation(playerId) });
}
