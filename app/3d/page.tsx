import type { Metadata } from 'next';
import { Chakra_Petch, Archivo } from 'next/font/google';
import GameLoader from './loader';
const hud = Chakra_Petch({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-hud' });
const display = Archivo({ subsets: ['latin'], weight: ['400', '800', '900'], variable: '--font-display' });
export const metadata: Metadata = { title:'Monova Digital Drop | 3D',description:'Explora Monova City, combate Bugs y sobrevive al Firewall. Demo 3D single player.' };
export default function Page(){return <div className={`${hud.variable} ${display.variable}`}><GameLoader/></div>;}
