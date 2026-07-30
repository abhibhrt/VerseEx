// app/theatre/page.tsx
'use client';

import React, { useState, Suspense, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';
import * as THREE from 'three';
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
  const [isVR, setIsVR] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Seat layout configuration - 7 rows x 18 seats
  const rows = 7;
  const seatsPerRow = 18;
  const seatMap: RowMap[] = [];
  
  // Reverse the rows so Row A is closest to screen (bottom of grid)
  for (let r = rows - 1; r >= 0; r--) {
    const rowLetter = String.fromCharCode(65 + (rows - 1 - r)); // A, B, C, D, E, F, G
    const seats: Seat[] = [];
    for (let s = 0; s < seatsPerRow; s++) {
      const seatNumber = s + 1;
      // Some seats taken for realism (middle seats in first row taken)
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
      setIsVR(false);
      window.dispatchEvent(new CustomEvent('play-theatre-video'));
    }
  };

  const handleEnterVR = () => {
    if (selectedSeat) {
      setIsStarted(true);
      setIsVR(true);
      window.dispatchEvent(new CustomEvent('play-theatre-video'));
    } else {
      alert('Please select a seat first');
    }
  };

  // Find selected seat position
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
        // Landing Page with Seat Selection
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-gradient-to-b from-black via-[#0a0a0a] to-[#1a0505] p-4">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-red-600 via-rose-500 to-amber-500 uppercase mb-2">
                VerseEx Cinema
              </h1>
              <p className="text-neutral-400 text-sm md:text-base">
                Premium Immersive Experience • Select Your Seat
              </p>
              <div className="w-24 h-0.5 bg-gradient-to-r from-red-600 to-amber-500 mx-auto mt-3" />
            </div>

            {/* Seat Selection */}
            <div className="bg-black/60 backdrop-blur-xl rounded-2xl border border-white/10 p-4 md:p-6 shadow-2xl shadow-red-600/10">
              {/* Screen indicator - at the TOP */}
              <div className="relative mb-3">
                <div className="w-3/4 h-1 bg-gradient-to-r from-transparent via-red-600/50 to-transparent mx-auto rounded-full" />
                <div className="text-center text-neutral-500 text-xs mt-2 tracking-widest uppercase">SCREEN</div>
              </div>

              {/* Seat Grid - Scrollable for many seats */}
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
              {/* Legend */}
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

              {/* Selected Seat Display & Enter Button */}
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
                
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleEnterTheatre}
                    disabled={!selectedSeat}
                    className={`
                      px-6 py-2 rounded-full font-medium uppercase tracking-wider text-xs
                      transition-all duration-300 transform
                      ${selectedSeat 
                        ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white shadow-lg shadow-red-600/30 hover:scale-105 active:scale-95 cursor-pointer' 
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    Enter Cinema
                  </button>
                  <button
                    onClick={handleEnterVR}
                    disabled={!selectedSeat}
                    className={`
                      px-6 py-2 rounded-full font-medium uppercase tracking-wider text-xs
                      transition-all duration-300 transform flex items-center justify-center gap-1.5
                      ${selectedSeat 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-lg shadow-purple-600/30 hover:scale-105 active:scale-95 cursor-pointer' 
                        : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                      }
                    `}
                  >
                    <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 4a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-6 4a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"/>
                    </svg>
                    VR
                  </button>
                </div>
              </div>
              
              {/* VR Info */}
              <div className="mt-2 text-center text-[10px] text-neutral-500">
                VR works with Google Cardboard, VR Box, or any phone VR headset
              </div>
            </div>
          </div>
        </div>
      ) : (
        // Theatre Experience with VR
        <>
          <div className="relative w-full h-full">
            <Canvas
              ref={canvasRef as any}
              shadows
              camera={{ position: [0, 2, 15], fov: 60 }}
              gl={{ 
                antialias: true, 
                powerPreference: 'high-performance',
                pixelRatio: window.devicePixelRatio
              }}
              style={{ 
                width: '100%', 
                height: '100%',
                display: 'block'
              }}
            >
              <Suspense fallback={null}>
                <TheatreScene 
                  isStarted={isStarted} 
                  initialSeat={selectedSeatPos ? [selectedSeatPos.x, 2.3, selectedSeatPos.z + 0.2] : undefined}
                  isVR={isVR}
                />
              </Suspense>
            </Canvas>

            {/* VR Overlay - Creates split screen effect */}
            {isVR && (
              <div className="absolute inset-0 pointer-events-none z-40">
                <div className="w-1/2 h-full absolute left-0 top-0 border-r border-white/10"></div>
                <div className="w-1/2 h-full absolute right-0 top-0 border-l border-white/10"></div>
              </div>
            )}
          </div>

          <Loader containerStyles={{ background: '#000' }} innerStyles={{ width: '200px', background: '#333' }} barStyles={{ background: '#dc2626' }} />
          
          {/* VR Controls - Small floating buttons while in theatre */}
          <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 z-50 flex gap-2">
            {/* Toggle VR Button */}
            <button
              onClick={() => setIsVR(!isVR)}
              className={`
                px-4 py-1.5 rounded-full font-medium text-[11px] uppercase tracking-wider
                transition-all duration-300 transform hover:scale-105 active:scale-95
                flex items-center gap-1.5 shadow-lg
                ${isVR 
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white shadow-green-500/30' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white shadow-purple-600/30'
                }
              `}
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                {isVR ? (
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                ) : (
                  <path d="M4 4a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2H4zm2 4a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2zm-6 4a1 1 0 100-2 1 1 0 000 2zm6 0a1 1 0 100-2 1 1 0 000 2z"/>
                )}
              </svg>
              {isVR ? 'Exit VR' : 'VR'}
            </button>

            {/* Exit Theatre Button */}
            <button
              onClick={() => {
                setIsStarted(false);
                setIsVR(false);
              }}
              className="px-4 py-1.5 rounded-full font-medium text-[11px] uppercase tracking-wider bg-white/10 hover:bg-white/20 text-white transition-all duration-300 backdrop-blur-sm shadow-lg flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 1.414L7.414 9H15a1 1 0 110 2H7.414l2.293 2.293a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
              Exit
            </button>
          </div>

          {/* VR Mode Status - Small indicator */}
          {isVR && (
            <div className="absolute top-3 left-1/2 transform -translate-x-1/2 z-50 bg-purple-600/80 backdrop-blur-sm text-white px-3 py-1 rounded-full text-[10px] font-medium shadow-lg flex items-center gap-1.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              VR Mode Active
            </div>
          )}
        </>
      )}
    </main>
  );
}