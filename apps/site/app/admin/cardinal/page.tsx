import { redirect } from "next/navigation";
import { currentPlayerId } from "@/lib/session";
import database from "@/lib/rpg";
import CardinalConsole from "@/components/CardinalConsole";

export default async function CardinalPage(){
  const playerId=await currentPlayerId();
  if(!playerId||!(await database.isAdmin(playerId))) redirect("/");
  const player=await database.get("SELECT nome, numero FROM jogadores WHERE id = ?",[playerId]);
  return <CardinalConsole adminName={player?.nome||"Administrador"}/>;
}
