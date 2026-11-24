'use client';

import React, { useEffect, useRef, useState } from 'react';

type Bullet = {
  x: number;
  y: number;
  vx: number;
  vy: number;
};

type Mosquito = {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  wobbleOffset: number;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

export default function MosquitoGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Load the face pictures
  const imgAimRef = useRef<HTMLImageElement | null>(null);
  const imgBiteRef = useRef<HTMLImageElement | null>(null);

  // States to determine which reaction picture to display
  // We'll track the reaction using frames so the visual doesn't disappear too instantly
  const reactionTimerRef = useRef(0);
  const currentFaceRef = useRef<'aim' | 'bite'>('aim');

  // Game state refs
  const mouseRef = useRef({ x: 400, y: 200 });
  const bulletsRef = useRef<Bullet[]>([]);
  const mosquitoesRef = useRef<Mosquito[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const healthRef = useRef(100);
  const scoreRef = useRef(0);
  const frameCountRef = useRef(0);
  const mosquitoSpawnCountRef = useRef(0);
  const isMutedRef = useRef(false);

  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PLAYER_X = CANVAS_WIDTH / 2;
  const PLAYER_Y = CANVAS_HEIGHT - 60;

  // Initialize images on the client
  useEffect(() => {
    const imgAim = new Image();
    imgAim.src = '/media/onaim.png';
    imgAimRef.current = imgAim;

    const imgBite = new Image();
    imgBite.src = '/media/onbite.png';
    imgBiteRef.current = imgBite;
  }, []);

  const toggleMute = () => {
    setIsMuted((prev) => {
      isMutedRef.current = !prev;
      return !prev;
    });
  };

  const playSound = (src: string, volume = 0.7) => {
    if (isMutedRef.current) return;
    try {
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (err) {
      console.error('Audio playback failed:', err);
    }
  };

  const triggerReaction = (face: 'aim' | 'bite', duration = 30) => {
    currentFaceRef.current = face;
    reactionTimerRef.current = duration; // visible for custom frame count (e.g., 30 frames is ~0.5s)
  };

  const resetGame = () => {
    bulletsRef.current = [];
    mosquitoesRef.current = [];
    particlesRef.current = [];
    healthRef.current = 100;
    scoreRef.current = 0;
    frameCountRef.current = 0;
    mosquitoSpawnCountRef.current = 0;
    reactionTimerRef.current = 0;
    currentFaceRef.current = 'aim';
    setScore(0);
    setHealth(100);
    setGameOver(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    mouseRef.current = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleShoot = () => {
    if (gameOver) return;

    // Change visual face back to shooting/aiming
    triggerReaction('aim', 25);
    playSound('/media/onshoot.mp3', 0.6);

    const angle = Math.atan2(
      mouseRef.current.y - PLAYER_Y,
      mouseRef.current.x - PLAYER_X
    );
    const speed = 12;

    bulletsRef.current.push({
      x: PLAYER_X,
      y: PLAYER_Y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  };

  useEffect(() => {
    if (gameOver) return;

    let animationFrameId: number;

    const spawnMosquito = () => {
      const side = Math.floor(Math.random() * 3);
      let x = 0;
      let y = 0;

      if (side === 0) {
        x = Math.random() * CANVAS_WIDTH;
        y = -20;
      } else if (side === 1) {
        x = -20;
        y = Math.random() * (CANVAS_HEIGHT * 0.6);
      } else {
        x = CANVAS_WIDTH + 20;
        y = Math.random() * (CANVAS_HEIGHT * 0.6);
      }

      const angle = Math.atan2(PLAYER_Y - y, PLAYER_X - x);
      const speed = 1.5 + Math.random() * 1.2 + scoreRef.current * 0.002;

      mosquitoSpawnCountRef.current += 1;
      const arriveSound =
        mosquitoSpawnCountRef.current % 2 === 1
          ? '/media/onarrive1.mp3'
          : '/media/oarrive2.mp3';
      playSound(arriveSound, 0.5);

      mosquitoesRef.current.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 12,
        wobbleOffset: Math.random() * Math.PI * 2,
      });
    };

    const createSplash = (x: number, y: number, color: string) => {
      for (let i = 0; i < 8; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 20,
          color,
        });
      }
    };

    const updateAndRender = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      frameCountRef.current++;

      // Handle the visual switch between reactions (default to aiming if no active reaction)
      if (reactionTimerRef.current > 0) {
        reactionTimerRef.current--;
      } else {
        currentFaceRef.current = 'aim';
      }

      const spawnRate = Math.max(25, 70 - Math.floor(scoreRef.current / 50));
      if (frameCountRef.current % spawnRate === 0) {
        spawnMosquito();
      }

      // 1. CLEAR BACKGROUND
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // 2. DRAW BED
      ctx.fillStyle = '#78350f'; // wood frame
      ctx.fillRect(PLAYER_X - 100, PLAYER_Y - 30, 200, 90);
      ctx.fillStyle = '#3b82f6'; // blanket
      ctx.fillRect(PLAYER_X - 90, PLAYER_Y - 10, 180, 65);
      ctx.fillStyle = '#e2e8f0'; // pillow
      ctx.fillRect(PLAYER_X - 50, PLAYER_Y - 25, 100, 25);

      // 3. DRAW PLAYABLE PICTURE (MAN'S REACTION FACE)
      const faceImg = currentFaceRef.current === 'bite' ? imgBiteRef.current : imgAimRef.current;
      const faceRadius = 24; // Circle radius for photo
      const faceY = PLAYER_Y - 16;

      ctx.save();
      // Clip image into a circular head on the bed
      ctx.beginPath();
      ctx.arc(PLAYER_X, faceY, faceRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (faceImg && faceImg.complete) {
        // Draw image stretched to cover the circle
        ctx.drawImage(
          faceImg,
          PLAYER_X - faceRadius,
          faceY - faceRadius,
          faceRadius * 2,
          faceRadius * 2
        );
      } else {
        // Fallback drawing if image fails to load or hasn't loaded yet
        ctx.fillStyle = currentFaceRef.current === 'bite' ? '#f87171' : '#fed7aa';
        ctx.beginPath();
        ctx.arc(PLAYER_X, faceY, faceRadius, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Border for face picture to blend with game style
      ctx.strokeStyle = currentFaceRef.current === 'bite' ? '#ef4444' : '#60a5fa';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(PLAYER_X, faceY, faceRadius, 0, Math.PI * 2);
      ctx.stroke();

      // "ouch!" text popup during bites
      if (currentFaceRef.current === 'bite' && reactionTimerRef.current > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 16px Courier New, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText("OUCH! BITTEN!", PLAYER_X, PLAYER_Y - 48);
      }

      // 4. DRAW AIMING LASER & GUN ARM
      const aimAngle = Math.atan2(
        mouseRef.current.y - PLAYER_Y,
        mouseRef.current.x - PLAYER_X
      );
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.25)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(PLAYER_X, PLAYER_Y);
      ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
      ctx.stroke();

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(PLAYER_X, PLAYER_Y);
      ctx.lineTo(
        PLAYER_X + Math.cos(aimAngle) * 35,
        PLAYER_Y + Math.sin(aimAngle) * 35
      );
      ctx.stroke();

      // 5. UPDATE & DRAW BULLETS
      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;

        const isInside =
          b.x > 0 && b.x < CANVAS_WIDTH && b.y > 0 && b.y < CANVAS_HEIGHT;

        if (!isInside) {
          playSound('/media/onmiss.mp3', 0.5);
          return false;
        }

        ctx.fillStyle = '#facc15';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // 6. UPDATE & DRAW MOSQUITOES
      const remainingMosquitoes: Mosquito[] = [];

      for (const m of mosquitoesRef.current) {
        const jitterX = Math.sin(frameCountRef.current * 0.2 + m.wobbleOffset) * 1.5;
        const jitterY = Math.cos(frameCountRef.current * 0.2 + m.wobbleOffset) * 1.5;

        m.x += m.vx + jitterX;
        m.y += m.vy + jitterY;

        // Check if shot
        let hit = false;
        bulletsRef.current = bulletsRef.current.filter((b) => {
          const dist = Math.hypot(b.x - m.x, b.y - m.y);
          if (dist < m.radius + 5) {
            hit = true;
            return false;
          }
          return true;
        });

        if (hit) {
          scoreRef.current += 10;
          setScore(scoreRef.current);
          createSplash(m.x, m.y, '#ef4444');
          continue;
        }

        // Check if bite happens
        const distToPlayer = Math.hypot(m.x - PLAYER_X, m.y - PLAYER_Y);
        if (distToPlayer < 45) {
          triggerReaction('bite', 45); // Hold onbite face for ~0.75 seconds on bite
          playSound('/media/onbite.mp3', 0.8);
          healthRef.current = Math.max(0, healthRef.current - 15);
          setHealth(healthRef.current);
          createSplash(PLAYER_X, PLAYER_Y - 10, '#dc2626');

          if (healthRef.current <= 0) {
            setGameOver(true);
          }
          continue;
        }

        // Mosquito Design
        ctx.fillStyle = '#a3e635';
        ctx.beginPath();
        ctx.arc(m.x, m.y, 6, 0, Math.PI * 2);
        ctx.fill();

        const wingFlap = Math.sin(frameCountRef.current * 0.8) * 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.beginPath();
        ctx.ellipse(m.x - 6, m.y - 3, 7, Math.abs(wingFlap) + 2, -0.4, 0, Math.PI * 2);
        ctx.ellipse(m.x + 6, m.y - 3, 7, Math.abs(wingFlap) + 2, 0.4, 0, Math.PI * 2);
        ctx.fill();

        remainingMosquitoes.push(m);
      }
      mosquitoesRef.current = remainingMosquitoes;

      // 7. PARTICLES
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 20;
        ctx.fillRect(p.x, p.y, 4, 4);
        ctx.globalAlpha = 1;

        return p.life > 0;
      });

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver]);

  return (
    <div className="flex flex-col items-center gap-4 p-6 select-none">
      {/* HUD */}
      <div className="flex items-center justify-between w-[800px] bg-slate-900 px-6 py-3 rounded-lg border border-slate-700">
        <div className="text-xl font-bold text-yellow-400">Score: {score}</div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-slate-300">
              Sleep Peace (HP):
            </span>
            <div className="w-48 h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
              <div
                className={`h-full transition-all duration-200 ${
                  health > 50 ? 'bg-green-500' : health > 25 ? 'bg-yellow-500' : 'bg-red-600'
                }`}
                style={{ width: `${health}%` }}
              />
            </div>
          </div>

          <button
            onClick={toggleMute}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 border border-slate-600 rounded text-sm font-medium text-slate-200 transition"
          >
            {isMuted ? '🔇 Unmute' : '🔊 Mute'}
          </button>
        </div>
      </div>

      {/* Game Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onMouseMove={handleMouseMove}
          onClick={handleShoot}
          className="border-2 border-slate-700 rounded-lg cursor-crosshair shadow-2xl"
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-lg text-white">
            <h2 className="text-4xl font-extrabold text-red-500 mb-2">Too Many Bites!</h2>
            <p className="text-lg text-slate-300 mb-6">
              Final Score: <span className="font-bold text-yellow-400">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg font-bold text-lg transition"
            >
              Try Sleeping Again
            </button>
          </div>
        )}
      </div>

      <p className="text-sm text-slate-400">
        Move your mouse to aim the laser • Click anywhere to shoot the mosquitoes before they reach the bed!
      </p>
    </div>
  );
}