'use client';

import React, { useState } from 'react';
import MosquitoGame from './MosquitoGame';
import CatcherGame from './CatcherGame';

type ActiveGame = 'NONE' | 'MOSQUITO' | 'CATCHER';

interface GameItem {
  id: Exclude<ActiveGame, 'NONE'>;
  name: string;
  image: string;
  glowStyle: string;
  textHover: string;
}

const GAMES: GameItem[] = [
  {
    id: 'MOSQUITO',
    name: 'Mosquito Swatter',
    image: 'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/Games/mosquito.png',
    glowStyle:
      'border-b-emerald-600/80 shadow-[0_14px_24px_rgba(0,0,0,0.85),inset_0_2px_3px_rgba(255,255,255,0.28)] group-hover:shadow-[0_20px_35px_rgba(16,185,129,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    textHover: 'group-hover:text-emerald-400',
  },
  {
    id: 'CATCHER',
    name: 'Choco & Bomb Catcher',
    image: 'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/Games/catcher.png',
    glowStyle:
      'border-b-pink-600/80 shadow-[0_14px_24px_rgba(0,0,0,0.85),inset_0_2px_3px_rgba(255,255,255,0.28)] group-hover:shadow-[0_20px_35px_rgba(236,72,153,0.35),inset_0_2px_4px_rgba(255,255,255,0.4)]',
    textHover: 'group-hover:text-pink-400',
  },
];

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<ActiveGame>('NONE');

  return (
    <main className="w-full min-h-screen bg-slate-950 text-white overflow-x-hidden flex flex-col">
      {/* Meme Game Hub Lobby */}
      {selectedGame === 'NONE' && (
        <div className="flex-1 flex flex-col items-start justify-start px-2 pt-20 max-w-5xl mx-auto w-full">
          <div className="grid grid-cols-3 sm:grid-cols-6 md:grid-cols-8 gap-2 w-full">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className="group flex flex-col items-center cursor-pointer focus:outline-none"
              >
                {/* Standalone 3D Image Tile */}
                <div
                  className={`relative w-25 h-25 aspect-square rounded-3xl overflow-hidden transition-all duration-200 group-hover:-translate-y-2 group-hover:scale-105 group-active:translate-y-1 group-active:border-b-[2px] ${game.glowStyle}`}
                >
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                <h2
                  className={`mt-4 text-sm sm:text-base font-bold text-center text-slate-200 transition-colors ${game.textHover}`}
                >
                  {game.name}
                </h2>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Active Game View */}
      {selectedGame !== 'NONE' && (
        <div className="w-full h-full flex flex-col">
          <div className="flex-1 w-full">
            {selectedGame === 'MOSQUITO' && (
              <MosquitoGame onExit={() => setSelectedGame('NONE')} />
            )}
            {selectedGame === 'CATCHER' && (
              <CatcherGame onExit={() => setSelectedGame('NONE')} />
            )}
          </div>
        </div>
      )}
    </main>
  );
}