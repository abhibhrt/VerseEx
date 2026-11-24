'use client';

import React, { useState } from 'react';
import { Bug, Candy, Play } from 'lucide-react';
import MosquitoGame from './MosquitoGame';
import CatcherGame from './CatcherGame';

type ActiveGame = 'NONE' | 'MOSQUITO' | 'CATCHER';

export default function Home() {
  const [selectedGame, setSelectedGame] = useState<ActiveGame>('NONE');

  return (
    <main className="w-full min-h-screen bg-slate-950 text-white overflow-x-hidden flex flex-col">
      {/* Game Launcher Lobby */}
      {selectedGame === 'NONE' && (
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 max-w-3xl mx-auto w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Choose Your Game
            </h1>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            {/* Game 1 Card: Mosquito Game */}
            <button
              onClick={() => setSelectedGame('MOSQUITO')}
              className="group relative flex flex-col text-left rounded-xl bg-slate-900/90 border border-slate-800 hover:border-emerald-500/60 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-emerald-500/10 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                  <Bug className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold">
                  Action • Reflex
                </span>
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Mosquito Swatter
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 flex-1 leading-relaxed">
                Test your reflexes and swat buzzing mosquitoes before they escape. Fast-paced arcade action.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Click to launch</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-500 text-slate-950 font-bold text-xs group-hover:bg-emerald-400 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Now
                </span>
              </div>
            </button>

            {/* Game 2 Card: Choco & Bomb Catcher */}
            <button
              onClick={() => setSelectedGame('CATCHER')}
              className="group relative flex flex-col text-left rounded-xl bg-slate-900/90 border border-slate-800 hover:border-pink-500/60 p-4 shadow-lg transition-all duration-200 hover:-translate-y-0.5 hover:shadow-pink-500/10 cursor-pointer overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 group-hover:scale-105 transition-transform">
                  <Candy className="w-5 h-5" />
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[11px] font-semibold">
                  Arcade • Catcher
                </span>
              </div>

              <h2 className="text-lg font-bold text-white group-hover:text-pink-400 transition-colors">
                Choco &amp; Bomb Catcher
              </h2>
              <p className="text-slate-400 text-xs mt-1.5 flex-1 leading-relaxed">
                Catch sweet chocolates thrown from the rooftop while dodging falling bombs.
              </p>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                <span className="text-[11px] font-medium text-slate-400">Click to launch</span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-pink-500 text-slate-950 font-bold text-xs group-hover:bg-pink-400 transition-colors">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Play Now
                </span>
              </div>
            </button>
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