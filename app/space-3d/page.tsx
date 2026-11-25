'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import SolarSystemGroup, { celestialBodies, CelestialData } from './SolarSystem';
import RealisticSpiralGalaxy from './Galaxy';

const BGM_URL = 'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/3d-space/bgm.mp3';

export default function SolarSystemApp() {
  const [selectedBody, setSelectedBody] = useState<CelestialData | null>(null);
  const [isGalacticView, setIsGalacticView] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize looping background audio & handle browser autoplay policies
  useEffect(() => {
    const audio = new Audio(BGM_URL);
    audio.loop = true;
    audio.volume = 0.4;
    audioRef.current = audio;

    const startAudio = () => {
      if (audioRef.current && audioRef.current.paused && !audioRef.current.muted) {
        audioRef.current.play().catch(() => {
          // Will retry on first user interaction
        });
      }
    };

    // Attempt immediate playback
    startAudio();

    // Fallback: start on first user click/touch if browser blocked autoplay
    window.addEventListener('pointerdown', startAudio, { once: true });

    return () => {
      window.removeEventListener('pointerdown', startAudio);
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;

    const nextMuted = !isMuted;
    audioRef.current.muted = nextMuted;
    setIsMuted(nextMuted);

    // Ensure playback starts if it was previously blocked by autoplay
    if (!nextMuted && audioRef.current.paused) {
      audioRef.current.play().catch((err) => console.error('Audio play error:', err));
    }
  };

  useEffect(() => {
    if (!selectedBody) return;

    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${selectedBody.wikiName}`)
      .then((res) => res.json())
      .then((data) => {
        setSelectedBody((prev) => {
          if (!prev || prev.name !== selectedBody.name) return prev;
          return {
            ...prev,
            image: data.originalimage?.source || data.thumbnail?.source || '',
            description: data.extract || 'No information available from Wikipedia.',
          };
        });
      })
      .catch((err) => console.error('Wikipedia fetch error:', err));
  }, [selectedBody?.name]);

  return (
    <div className="relative w-full h-screen bg-[#020204] text-white font-sans overflow-hidden select-none">
      {/* Wikipedia info panel */}
      {selectedBody && (
        <div className="absolute top-4 right-4 md:top-6 md:right-6 z-40 w-[calc(100vw-32px)] sm:w-80 max-h-[calc(100vh-120px)] overflow-y-auto bg-black/85 backdrop-blur-2xl border border-white/15 p-4 md:p-5 rounded-2xl shadow-2xl flex flex-col gap-3.5 mt-20">
          <div className="w-full h-32 md:h-40 rounded-xl overflow-hidden border border-white/10 relative bg-black/50">
            {selectedBody.image ? (
              <img
                src={selectedBody.image}
                alt={selectedBody.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-white/40">
                Loading Wikipedia Image...
              </div>
            )}
          </div>

          <div className="flex justify-between items-center border-b border-white/10 pb-2">
            <h2 className="text-lg md:text-xl font-bold text-cyan-400">{selectedBody.name}</h2>
            <span className="text-[10px] bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded border border-cyan-500/30 uppercase tracking-widest font-semibold">
              Wikipedia
            </span>
          </div>

          {selectedBody.moons && selectedBody.moons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              <span className="text-[10px] text-white/50">Moons:</span>
              {selectedBody.moons.map((moon, idx) => (
                <span
                  key={idx}
                  className="text-[10px] bg-white/5 px-1.5 py-0.5 rounded text-white/70"
                >
                  {moon.name}
                </span>
              ))}
            </div>
          )}

          <p className="text-xs text-white/80 leading-relaxed">{selectedBody.description}</p>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 px-3 py-2 rounded-2xl flex items-center gap-2 shadow-2xl overflow-x-auto max-w-[95vw] bg-black/30 backdrop-blur-sm border border-white/5">
        {/* Mute / Unmute Button */}
        <button
          onClick={toggleMute}
          title={isMuted ? 'Unmute Music' : 'Mute Music'}
          aria-label={isMuted ? 'Unmute Music' : 'Mute Music'}
          className={`p-1.5 rounded-xl transition-all flex items-center justify-center cursor-pointer flex-shrink-0 ${
            isMuted
              ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
              : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30'
          }`}
        >
          {isMuted ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-4 h-4"
            >
              <path d="M11 5L6 9H2v6h4l5 4V5z" />
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
            </svg>
          )}
        </button>

        {/* Clear Button */}
        <button
          onClick={() => setSelectedBody(null)}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
            selectedBody === null
              ? 'bg-red-500/20 text-red-400 border border-red-500/30'
              : 'bg-white/5 text-white/50 hover:bg-white/10 hover:text-white'
          }`}
        >
          Clear
        </button>

        {celestialBodies.map((body) => (
          <button
            key={body.name}
            onClick={() => {
              setIsGalacticView(false);
              setSelectedBody(body);
            }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              selectedBody?.name === body.name && !isGalacticView
                ? 'bg-cyan-500 text-black'
                : 'bg-white/5 text-white/70 hover:bg-white/10'
            }`}
          >
            {body.name}
            {body.moons && body.moons.length > 0 && (
              <span className="ml-1 text-[8px] opacity-50">({body.moons.length})</span>
            )}
          </button>
        ))}

        <div className="w-[1px] h-5 bg-white/20 mx-1"></div>

        <button
          onClick={() => {
            setIsGalacticView(!isGalacticView);
            setSelectedBody(null);
          }}
          className="relative w-14 h-6 rounded-full transition-colors duration-300 cursor-pointer flex-shrink-0"
          style={{
            backgroundColor: isGalacticView ? '#a855f7' : 'rgba(168, 85, 247, 0.2)',
            border: isGalacticView ? 'none' : '1px solid rgba(168, 85, 247, 0.3)',
          }}
        >
          <span
            className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform duration-300 shadow-md"
            style={{
              transform: isGalacticView ? 'translateX(30px)' : 'translateX(0)',
            }}
          />
        </button>
      </div>

      {/* 3D Canvas */}
      <Canvas
        camera={{
          position: [0, isGalacticView ? 60 : 20, isGalacticView ? 90 : 35],
          fov: 50,
        }}
        className="w-full h-full"
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
        }}
      >
        <ambientLight intensity={0.3} />
        <directionalLight position={[10, 10, 10]} intensity={0.5} />

        <RealisticSpiralGalaxy isGalacticView={isGalacticView} />

        <SolarSystemGroup
          selectedBody={selectedBody}
          onSelect={setSelectedBody}
          isGalacticView={isGalacticView}
        />

        <Stars
          radius={300}
          depth={100}
          count={20000}
          factor={4}
          saturation={0}
          fade
          speed={0.5}
        />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          maxDistance={isGalacticView ? 300 : 80}
          minDistance={isGalacticView ? 20 : 3}
          autoRotate={false}
          autoRotateSpeed={0.3}
        />
      </Canvas>
    </div>
  );
}