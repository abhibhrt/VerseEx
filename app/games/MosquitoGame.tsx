'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaExpand } from 'react-icons/fa';
import GameShell, { Dimensions } from './GameShell';

const MEDIA_BASE =
  'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/Mosquito-Killer';

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

type MosquitoGameProps = {
  onExit: () => void;
};

export default function MosquitoGame({ onExit }: MosquitoGameProps) {
  const [score, setScore] = useState(0);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);

  const playSoundRef = useRef<(fileName: string, volume?: number) => void>(() => {});

  // Face reaction images (.png)
  const imgAimRef = useRef<HTMLImageElement | null>(null);
  const imgBiteRef = useRef<HTMLImageElement | null>(null);

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
  const gameOverRef = useRef(false);

  // Preload .png images from GitHub
  useEffect(() => {
    const imgAim = new Image();
    imgAim.crossOrigin = 'anonymous';
    imgAim.src = `${MEDIA_BASE}/onaim.png`;
    imgAimRef.current = imgAim;

    const imgBite = new Image();
    imgBite.crossOrigin = 'anonymous';
    imgBite.src = `${MEDIA_BASE}/onbite.png`;
    imgBiteRef.current = imgBite;
  }, []);

  const triggerGameOver = useCallback(() => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    playSoundRef.current('over.mp3', 0.85);
    setGameOver(true);
  }, []);

  const triggerReaction = (face: 'aim' | 'bite', duration = 30) => {
    currentFaceRef.current = face;
    reactionTimerRef.current = duration;
  };

  const resetGame = useCallback(() => {
    bulletsRef.current = [];
    mosquitoesRef.current = [];
    particlesRef.current = [];
    healthRef.current = 100;
    scoreRef.current = 0;
    frameCountRef.current = 0;
    mosquitoSpawnCountRef.current = 0;
    reactionTimerRef.current = 0;
    gameOverRef.current = false;
    currentFaceRef.current = 'aim';
    setScore(0);
    setHealth(100);
    setGameOver(false);
  }, []);

  const getLogicalCoords = (
    clientX: number,
    clientY: number,
    rect: DOMRect,
    dims: Dimensions
  ) => ({
    x: ((clientX - rect.left) / rect.width) * dims.width,
    y: ((clientY - rect.top) / rect.height) * dims.height,
  });

  const fireAt = (targetX: number, targetY: number, dims: Dimensions) => {
    if (gameOverRef.current) return;
    mouseRef.current = { x: targetX, y: targetY };

    triggerReaction('aim', 25);
    playSoundRef.current('onshoot.mp3', 0.6);

    const playerX = dims.width / 2;
    const playerY = dims.height - 85;
    const gunOriginX = playerX;
    const gunOriginY = playerY + 26;

    const angle = Math.atan2(targetY - gunOriginY, targetX - gunOriginX);
    const speed = 13;

    bulletsRef.current.push({
      x: gunOriginX + Math.cos(angle) * 38,
      y: gunOriginY + Math.sin(angle) * 38,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
    });
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, dims: Dimensions) => {
      mouseRef.current = getLogicalCoords(
        e.clientX,
        e.clientY,
        e.currentTarget.getBoundingClientRect(),
        dims
      );
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, dims: Dimensions) => {
      const coords = getLogicalCoords(
        e.clientX,
        e.clientY,
        e.currentTarget.getBoundingClientRect(),
        dims
      );
      fireAt(coords.x, coords.y, dims);
    },
    []
  );

  const renderCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, dims: Dimensions) => {
      const { width, height } = dims;
      const playerX = width / 2;
      const playerY = height - 85;

      const spawnMosquito = () => {
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
        const speed = 1.5 + Math.random() * 1.0 + scoreRef.current * 0.0015;

        mosquitoSpawnCountRef.current += 1;
        if (mosquitoSpawnCountRef.current % 2 === 0) {
          const arriveSound =
            (mosquitoSpawnCountRef.current / 2) % 2 === 1
              ? 'onarrive1.mp3'
              : 'oarrive2.mp3';
          playSoundRef.current(arriveSound, 0.5);
        }

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

      const drawMosquito = (m: Mosquito, frame: number) => {
        const angle = Math.atan2(m.vy, m.vx);

        ctx.save();
        ctx.translate(m.x, m.y);
        ctx.rotate(angle);

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

        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.ellipse(-10, 0, 10, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#e2e8f0';
        ctx.fillRect(-15, -3, 2.2, 6);
        ctx.fillRect(-10, -3.5, 2.2, 7);
        ctx.fillRect(-5, -3, 2.2, 6);

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.arc(0, 0, 5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(6.5, 0, 3.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(7.5, -1.6, 1.3, 0, Math.PI * 2);
        ctx.arc(7.5, 1.6, 1.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(9, 0);
        ctx.lineTo(20, 0);
        ctx.stroke();

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

      const drawScene = () => {
        const wallGrad = ctx.createLinearGradient(0, 0, 0, height);
        wallGrad.addColorStop(0, '#090d16');
        wallGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = wallGrad;
        ctx.fillRect(0, 0, width, height);

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

        ctx.fillStyle = '#27170d';
        ctx.fillRect(0, height - 45, width, 45);

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

        ctx.fillStyle = '#f1f5f9';
        ctx.beginPath();
        ctx.roundRect(bedX, playerY - 25, bedW, 85, 8);
        ctx.fill();

        const pillowW = Math.min(130, bedW * 0.55);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(playerX - pillowW / 2, playerY - 45, pillowW, 42, 14);
        ctx.fill();

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

        ctx.fillStyle = '#451a03';
        ctx.fillRect(bedX - 10, height - 22, bedW + 20, 22);

        const faceImg =
          currentFaceRef.current === 'bite' ? imgBiteRef.current : imgAimRef.current;
        const faceSize = 68;
        const faceX = playerX - faceSize / 2;
        const faceY = playerY - 62;

        if (faceImg && faceImg.complete && faceImg.naturalWidth > 0) {
          const imgAspect = faceImg.naturalWidth / faceImg.naturalHeight;
          let drawW = faceSize;
          let drawH = faceSize;
          if (imgAspect > 1) {
            drawH = faceSize / imgAspect;
          } else {
            drawW = faceSize * imgAspect;
          }
          ctx.drawImage(
            faceImg,
            playerX - drawW / 2,
            faceY + (faceSize - drawH) / 2,
            drawW,
            drawH
          );
        } else {
          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(faceX, faceY, faceSize, faceSize);
        }

        if (currentFaceRef.current === 'bite' && reactionTimerRef.current > 0) {
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 18px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('OUCH! BITTEN!', playerX, faceY - 8);
        }

        const gunOriginX = playerX;
        const gunOriginY = playerY + 26;
        const shoulderX = playerX + 36;
        const shoulderY = playerY + 6;

        const aimAngle = Math.atan2(
          mouseRef.current.y - gunOriginY,
          mouseRef.current.x - gunOriginX
        );

        ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(gunOriginX, gunOriginY);
        ctx.lineTo(mouseRef.current.x, mouseRef.current.y);
        ctx.stroke();
        ctx.setLineDash([]);

        const elbowX = shoulderX + 12;
        const elbowY = shoulderY + 16;

        ctx.strokeStyle = '#475569';
        ctx.lineCap = 'round';
        ctx.lineWidth = 13;
        ctx.beginPath();
        ctx.moveTo(shoulderX, shoulderY);
        ctx.lineTo(elbowX, elbowY);
        ctx.stroke();

        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.moveTo(elbowX, elbowY);
        ctx.lineTo(gunOriginX, gunOriginY);
        ctx.stroke();

        ctx.save();
        ctx.translate(gunOriginX, gunOriginY);
        ctx.rotate(aimAngle);

        ctx.fillStyle = '#090d16';
        ctx.beginPath();
        ctx.roundRect(-6, -2, 12, 14, 3);
        ctx.fill();

        ctx.fillStyle = '#0f172a';
        ctx.strokeStyle = '#334155';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(-4, -7, 36, 12, 4);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#1e293b';
        ctx.fillRect(2, -9, 22, 3);

        ctx.fillStyle = '#475569';
        ctx.fillRect(4, -4, 24, 1.5);

        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.roundRect(32, -5.5, 6, 9, 2);
        ctx.fill();

        ctx.fillStyle = '#fed7aa';
        ctx.strokeStyle = '#d97706';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.roundRect(-5, -3, 14, 12, 5);
        ctx.fill();
        ctx.stroke();

        ctx.strokeStyle = '#c28b59';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(-1, 2);
        ctx.lineTo(6, 2);
        ctx.moveTo(-1, 5.5);
        ctx.lineTo(6, 5.5);
        ctx.stroke();

        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.ellipse(3, -5, 5, 2.8, -0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      };

      frameCountRef.current++;

      if (reactionTimerRef.current > 0) {
        reactionTimerRef.current--;
      } else {
        currentFaceRef.current = 'aim';
      }

      const spawnRate = Math.max(45, 105 - Math.floor(scoreRef.current / 80));
      if (frameCountRef.current % spawnRate === 0) {
        spawnMosquito();
      }

      drawScene();

      bulletsRef.current = bulletsRef.current.filter((b) => {
        b.x += b.vx;
        b.y += b.vy;

        const isInside = b.x > 0 && b.x < width && b.y > 0 && b.y < height;

        if (!isInside) {
          playSoundRef.current('onmiss.mp3', 0.5);
          return false;
        }

        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(b.x, b.y, 4.5, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

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
          playSoundRef.current('onbite.mp3', 0.8);
          healthRef.current = Math.max(0, healthRef.current - 15);
          setHealth(healthRef.current);
          createSplash(playerX, playerY - 20, '#dc2626');

          if (healthRef.current <= 0) {
            triggerGameOver();
          }
          continue;
        }

        drawMosquito(m, frameCountRef.current);
        remainingMosquitoes.push(m);
      }
      mosquitoesRef.current = remainingMosquitoes;

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
    },
    [triggerGameOver]
  );

  return (
    <GameShell
      mediaBase={MEDIA_BASE}
      score={score}
      initialScore={0}
      health={health}
      gameOver={gameOver}
      gameOverTitle="Too Many Bites!"
      gameOverMessage={
        <>
          Final Score:{' '}
          <span className="font-bold text-yellow-400">{score}</span>
        </>
      }
      restartLabel="Try Sleeping Again"
      canvasCursorClass="cursor-crosshair"
      onReset={resetGame}
      onExit={onExit}
      renderCanvas={renderCanvas}
      onPointerMoveCanvas={handlePointerMove}
      onPointerDownCanvas={handlePointerDown}
      registerSoundPlayer={(fn) => {
        playSoundRef.current = fn;
      }}
      footerHint={
        <>
          <span>Tap anywhere to shoot • Tap</span>
          <FaExpand className="text-slate-200 inline" />
          <span>at top-right for edge-to-edge mobile play</span>
        </>
      }
    />
  );
}