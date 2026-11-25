'use client';

import React, { useState } from 'react';
import MosquitoGame from './MosquitoGame';
import CatcherGame from './CatcherGame';

type ActiveGame = 'NONE' | 'MOSQUITO' | 'CATCHER';

interface GameItem {
  id: Exclude<ActiveGame, 'NONE'>;
  name: string;
  image: string;
  accentHover: string;
}

const GAMES: GameItem[] = [
  {
    id: 'MOSQUITO',
    name: 'Mosquito Swatter',
    image: 'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/mosquito.png',
    accentHover: 'hover:border-emerald-500/70 group-hover:text-emerald-400',
  },
  {
    id: 'CATCHER',
    name: 'Choco & Bomb Catcher',
    image: 'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/catcher.png',
    accentHover: 'hover:border-pink-500/70 group-hover:text-pink-400',
  },
];

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<ActiveGame>('NONE');

  return (
    <main className="w-full min-h-screen bg-slate-950 text-white overflow-x-hidden flex flex-col">
      {/* Meme Game Hub Lobby */}
      {selectedGame === 'NONE' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-5xl mx-auto w-full">
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Choose Your Game
            </h1>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-5 w-full">
            {GAMES.map((game) => (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game.id)}
                className={`group flex flex-col items-center rounded-2xl bg-slate-900/90 border border-slate-800 p-3 shadow-lg transition-all duration-200 hover:-translate-y-1 cursor-pointer overflow-hidden ${game.accentHover}`}
              >
                <div className="w-full aspect-square rounded-xl overflow-hidden bg-slate-950">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                <h2 className="mt-3 mb-1 text-sm sm:text-base font-bold text-center text-white transition-colors">
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
