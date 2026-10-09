"use client";
import dynamic from 'next/dynamic';
const Game = dynamic(()=>import('@/components/digital-drop/game'),{ssr:false,loading:()=> <div className="min-h-screen bg-black text-white grid place-items-center">INICIALIZANDO MONOVA CITY…</div>});
export default function GameLoader(){return <Game/>;}
