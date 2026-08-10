import { redirect } from "next/navigation";
import { currentPlayerId } from "@/lib/session";
import PortalApp from "@/components/PortalApp";

export const dynamic = "force-dynamic";
export default async function Personagem() {
  if (!(await currentPlayerId())) redirect("/login");
  return <PortalApp />;
}
