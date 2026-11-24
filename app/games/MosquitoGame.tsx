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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Face reaction images (.png)
  const imgAimRef = useRef<HTMLImageElement | null>(null);
  const imgBiteRef = useRef<HTMLImageElement | null>(null);

  const reactionTimerRef = useRef(0);
  const currentFaceRef = useRef<'aim' | 'bite'>('aim');

  // Dynamic logical dimensions so mobile portrait fills the whole screen cleanly
  const dimensionsRef = useRef({ width: 800, height: 500 });

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

  // Preload .png images
  useEffect(() => {
    const imgAim = new Image();
    imgAim.src = '/media/onaim.png';
    imgAimRef.current = imgAim;

    const imgBite = new Image();
    imgBite.src = '/media/onbite.png';
    imgBiteRef.current = imgBite;
  }, []);

  // Match canvas internal resolution to actual container aspect ratio (fixes mobile portrait squish)
  useEffect(() => {
    const updateCanvasResolution = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const aspect = rect.width / rect.height;
      // Keep a consistent logical height/width scale while matching screen shape
      if (aspect < 1) {
        // Mobile Portrait
        const logicalWidth = 480;
        const logicalHeight = Math.round(logicalWidth / aspect);
        canvas.width = logicalWidth;
        canvas.height = logicalHeight;
        dimensionsRef.current = { width: logicalWidth, height: logicalHeight };
      } else {
        // Desktop or Mobile Landscape
        const logicalHeight = 500;
        const logicalWidth = Math.round(logicalHeight * aspect);
        canvas.width = logicalWidth;
        canvas.height = logicalHeight;
        dimensionsRef.current = { width: logicalWidth, height: logicalHeight };
      }
    };

    updateCanvasResolution();
    window.addEventListener('resize', updateCanvasResolution);
    return () => window.removeEventListener('resize', updateCanvasResolution);
  }, [isFullscreen]);

  // Sync native fullscreen exit (Esc key / system back gesture)
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Hybrid Fullscreen: uses Native API + CSS fixed-inset fallback (works on iOS Safari too!)
  const toggleFullscreen = async () => {
    const nextState = !isFullscreen;
    setIsFullscreen(nextState);

    try {
      if (nextState && containerRef.current && !document.fullscreenElement) {
        await containerRef.current.requestFullscreen?.();
      } else if (!nextState && document.fullscreenElement) {
        await document.exitFullscreen?.();
      }
    } catch {
      // iOS Safari throws here—CSS fixed fullscreen state still fills 100% of screen!
    }
  };

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
    reactionTimerRef.current = duration;
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

  const getLogicalCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 240, y: 200 };
    const rect = canvas.getBoundingClientRect();
    const { width, height } = dimensionsRef.current;
    return {
      x: ((clientX - rect.left) / rect.width) * width,
      y: ((clientY - rect.top) / rect.height) * height,
    };
  };

  const fireAt = (targetX: number, targetY: number) => {
    if (gameOver) return;
    mouseRef.current = { x: targetX, y: targetY };

    triggerReaction('aim', 25);
    playSound('/media/onshoot.mp3', 0.6);

    const { width, height } = dimensionsRef.current;
    const playerX = width / 2;
    const gunOriginY = height - 90;

    const angle = Math.atan2(targetY - gunOriginY, targetX - playerX);
    const speed = 13;

    bulletsRef.current.push({
      x: playerX + Math.cos(angle) * 35,
      y: gunOriginY + Math.sin(angle) * 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    mouseRef.current = getLogicalCoords(e.clientX, e.clientY);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getLogicalCoords(e.clientX, e.clientY);
    fireAt(coords.x, coords.y);
  };

  useEffect(() => {
    if (gameOver) return;

    let animationFrameId: number;

    const spawnMosquito = () => {
      const { width, height } = dimensionsRef.current;
      const playerX = width / 2;
      const playerY = height - 85;

      const side = Math.floor(Math.random() * 3);
      let x = 0;
      let y = 0;

      if (side === 0) {
        x = Math.random() * width;
        y = -20;
      } else if (side === 1) {
        x = -20;
        y = Math.random() * (height * 0.55);
      } else {
        x = width + 20;
        y = Math.random() * (height * 0.55);
      }

      const angle = Math.atan2(playerY - y, playerX - x);
      const speed = 1.6 + Math.random() * 1.1 + scoreRef.current * 0.002;

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
        radius: 18,
        wobbleOffset: Math.random() * Math.PI * 2,
      });
    };

    const createSplash = (x: number, y: number, color: string) => {
      for (let i = 0; i < 10; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3.5;
        particlesRef.current.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 22,
          color,
        });
      }
    };

    const drawMosquito = (ctx: CanvasRenderingContext2D, m: Mosquito, frame: number) => {
      const angle = Math.atan2(m.vy, m.vx);

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(angle);

      // 1. Long Thin Legs
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.6;
      for (let i = -1; i <= 1; i += 2) {
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(6, i * 12);
        ctx.lineTo(12, i * 16);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-5, i * 14);
        ctx.lineTo(-11, i * 18);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-15, i * 12);
        ctx.lineTo(-21, i * 15);
        ctx.stroke();
      }

      // 2. Striped Abdomen
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(-10, 0, 10, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-15, -3, 2.2, 6);
      ctx.fillRect(-10, -3.5, 2.2, 7);
      ctx.fillRect(-5, -3, 2.2, 6);

      // 3. Thorax
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Head & Glowing Red Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(6.5, 0, 3.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(7.5, -1.6, 1.3, 0, Math.PI * 2);
      ctx.arc(7.5, 1.6, 1.3, 0, Math.PI * 2);
      ctx.fill();

      // 5. Sharp Proboscis (Stinger)
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(9, 0);
      ctx.lineTo(20, 0);
      ctx.stroke();

      // 6. Fast-flapping translucent wings
      const wingSpread = Math.sin(frame * 1.1) * 7 + 10;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.6)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.lineWidth = 0.8;

      ctx.beginPath();
      ctx.ellipse(-3, -wingSpread * 0.7, 10, 3.8, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(-3, wingSpread * 0.7, 10, 3.8, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    const drawScene = (ctx: CanvasRenderingContext2D) => {
      const { width, height } = dimensionsRef.current;
      const playerX = width / 2;
      const playerY = height - 85;

      // 1. Bedroom Wall
      const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
      wallGrad.addColorStop(0, '#090d16');
      wallGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, width, height);

      // Bedroom Window
      const winX = Math.min(50, width * 0.08);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(winX, 45, 100, 130);
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(winX + 7, 52, 40, 54);
      ctx.fillRect(winX + 53, 52, 40, 54);
      ctx.fillRect(winX + 7, 112, 40, 56);
      ctx.fillRect(winX + 53, 112, 40, 56);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(winX + 28, 78, 11, 0, Math.PI * 2);
      ctx.fill();

      // Floorboard
      ctx.fillStyle = '#27170d';
      ctx.fillRect(0, height - 45, width, 45);

      // 2. Wooden Bed
      const bedW = Math.min(240, width * 0.56);
      const bedX = playerX - bedW / 2;

      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(bedX - 8, playerY - 75, bedW + 16, 85, [12, 12, 0, 0]);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.strokeRect(bedX + 4, playerY - 65, bedW / 2 - 10, 50);
      ctx.strokeRect(playerX + 6, playerY - 65, bedW / 2 - 10, 50);

      // Mattress
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(bedX, playerY - 25, bedW, 85, 8);
      ctx.fill();

      // Pillow
      const pillowW = Math.min(130, bedW * 0.55);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.roundRect(playerX - pillowW / 2, playerY - 45, pillowW, 42, 14);
      ctx.fill();

      // 3. Man's Pajama Shoulders & Blanket
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(playerX - 46, playerY - 8, 92, 35, 16);
      ctx.fill();

      const blanketGrad = ctx.createLinearGradient(0, playerY + 5, 0, height);
      blanketGrad.addColorStop(0, '#2563eb');
      blanketGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = blanketGrad;
      ctx.beginPath();
      ctx.roundRect(bedX - 4, playerY + 8, bedW + 8, 65, [12, 12, 4, 4]);
      ctx.fill();

      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(bedX - 4, playerY + 8, bedW + 8, 12);

      // Footboard
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bedX - 10, height - 22, bedW + 20, 22);

      // 4. Man's Face (.png)
      const faceImg =
        currentFaceRef.current === 'bite' ? imgBiteRef.current : imgAimRef.current;
      const faceRadius = 30;
      const faceY = playerY - 26;

      ctx.save();
      ctx.beginPath();
      ctx.arc(playerX, faceY, faceRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (faceImg && faceImg.complete && faceImg.naturalWidth > 0) {
        ctx.drawImage(
          faceImg,
          playerX - faceRadius,
          faceY - faceRadius,
          faceRadius * 2,
          faceRadius * 2
        );
      } else {
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(playerX - faceRadius, faceY - faceRadius, faceRadius * 2, faceRadius * 2);
      }
      ctx.restore();

      ctx.strokeStyle = currentFaceRef.current === 'bite' ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(playerX, faceY, faceRadius, 0, Math.PI * 2);
      ctx.stroke();

      if (currentFaceRef.current === 'bite' && reactionTimerRef.current > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OUCH! BITTEN!', playerX, faceY - 40);
      }

      // 5. Aiming Arm, Blaster & Laser
      const gunOriginY = playerY - 6;
      const aimAngle = Math.atan2(
        mouseRef.current.y - gunOriginY,
        mouseRef.current.x - playerX
      );

      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(playerX, gunOriginY);
      ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.save();
      ctx.translate(playerX, gunOriginY);
      ctx.rotate(aimAngle);

      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(0, -6, 26, 12, 6);
      ctx.fill();

      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(26, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(24, -5, 22, 10, 3);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.fillRect(44, -4, 4, 8);

      ctx.restore();
    };

    const updateAndRender = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const { width, height } = dimensionsRef.current;
      const playerX = width / 2;
      const playerY = height - 85;

      frameCountRef.current++;

      if (reactionTimerRef.current > 0) {
        reactionTimerRef.current--;
      } else {
        currentFaceRef.current = 'aim';
      }

      const spawnRate = Math.max(25, 70 - Math.floor(scoreRef.current / 50));
      if (frameCountRef.current % spawnRate === 0) {
        spawnMosquito();
      }

      drawScene(ctx);

      // Update & Draw Bullets
      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;

        const isInside = b.x > 0 && b.x < width && b.y > 0 && b.y < height;

        if (!isInside) {
          playSound('/media/onmiss.mp3', 0.5);
          return false;
        }

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      // Update & Draw Mosquitoes
      const remainingMosquitoes: Mosquito[] = [];

      for (const m of mosquitoesRef.current) {
        const jitterX = Math.sin(frameCountRef.current * 0.2 + m.wobbleOffset) * 1.6;
        const jitterY = Math.cos(frameCountRef.current * 0.2 + m.wobbleOffset) * 1.6;

        m.x += m.vx + jitterX;
        m.y += m.vy + jitterY;

        let hit = false;
        bulletsRef.current = bulletsRef.current.filter((b) => {
          const dist = Math.hypot(b.x - m.x, b.y - m.y);
          if (dist < m.radius + 8) {
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

        const distToPlayer = Math.hypot(m.x - playerX, m.y - (playerY - 20));
        if (distToPlayer < 48) {
          triggerReaction('bite', 45);
          playSound('/media/onbite.mp3', 0.8);
          healthRef.current = Math.max(0, healthRef.current - 15);
          setHealth(healthRef.current);
          createSplash(playerX, playerY - 20, '#dc2626');

          if (healthRef.current <= 0) {
            setGameOver(true);
          }
          continue;
        }

        drawMosquito(ctx, m, frameCountRef.current);
        remainingMosquitoes.push(m);
      }
      mosquitoesRef.current = remainingMosquitoes;

      // Update & Draw Splash Particles
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 22;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        return p.life > 0;
      });

      animationFrameId = requestAnimationFrame(updateAndRender);
    };

    animationFrameId = requestAnimationFrame(updateAndRender);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver]);

  return (
    <div
      ref={containerRef}
      className={
        isFullscreen
          ? 'fixed inset-0 z-50 w-screen h-dvh flex flex-col bg-slate-950 select-none overflow-hidden'
          : 'w-full min-h-dvh flex flex-col items-center justify-center bg-slate-950 p-2 sm:p-6 select-none'
      }
    >
      {/* Top HUD Bar */}
      <div
        className={`flex items-center justify-between gap-2 bg-slate-900 px-3 sm:px-5 py-2.5 border-slate-700 ${
          isFullscreen
            ? 'w-full border-b shrink-0'
            : 'w-full max-w-[800px] rounded-t-xl border border-b-0'
        }`}
      >
        <div className="text-sm sm:text-xl font-bold text-yellow-400 shrink-0">
          Score: {score}
        </div>

        {/* Health Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-[220px] mx-2">
          <span className="text-xs font-semibold text-slate-300 shrink-0">HP:</span>
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
            <div
              className={`h-full transition-all duration-200 ${
                health > 50
                  ? 'bg-green-500'
                  : health > 25
                  ? 'bg-yellow-500'
                  : 'bg-red-600'
              }`}
              style={{ width: `${health}%` }}
            />
          </div>
        </div>

        {/* Right Controls: Mute & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleMute}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 rounded-lg text-xs sm:text-sm font-medium text-slate-200 transition"
            title="Mute / Unmute"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg text-xs sm:text-sm font-semibold text-white transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '✕ Exit' : '⛶ Full'}
          </button>
        </div>
      </div>

      {/* Game Canvas Wrapper */}
      <div
        className={
          isFullscreen
            ? 'relative flex-1 w-full h-full overflow-hidden'
            : 'relative w-full max-w-[800px] h-[68dvh] sm:h-[500px]'
        }
      >
        <canvas
          ref={canvasRef}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          className={`w-full h-full block cursor-crosshair touch-none ${
            isFullscreen ? '' : 'border-2 border-slate-700 rounded-b-xl shadow-2xl'
          }`}
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-red-500 mb-2">
              Too Many Bites!
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-6">
              Final Score:{' '}
              <span className="font-bold text-yellow-400">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg font-bold text-base sm:text-lg transition"
            >
              Try Sleeping Again
            </button>
          </div>
        )}
      </div>

      {!isFullscreen && (
        <p className="text-xs sm:text-sm text-slate-400 text-center mt-2.5">
          Tap anywhere to shoot • Tap <strong>⛶ Full</strong> at top-right for edge-to-edge mobile play
        </p>
      )}
    </div>
  );
}