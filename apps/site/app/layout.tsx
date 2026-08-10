import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title:'Solo Leveling RPG — Portal do Caçador', description:'Portal integrado do RPG: personagem, mapa, guildas, inventário, missões e sistemas.' };
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
