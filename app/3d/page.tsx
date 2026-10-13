import type { Metadata } from 'next';
import { Barlow, Barlow_Condensed } from 'next/font/google';
import GameLoader from './loader';
const display = Barlow_Condensed({ subsets: ['latin'], weight: ['600', '700', '800', '900'], style: ['normal', 'italic'], variable: '--font-display' });
const body = Barlow({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-body' });
export const metadata: Metadata = { title:'Monova Digital Drop | 3D',description:'Explora Monova City, combate Bugs y sobrevive al Firewall. Demo 3D single player.' };
export default function Page(){return <div className={`${display.variable} ${body.variable}`}><GameLoader/></div>;}
