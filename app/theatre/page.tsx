// app/theatre/page.tsx
'use client';

import React, { useState, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import TheatreScene from './TheatreScene';

interface Seat {
  id: string;
  row: number;
  seat: number;
  available: boolean;
  position: { x: number; z: number };
}

interface RowMap {
  row: string;
  seats: Seat[];
}

export default function TheatrePage() {
  const [isStarted, setIsStarted] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState<string | null>(null);
  const [hoveredSeat, setHoveredSeat] = useState<string | null>(null);
  const [isVRMode, setIsVRMode] = useState(true);

  // Seat layout configuration - 7 rows x 18 seats
  const rows = 7;
  const seatsPerRow = 18;
  const seatMap: RowMap[] = [];
  
  // Reverse the rows so Row A is closest to screen (bottom of grid)
  for (let r = rows - 1; r >= 0; r--) {
    const rowLetter = String.fromCharCode(65 + (rows - 1 - r));
    const seats: Seat[] = [];
    for (let s = 0; s < seatsPerRow; s++) {
      const seatNumber = s + 1;
      const isAvailable = !(r === 0 && (s === 4 || s === 5 || s === 12 || s === 13));
      seats.push({
        id: `${rowLetter}${seatNumber}`,
        row: r,
        seat: s,
        available: isAvailable,
        position: { x: (s - seatsPerRow / 2 + 0.5) * 0.85, z: -2 - r * 2.0 }
      });
    }
    seatMap.push({ row: rowLetter, seats });
  }

  const handleEnterTheatre = () => {
    if (selectedSeat) {
      setIsStarted(true);
      window.dispatchEvent(new CustomEvent('play-theatre-video'));
    }
  };

  const getSeatPosition = () => {
    if (!selectedSeat) return null;
    for (const row of seatMap) {
      for (const seat of row.seats) {
        if (seat.id === selectedSeat) {
          return seat.position;
        }
      }
    }
    return null;
  };

  const selectedSeatPos = getSeatPosition();

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-black select-none">
      {!isStarted ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-[#1a0505] p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            <div className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 uppercase mb-2">
                VerseEx Cinema
              </h1>
              <p className="text-neutral-400 text-sm md:text-base">
                Premium Immersive Experience • Select Your Seat
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-red-600 to-amber-500 mx-auto mt-3" />
            </div>

            <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:p-6 shadow-2xl shadow-red-600/10">
              <div className="relative mb-3">
                <div className="w-3/4 h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent mx-auto rounded-full" />
                <div className="text-center text-neutral-500 text-xs mt-2 tracking-widest uppercase">SCREEN</div>
              </div>

              <div className="flex flex-col items-center gap-1.5 max-h-[400px] overflow-y-auto px-2">
                {seatMap.map((row) => (
                  <div key={row.row} className="flex items-center gap-1.5">
                    <span className="text-neutral-500 text-xs font-bold w-4 text-right">{row.row}</span>
                    <div className="flex gap-1">
                      {row.seats.map((seat) => {
                        const isSelected = selectedSeat === seat.id;
                        const isHovered = hoveredSeat === seat.id;
                        const isAvailable = seat.available;
                        
                        return (
                          <button
                            key={seat.id}
                            onClick={() => isAvailable && setSelectedSeat(seat.id)}
                            onMouseEnter={() => setHoveredSeat(seat.id)}
                            onMouseLeave={() => setHoveredSeat(null)}
                            disabled={!isAvailable}
                            className={`
                              w-5 h-5 md:w-6 md:h-6 rounded transition-all duration-200 transform
                              flex items-center justify-center text-[6px] md:text-[8px] font-bold
                              ${isAvailable ? 'cursor-pointer' : 'cursor-not-allowed opacity-30'}
                              ${isSelected 
                                ? 'bg-gradient-to-br from-red-600 to-rose-600 text-white scale-110 shadow-lg shadow-red-600/50 ring-1 ring-red-500' 
                                : isHovered && isAvailable
                                ? 'bg-white/20 text-white scale-105'
                                : isAvailable
                                ? 'bg-white/5 text-neutral-400 hover:bg-white/10'
                                : 'bg-black/30 text-neutral-600 line-through'
                              }
                            `}
                          >
                            {seat.seat + 1}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex justify-center gap-4 mt-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-white/10" />
                  <span className="text-neutral-500">Available</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-gradient-to-br from-red-600 to-rose-600" />
                  <span className="text-neutral-500">Selected</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded bg-black/30" />
                  <span className="text-neutral-500">Taken</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-4 pt-4 border-t border-white/5">
                <div className="text-center sm:text-left">
                  {selectedSeat ? (
                    <div>
                      <span className="text-neutral-400 text-sm">Selected Seat:</span>
                      <span className="ml-2 text-xl md:text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 to-amber-500">
                        {selectedSeat}
                      </span>
                      <p className="text-neutral-500 text-xs mt-0.5">
                        Row {selectedSeat.charAt(0)} • Seat {selectedSeat.substring(1)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-neutral-500 text-sm">Please select a seat to continue</p>
                  )}
                </div>
                
                <button
                  onClick={handleEnterTheatre}
                  disabled={!selectedSeat}
                  className={`
                    px-8 py-2.5 rounded-full font-medium uppercase tracking-wider text-sm
                    transition-all duration-300 transform
                    ${selectedSeat 
                      ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 cursor-pointer' 
                      : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                    }
                  `}
                >
                  Enter Cinema
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          <button 
            onClick={() => setIsVRMode(!isVRMode)}
            className="absolute top-4 right-4 z-50 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs uppercase tracking-wider backdrop-blur-md transition-all cursor-pointer"
          >
            {isVRMode ? 'Exit VR Mode' : 'Enter VR Mode'}
          </button>

          {isVRMode ? (
            <div className="w-screen h-screen flex">
              <div className="w-1/2 h-full relative overflow-hidden border-r border-neutral-900">
                <Canvas
                  shadows
                  camera={{ position: [0, 2, 15], fov: 60 }}
                  gl={{ antialias: true, powerPreference: 'high-performance' }}
                >
                  <Suspense fallback={null}>
                    <TheatreScene 
                      isStarted={isStarted} 
                      initialSeat={selectedSeatPos ? [selectedSeatPos.x, 2.3, selectedSeatPos.z + 0.2] : undefined}
                    />
                  </Suspense>
                </Canvas>
              </div>
              <div className="w-1/2 h-full relative overflow-hidden">
                <Canvas
                  shadows
                  camera={{ position: [0, 2, 15], fov: 60 }}
                  gl={{ antialias: true, powerPreference: 'high-performance' }}
                >
                  <Suspense fallback={null}>
                    <TheatreScene 
                      isStarted={isStarted} 
                      initialSeat={selectedSeatPos ? [selectedSeatPos.x, 2.3, selectedSeatPos.z + 0.2] : undefined}
                    />
                  </Suspense>
                </Canvas>
              </div>
            </div>
          ) : (
            <Canvas
              shadows
              camera={{ position: [0, 2, 15], fov: 60 }}
              gl={{ antialias: true, powerPreference: 'high-performance' }}
            >
              <Suspense fallback={null}>
                <TheatreScene 
                  isStarted={isStarted} 
                  initialSeat={selectedSeatPos ? [selectedSeatPos.x, 2.3, selectedSeatPos.z + 0.2] : undefined}
                />
              </Suspense>
            </Canvas>
          )}

          <Loader containerStyles={{ background: '#000' }} innerStyles={{ width: '200px', background: '#333' }} barStyles={{ background: '#dc2626' }} />
        </>
      )}
    </main>
  );
}