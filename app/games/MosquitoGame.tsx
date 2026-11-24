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

  // Logical canvas resolution (scales smoothly via CSS on mobile)
  const CANVAS_WIDTH = 800;
  const CANVAS_HEIGHT = 500;
  const PLAYER_X = CANVAS_WIDTH / 2;
  const PLAYER_Y = CANVAS_HEIGHT - 85;

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

  // Listen for fullscreen changes (e.g., pressing Esc)
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error('Fullscreen toggle failed:', err);
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

  // Convert screen coordinates (mouse or touch) to 800x500 logical canvas coordinates
  const getLogicalCoords = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 400, y: 200 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_WIDTH / rect.width;
    const scaleY = CANVAS_HEIGHT / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const fireAt = (targetX: number, targetY: number) => {
    if (gameOver) return;
    mouseRef.current = { x: targetX, y: targetY };

    triggerReaction('aim', 25);
    playSound('/media/onshoot.mp3', 0.6);

    const gunOriginY = PLAYER_Y - 10;
    const angle = Math.atan2(targetY - gunOriginY, targetX - PLAYER_X);
    const speed = 13;

    bulletsRef.current.push({
      x: PLAYER_X + Math.cos(angle) * 35,
      y: gunOriginY + Math.sin(angle) * 35,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  };

  // Desktop Pointer / Mouse Events
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getLogicalCoords(e.clientX, e.clientY);
    mouseRef.current = coords;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const coords = getLogicalCoords(e.clientX, e.clientY);
    fireAt(coords.x, coords.y);
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
        y = Math.random() * (CANVAS_HEIGHT * 0.55);
      } else {
        x = CANVAS_WIDTH + 20;
        y = Math.random() * (CANVAS_HEIGHT * 0.55);
      }

      const angle = Math.atan2(PLAYER_Y - y, PLAYER_X - x);
      const speed = 1.5 + Math.random() * 1.1 + scoreRef.current * 0.002;

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
        radius: 16,
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

    // Helper to draw a detailed mosquito rotated toward its flight direction
    const drawMosquito = (ctx: CanvasRenderingContext2D, m: Mosquito, frame: number) => {
      const angle = Math.atan2(m.vy, m.vx);

      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(angle);

      // 1. Long Thin Legs (3 pairs trailing backward)
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth = 1.5;
      for (let i = -1; i <= 1; i += 2) {
        // Front leg
        ctx.beginPath();
        ctx.moveTo(2, 0);
        ctx.lineTo(6, i * 11);
        ctx.lineTo(11, i * 15);
        ctx.stroke();

        // Middle leg
        ctx.beginPath();
        ctx.moveTo(-2, 0);
        ctx.lineTo(-5, i * 13);
        ctx.lineTo(-10, i * 17);
        ctx.stroke();

        // Back leg
        ctx.beginPath();
        ctx.moveTo(-6, 0);
        ctx.lineTo(-14, i * 11);
        ctx.lineTo(-20, i * 14);
        ctx.stroke();
      }

      // 2. Striped Abdomen (Tail)
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.ellipse(-10, 0, 9, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();

      // White stripes on abdomen
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(-14, -2.5, 2, 5);
      ctx.fillRect(-10, -3, 2, 6);
      ctx.fillRect(-6, -2.5, 2, 5);

      // 3. Thorax (Body center)
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(0, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();

      // 4. Head & Eyes
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.arc(6, 0, 3, 0, Math.PI * 2);
      ctx.fill();

      // Glowing red eyes
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(7, -1.5, 1.2, 0, Math.PI * 2);
      ctx.arc(7, 1.5, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // 5. Sharp Needle Proboscis (Stinger)
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(8, 0);
      ctx.lineTo(18, 0);
      ctx.stroke();

      // 6. Fast-flapping translucent wings
      const wingSpread = Math.sin(frame * 1.1) * 7 + 9;
      ctx.fillStyle = 'rgba(226, 232, 240, 0.55)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 0.8;

      // Left wing
      ctx.beginPath();
      ctx.ellipse(-3, -wingSpread * 0.7, 9, 3.5, -0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // Right wing
      ctx.beginPath();
      ctx.ellipse(-3, wingSpread * 0.7, 9, 3.5, 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      ctx.restore();
    };

    // Helper to draw a realistic bedroom, cozy bed, and man lying in bed
    const drawScene = (ctx: CanvasRenderingContext2D) => {
      // 1. Bedroom Wall & Moonlight Window
      const wallGrad = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
      wallGrad.addColorStop(0, '#090d16');
      wallGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = wallGrad;
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Bedroom Window (top left)
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(60, 45, 110, 140);
      // Window glass moonlight
      ctx.fillStyle = '#1e3a8a';
      ctx.fillRect(68, 53, 44, 58);
      ctx.fillRect(118, 53, 44, 58);
      ctx.fillRect(68, 117, 44, 60);
      ctx.fillRect(118, 117, 44, 60);
      // Moon
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(92, 80, 12, 0, Math.PI * 2);
      ctx.fill();

      // Wooden Floorboard at bottom
      ctx.fillStyle = '#27170d';
      ctx.fillRect(0, CANVAS_HEIGHT - 45, CANVAS_WIDTH, 45);

      // 2. Stylish Wooden Bed (Centered at bottom)
      const bedW = 240;
      const bedX = PLAYER_X - bedW / 2;

      // Headboard with wooden panels
      ctx.fillStyle = '#451a03';
      ctx.beginPath();
      ctx.roundRect(bedX - 8, PLAYER_Y - 75, bedW + 16, 85, [12, 12, 0, 0]);
      ctx.fill();

      ctx.strokeStyle = '#78350f';
      ctx.lineWidth = 3;
      ctx.strokeRect(bedX + 4, PLAYER_Y - 65, bedW / 2 - 12, 50);
      ctx.strokeRect(PLAYER_X + 8, PLAYER_Y - 65, bedW / 2 - 12, 50);

      // White Mattress
      ctx.fillStyle = '#f1f5f9';
      ctx.beginPath();
      ctx.roundRect(bedX, PLAYER_Y - 25, bedW, 85, 8);
      ctx.fill();

      // Fluffy Pillow
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.25)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.roundRect(PLAYER_X - 65, PLAYER_Y - 45, 130, 42, 14);
      ctx.fill();
      ctx.shadowBlur = 0;

      // 3. Man's Body & Arms Under Cozy Duvet/Blanket
      // Shoulders / Pajama shirt
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(PLAYER_X - 48, PLAYER_Y - 8, 96, 35, 16);
      ctx.fill();

      // Cozy Quilt / Blanket covering lower body
      const blanketGrad = ctx.createLinearGradient(0, PLAYER_Y + 5, 0, CANVAS_HEIGHT);
      blanketGrad.addColorStop(0, '#2563eb');
      blanketGrad.addColorStop(1, '#1d4ed8');
      ctx.fillStyle = blanketGrad;
      ctx.beginPath();
      ctx.roundRect(bedX - 4, PLAYER_Y + 8, bedW + 8, 65, [12, 12, 4, 4]);
      ctx.fill();

      // Folded top edge of blanket
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(bedX - 4, PLAYER_Y + 8, bedW + 8, 12);

      // Bed Footboard
      ctx.fillStyle = '#451a03';
      ctx.fillRect(bedX - 10, CANVAS_HEIGHT - 22, bedW + 20, 22);

      // 4. Man's Head (Using onaim.png / onbite.png)
      const faceImg =
        currentFaceRef.current === 'bite' ? imgBiteRef.current : imgAimRef.current;
      const faceRadius = 30;
      const faceY = PLAYER_Y - 26;

      ctx.save();
      ctx.beginPath();
      ctx.arc(PLAYER_X, faceY, faceRadius, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();

      if (faceImg && faceImg.complete && faceImg.naturalWidth > 0) {
        ctx.drawImage(
          faceImg,
          PLAYER_X - faceRadius,
          faceY - faceRadius,
          faceRadius * 2,
          faceRadius * 2
        );
      } else {
        // Fallback illustrated face if PNG isn't loaded yet
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(PLAYER_X - faceRadius, faceY - faceRadius, faceRadius * 2, faceRadius * 2);
      }
      ctx.restore();

      // Ring glow around face
      ctx.strokeStyle = currentFaceRef.current === 'bite' ? '#ef4444' : '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(PLAYER_X, faceY, faceRadius, 0, Math.PI * 2);
      ctx.stroke();

      // Bite alert text
      if (currentFaceRef.current === 'bite' && reactionTimerRef.current > 0) {
        ctx.fillStyle = '#ef4444';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('OUCH! BITTEN!', PLAYER_X, faceY - 40);
      }

      // 5. Aiming Arm, Blaster & Laser Sight
      const gunOriginY = PLAYER_Y - 6;
      const aimAngle = Math.atan2(
        mouseRef.current.y - gunOriginY,
        mouseRef.current.x - PLAYER_X
      );

      // Laser sight beam
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath();
      ctx.moveTo(PLAYER_X, gunOriginY);
      ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Aiming Arm & Toy Blaster rotated toward target
      ctx.save();
      ctx.translate(PLAYER_X, gunOriginY);
      ctx.rotate(aimAngle);

      // Arm sleeve
      ctx.fillStyle = '#475569';
      ctx.beginPath();
      ctx.roundRect(0, -6, 26, 12, 6);
      ctx.fill();

      // Hand
      ctx.fillStyle = '#fed7aa';
      ctx.beginPath();
      ctx.arc(26, 0, 6, 0, Math.PI * 2);
      ctx.fill();

      // Blaster barrel
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(24, -5, 22, 10, 3);
      ctx.fill();

      // Blaster tip
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(44, -4, 4, 8);

      ctx.restore();
    };

    const updateAndRender = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

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

      // Draw Bedroom, Bed, Man, and Aiming Blaster
      drawScene(ctx);

      // Update & Draw Bullets
      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;

        const isInside =
          b.x > 0 && b.x < CANVAS_WIDTH && b.y > 0 && b.y < CANVAS_HEIGHT;

        if (!isInside) {
          playSound('/media/onmiss.mp3', 0.5);
          return false;
        }

        ctx.fillStyle = '#fde047';
        ctx.shadowColor = '#facc15';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        return true;
      });

      // Update & Draw Mosquitoes
      const remainingMosquitoes: Mosquito[] = [];

      for (const m of mosquitoesRef.current) {
        const jitterX = Math.sin(frameCountRef.current * 0.2 + m.wobbleOffset) * 1.6;
        const jitterY = Math.cos(frameCountRef.current * 0.2 + m.wobbleOffset) * 1.6;

        m.x += m.vx + jitterX;
        m.y += m.vy + jitterY;

        // Check Bullet Hit
        let hit = false;
        bulletsRef.current = bulletsRef.current.filter((b) => {
          const dist = Math.hypot(b.x - m.x, b.y - m.y);
          if (dist < m.radius + 6) {
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

        // Check Bite on Man
        const distToPlayer = Math.hypot(m.x - PLAYER_X, m.y - (PLAYER_Y - 20));
        if (distToPlayer < 48) {
          triggerReaction('bite', 45);
          playSound('/media/onbite.mp3', 0.8);
          healthRef.current = Math.max(0, healthRef.current - 15);
          setHealth(healthRef.current);
          createSplash(PLAYER_X, PLAYER_Y - 20, '#dc2626');

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
      className={`flex flex-col items-center justify-center w-full select-none bg-slate-950 ${
        isFullscreen ? 'h-screen p-2 sm:p-4' : 'min-h-screen p-3 sm:p-6'
      }`}
    >
      {/* Responsive Top HUD Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 w-full max-w-[800px] bg-slate-900 px-3 sm:px-6 py-2.5 sm:py-3 rounded-t-xl border border-b-0 border-slate-700">
        <div className="text-base sm:text-xl font-bold text-yellow-400">
          Score: {score}
        </div>

        {/* Health Bar */}
        <div className="flex items-center gap-2 order-3 sm:order-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs sm:text-sm font-semibold text-slate-300">
            Sleep HP:
          </span>
          <div className="flex-1 sm:w-40 h-3.5 bg-slate-800 rounded-full overflow-hidden border border-slate-600">
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
        <div className="flex items-center gap-2 order-2 sm:order-3">
          <button
            onClick={toggleMute}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 rounded-lg text-xs sm:text-sm font-medium text-slate-200 transition"
            title="Mute / Unmute"
          >
            {isMuted ? '🔇' : '🔊'}
          </button>

          <button
            onClick={toggleFullscreen}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 rounded-lg text-xs sm:text-sm font-medium text-slate-200 transition flex items-center gap-1"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? '🗗 Exit' : '⛶ Fullscreen'}
          </button>
        </div>
      </div>

      {/* Responsive Canvas Container */}
      <div className="relative w-full max-w-[800px] aspect-[8/5] max-h-[80vh]">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          onPointerMove={handlePointerMove}
          onPointerDown={handlePointerDown}
          className="w-full h-full block border-2 border-slate-700 rounded-b-xl cursor-crosshair shadow-2xl touch-none"
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 rounded-b-xl text-white p-4 text-center">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-red-500 mb-2">
              Too Many Bites!
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-5">
              Final Score:{' '}
              <span className="font-bold text-yellow-400">{score}</span>
            </p>
            <button
              onClick={resetGame}
              className="px-5 py-2.5 sm:px-6 sm:py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg font-bold text-base sm:text-lg transition"
            >
              Try Sleeping Again
            </button>
          </div>
        )}
      </div>

      <p className="text-xs sm:text-sm text-slate-400 text-center mt-3">
        Tap anywhere on mobile (or click on desktop) to aim and shoot mosquitoes!
      </p>
    </div>
  );
}