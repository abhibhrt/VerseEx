'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaExpand } from 'react-icons/fa';
import GameShell, { Dimensions } from './GameShell';

const MEDIA_BASE =
  'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/SamosaStall';

const INITIAL_SCORE = 45;
const MAKE_COST = 5;
const SELL_REWARD = 10;
const MAKE_INTERVAL_FRAMES = 45;
const FRESH_THRESHOLD_FRAMES = 1800; // 30s fresh window
const EXPIRE_INTERVAL_FRAMES = 60; // kept for freshness bar scaling only

type SamosaItem = {
  id: number;
  age: number;
};

type PassengerWindow = {
  id: number;
  offsetX: number;
  wants: number;
  served: number;
  patience: number;
};

type TrainState = {
  phase: 'NONE' | 'APPROACHING' | 'STOPPED' | 'DEPARTING';
  x: number;
  stopX: number;
  stopTimer: number;
  trainNumber: number;
  arrivalNote: 'EARLY' | 'ON TIME' | 'LATE';
  announced: boolean;
  locoLaughTimer: number;
  windows: PassengerWindow[];
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
};

type FloatingText = {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  life: number;
};

type SamosaStationGameProps = {
  onExit: () => void;
};

export default function SamosaStationGame({ onExit }: SamosaStationGameProps) {
  const [score, setScore] = useState(INITIAL_SCORE);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'health' | 'bankrupt'>('health');

  const playSoundRef = useRef<(fileName: string, volume?: number) => void>(() => {});
  const isMutedRef = useRef(false);

  const loopAudioRef = useRef<{
    mode: 'NONE' | 'MAKING' | 'SELLING';
    audio: HTMLAudioElement | null;
  }>({
    mode: 'NONE',
    audio: null,
  });

  const imgSellerRef = useRef<HTMLImageElement | null>(null);
  const imgMakerRef = useRef<HTMLImageElement | null>(null);
  const imgLocoRef = useRef<HTMLImageElement | null>(null);

  const locoLaughCooldownRef = useRef(0);

  const dimsRef = useRef<Dimensions>({ width: 800, height: 500 });
  const sellerRef = useRef({ x: 75, y: 420 });
  const targetRef = useRef({ x: 75, y: 420 });

  const samosasRef = useRef<SamosaItem[]>([]);
  const stallMakeTimerRef = useRef(0);

  const nextTrainCooldownRef = useRef(260);
  const pendingArrivalNoteRef = useRef<'EARLY' | 'ON TIME' | 'LATE'>('ON TIME');
  const trainCounterRef = useRef(0);

  const trainRef = useRef<TrainState>({
    phase: 'NONE',
    x: -700,
    stopX: 520,
    stopTimer: 0,
    trainNumber: 0,
    arrivalNote: 'ON TIME',
    announced: false,
    locoLaughTimer: 0,
    windows: [],
  });

  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const scoreRef = useRef(INITIAL_SCORE);
  const healthRef = useRef(100);
  const gameOverRef = useRef(false);
  const frameCountRef = useRef(0);

  const stopLoopAudio = useCallback(() => {
    if (loopAudioRef.current.audio) {
      try {
        loopAudioRef.current.audio.pause();
        loopAudioRef.current.audio.currentTime = 0;
      } catch {
        // Ignore
      }
    }
    loopAudioRef.current = { mode: 'NONE', audio: null };
  }, []);

  const syncZoneLoopAudio = useCallback(
    (desiredMode: 'NONE' | 'MAKING' | 'SELLING') => {
      if (isMutedRef.current || gameOverRef.current || desiredMode === 'NONE') {
        if (loopAudioRef.current.mode !== 'NONE') {
          stopLoopAudio();
        }
        return;
      }

      if (loopAudioRef.current.mode === desiredMode && loopAudioRef.current.audio) {
        if (loopAudioRef.current.audio.paused) {
          loopAudioRef.current.audio.play().catch(() => {});
        }
        return;
      }

      stopLoopAudio();
      const fileName = desiredMode === 'MAKING' ? 'onMaking.mp3' : 'onSelling.mp3';
      try {
        const audio = new Audio(`${MEDIA_BASE}/${fileName}`);
        audio.loop = true;
        audio.volume = desiredMode === 'MAKING' ? 0.65 : 0.7;
        loopAudioRef.current = { mode: desiredMode, audio };
        audio.play().catch(() => {});
      } catch (err) {
        console.error('Loop audio playback failed:', err);
      }
    },
    [stopLoopAudio]
  );

  const handleMuteChange = useCallback((muted: boolean) => {
    isMutedRef.current = muted;
    if (muted && loopAudioRef.current.audio) {
      loopAudioRef.current.audio.pause();
    } else if (!muted && loopAudioRef.current.audio && !gameOverRef.current) {
      loopAudioRef.current.audio.play().catch(() => {});
    }
  }, []);

  useEffect(() => {
    const loadImg = (fileName: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${MEDIA_BASE}/${fileName}`;
      return img;
    };

    imgSellerRef.current = loadImg('seller.png');
    imgMakerRef.current = loadImg('maker.png');
    imgLocoRef.current = loadImg('loco.png');

    return () => {
      stopLoopAudio();
    };
  }, [stopLoopAudio]);

  const addFloatingText = (text: string, x: number, y: number, color: string) => {
    floatingTextsRef.current.push({
      id: Math.random(),
      text,
      x,
      y,
      color,
      life: 42,
    });
  };

  const createParticles = (x: number, y: number, color: string, count = 10) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1 + Math.random() * 3.5;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 24,
        color,
      });
    }
  };

  const triggerGameOver = useCallback(
    (reason: 'health' | 'bankrupt') => {
      if (gameOverRef.current) return;
      gameOverRef.current = true;
      stopLoopAudio();
      playSoundRef.current('over.mp3', 0.85);
      setGameOverReason(reason);
      setGameOver(true);
    },
    [stopLoopAudio]
  );

  const resetGame = useCallback(() => {
    stopLoopAudio();
    const { width, height } = dimsRef.current;
    const trackTopY = Math.max(120, height * 0.24);
    const trackHeight = Math.max(38, height * 0.085);
    const platformTopY = trackTopY + trackHeight;
    const minSellerY = platformTopY + 40;
    const maxSellerY = height - 16;
    const startX = Math.min(72, width * 0.11);
    const startY = Math.min(maxSellerY, Math.max(minSellerY, height - 42));

    samosasRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    stallMakeTimerRef.current = 0;
    locoLaughCooldownRef.current = 0;

    nextTrainCooldownRef.current = 260;
    pendingArrivalNoteRef.current = 'ON TIME';
    trainCounterRef.current = 0;

    trainRef.current = {
      phase: 'NONE',
      x: -700,
      stopX: width * 0.56,
      stopTimer: 0,
      trainNumber: 0,
      arrivalNote: 'ON TIME',
      announced: false,
      locoLaughTimer: 0,
      windows: [],
    };

    sellerRef.current = { x: startX, y: startY };
    targetRef.current = { x: startX, y: startY };

    scoreRef.current = INITIAL_SCORE;
    healthRef.current = 100;
    gameOverRef.current = false;
    frameCountRef.current = 0;

    setScore(INITIAL_SCORE);
    setHealth(100);
    setGameOver(false);
  }, [stopLoopAudio]);

  const handleDimensionsChange = useCallback((dims: Dimensions) => {
    dimsRef.current = dims;
    const trackTopY = Math.max(120, dims.height * 0.24);
    const trackHeight = Math.max(38, dims.height * 0.085);
    const platformTopY = trackTopY + trackHeight;
    const minSellerY = platformTopY + 40;
    const maxSellerY = dims.height - 16;

    const clampedX = Math.max(28, Math.min(dims.width - 28, sellerRef.current.x));
    const clampedY = Math.max(minSellerY, Math.min(maxSellerY, sellerRef.current.y));

    sellerRef.current = { x: clampedX, y: clampedY };
    targetRef.current = { x: clampedX, y: clampedY };
  }, []);

  const applyCursorTarget = useCallback(
    (clientX: number, clientY: number, rect: DOMRect, dims: Dimensions) => {
      if (gameOverRef.current) return;
      const trackTopY = Math.max(120, dims.height * 0.24);
      const trackHeight = Math.max(38, dims.height * 0.085);
      const platformTopY = trackTopY + trackHeight;
      const minSellerY = platformTopY + 40;
      const maxSellerY = dims.height - 16;

      const lx = ((clientX - rect.left) / rect.width) * dims.width;
      const ly = ((clientY - rect.top) / rect.height) * dims.height;

      targetRef.current = {
        x: Math.max(28, Math.min(dims.width - 28, lx)),
        y: Math.max(minSellerY, Math.min(maxSellerY, ly)),
      };
    },
    []
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, dims: Dimensions) => {
      applyCursorTarget(
        e.clientX,
        e.clientY,
        e.currentTarget.getBoundingClientRect(),
        dims
      );
    },
    [applyCursorTarget]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, dims: Dimensions) => {
      applyCursorTarget(
        e.clientX,
        e.clientY,
        e.currentTarget.getBoundingClientRect(),
        dims
      );
    },
    [applyCursorTarget]
  );

  useEffect(() => {
    const keys = { left: false, right: false, up: false, down: false };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = true;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = true;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = true;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = true;
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') keys.left = false;
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') keys.right = false;
      if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') keys.up = false;
      if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') keys.down = false;
    };

    const interval = setInterval(() => {
      if (gameOverRef.current) return;
      const { width, height } = dimsRef.current;
      const trackTopY = Math.max(120, height * 0.24);
      const trackHeight = Math.max(38, height * 0.085);
      const platformTopY = trackTopY + trackHeight;
      const minSellerY = platformTopY + 40;
      const maxSellerY = height - 16;
      const step = 9;

      if (keys.left) targetRef.current.x = Math.max(28, targetRef.current.x - step);
      if (keys.right)
        targetRef.current.x = Math.min(width - 28, targetRef.current.x + step);
      if (keys.up)
        targetRef.current.y = Math.max(minSellerY, targetRef.current.y - step);
      if (keys.down)
        targetRef.current.y = Math.min(maxSellerY, targetRef.current.y + step);
    }, 16);

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      clearInterval(interval);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const renderCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, dims: Dimensions) => {
      const { width, height } = dims;
      frameCountRef.current++;

      if (locoLaughCooldownRef.current > 0) locoLaughCooldownRef.current--;

      const trackTopY = Math.max(120, height * 0.54);
      const trackHeight = Math.max(38, height * 0.085);
      const platformTopY = trackTopY + trackHeight;
      const minSellerY = platformTopY + 40;
      const maxSellerY = height - 16;

      const stallW = Math.max(118, Math.min(156, width * 0.2));
      const stallH = 96;
      const stallBottomY = Math.min(maxSellerY + 30, platformTopY + 170);
      const stallTopY = stallBottomY - stallH;
      const stallX = 10;

      const drawFaceSprite = (
        img: HTMLImageElement | null,
        centerX: number,
        centerY: number,
        maxSize: number,
        fallbackColor: string
      ) => {
        if (img && img.complete && img.naturalWidth > 0) {
          const aspect = img.naturalWidth / img.naturalHeight;
          let drawW = maxSize;
          let drawH = maxSize;
          if (aspect > 1) {
            drawH = maxSize / aspect;
          } else {
            drawW = maxSize * aspect;
          }
          ctx.drawImage(
            img,
            centerX - drawW / 2,
            centerY - drawH / 2,
            drawW,
            drawH
          );
        } else {
          ctx.fillStyle = fallbackColor;
          ctx.beginPath();
          ctx.arc(centerX, centerY, maxSize * 0.36, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      // ==================== 1. STATION SCENERY ====================
      const skyGrad = ctx.createLinearGradient(0, 0, 0, trackTopY);
      skyGrad.addColorStop(0, '#050914');
      skyGrad.addColorStop(0.55, '#0f1f3d');
      skyGrad.addColorStop(1, '#1e3a5f');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, trackTopY);

      ctx.fillStyle = '#0a1426';
      for (let bx = 0; bx < width; bx += 46) {
        const bh = 18 + ((bx * 13) % 40);
        ctx.fillRect(bx + 4, trackTopY - bh, 34, bh);
      }
      ctx.fillStyle = '#132a4d';
      for (let bx = 20; bx < width; bx += 64) {
        const bh = 10 + ((bx * 7) % 26);
        ctx.fillRect(bx + 6, trackTopY - bh, 40, bh);
      }

      const canopyY = Math.max(64, trackTopY * 0.42);
      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.moveTo(0, canopyY);
      ctx.lineTo(width, canopyY - 18);
      ctx.lineTo(width, canopyY + 12);
      ctx.lineTo(0, canopyY + 26);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 3;
      for (let rx = 30; rx < width; rx += 84) {
        ctx.beginPath();
        ctx.moveTo(rx, canopyY - 10);
        ctx.lineTo(rx, canopyY + 28);
        ctx.stroke();
      }

      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, canopyY + 24, width, 3);

      ctx.fillStyle = '#243244';
      for (let px = 40; px < width; px += 168) {
        ctx.fillRect(px, canopyY + 26, 10, trackTopY - canopyY - 20);
      }

      for (let lx = 90; lx < width; lx += 168) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(lx, canopyY + 27, 2, 14);
        const lampGlow = ctx.createRadialGradient(lx + 1, canopyY + 44, 1, lx + 1, canopyY + 44, 16);
        lampGlow.addColorStop(0, 'rgba(253,224,71,0.55)');
        lampGlow.addColorStop(1, 'rgba(253,224,71,0)');
        ctx.fillStyle = lampGlow;
        ctx.fillRect(lx - 16, canopyY + 28, 34, 32);
        ctx.fillStyle = '#fde047';
        ctx.beginPath();
        ctx.arc(lx + 1, canopyY + 44, 4, 0, Math.PI * 2);
        ctx.fill();
      }

      const boardW = Math.min(300, width * 0.56);
      const boardH = 30;
      const boardX = width / 2 - boardW / 2;
      const boardY = canopyY + 42;

      ctx.fillStyle = '#020617';
      ctx.strokeStyle = '#facc15';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(boardX, boardY, boardW, boardH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#fde047';
      ctx.font = `bold ${Math.round(boardH * 0.52)}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SAMOSA JUNCTION', width / 2, boardY + boardH / 2 + 1);
      ctx.textBaseline = 'alphabetic';

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(boardX + boardW + 12, boardY + 4, 52, 22, 4);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7dd3fc';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText('PF • 1', boardX + boardW + 38, boardY + 20);

      // ==================== 2. RAILWAY TRACK ====================
      ctx.fillStyle = '#292524';
      ctx.fillRect(0, trackTopY, width, trackHeight);

      ctx.fillStyle = '#3f3f46';
      for (let gx = 0; gx < width; gx += 9) {
        const gy = trackTopY + ((gx * 7) % (trackHeight - 6)) + 2;
        ctx.fillRect(gx, gy, 4, 3);
      }

      ctx.fillStyle = '#451a03';
      for (let sx = 0; sx < width; sx += 22) {
        ctx.fillRect(sx, trackTopY + 6, 12, trackHeight - 12);
      }

      const railTopY = trackTopY + trackHeight * 0.28;
      const railBotY = trackTopY + trackHeight * 0.72;
      ctx.fillStyle = '#e2e8f0';
      ctx.fillRect(0, railTopY, width, 4);
      ctx.fillRect(0, railBotY, width, 4);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(0, railTopY + 4, width, 2);
      ctx.fillRect(0, railBotY + 4, width, 2);

      ctx.fillStyle = '#facc15';
      ctx.fillRect(0, platformTopY - 2, width, 4);

      // ==================== 3. PLATFORM FLOOR ====================
      const platGrad = ctx.createLinearGradient(0, platformTopY, 0, height);
      platGrad.addColorStop(0, '#475569');
      platGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = platGrad;
      ctx.fillRect(0, platformTopY, width, height - platformTopY);

      ctx.strokeStyle = 'rgba(15,23,42,0.5)';
      ctx.lineWidth = 1;
      for (let ty = platformTopY + 16; ty < height; ty += 26) {
        ctx.beginPath();
        ctx.moveTo(0, ty);
        ctx.lineTo(width, ty);
        ctx.stroke();
      }

      // ==================== 4. TRAIN ====================
      // Longer coaches that span the full width of the canvas
      const coachCount = 6;
      const sideMargin = 6; // train nearly flush to edges
      const fullTrainWidth = width - sideMargin * 2;
      const engineW = fullTrainWidth * 0.16;
      const coachW = (fullTrainWidth - engineW) / coachCount;
      const totalTrainW = fullTrainWidth;
      const trainH = Math.max(64, Math.min(88, height * 0.16));
      const trainTop = platformTopY - trainH + 6;

      const train = trainRef.current;
      if (train.locoLaughTimer > 0) {
        train.locoLaughTimer--;
      }

      if (train.phase === 'NONE') {
        nextTrainCooldownRef.current--;

        if (nextTrainCooldownRef.current === 80 && !train.announced) {
          train.announced = true;
          const note = pendingArrivalNoteRef.current;
          addFloatingText(
            note === 'EARLY'
              ? 'EARLY TRAIN INCOMING!'
              : note === 'LATE'
              ? 'LATE TRAIN COMING!'
              : '6-COACH TRAIN APPROACHING!',
            width * 0.62,
            trackTopY - 14,
            note === 'EARLY' ? '#34d399' : note === 'LATE' ? '#fb923c' : '#fde047'
          );
        }

        if (nextTrainCooldownRef.current <= 0) {
          trainCounterRef.current += 1;
          // Stop centered across the canvas so coaches span left-to-right
          const stopCenterX = width / 2;

          const windows: PassengerWindow[] = [];
          const trainLeftAtStop = stopCenterX - totalTrainW / 2;
          for (let c = 0; c < coachCount; c++) {
            const coachCenter = trainLeftAtStop + c * coachW + coachW / 2;
            windows.push({
              id: c,
              offsetX: coachCenter - stopCenterX,
              wants: 1 + Math.floor(Math.random() * 2),
              served: 0,
              patience: 360 + Math.floor(Math.random() * 120),
            });
          }

          trainRef.current = {
            phase: 'APPROACHING',
            x: -totalTrainW / 2 - 90,
            stopX: stopCenterX,
            stopTimer: 360 + Math.floor(Math.random() * 120),
            trainNumber: trainCounterRef.current,
            arrivalNote: pendingArrivalNoteRef.current,
            announced: true,
            locoLaughTimer: 80,
            windows,
          };
          playSoundRef.current('onTrainArrive.mp3', 0.75);
          playSoundRef.current('loco.mp3', 0.75);
          locoLaughCooldownRef.current = 180;
        }
      } else if (train.phase === 'APPROACHING') {
        const speed =
          train.arrivalNote === 'EARLY' ? 6.6 : train.arrivalNote === 'LATE' ? 3.6 : 5.0;
        train.x += speed;
        if (train.x >= train.stopX) {
          train.x = train.stopX;
          train.phase = 'STOPPED';
          train.locoLaughTimer = 65;
          if (locoLaughCooldownRef.current <= 0) {
            playSoundRef.current('loco.mp3', 0.75);
            locoLaughCooldownRef.current = 180;
          }
        }
      } else if (train.phase === 'STOPPED') {
        train.stopTimer--;

        if (
          train.stopTimer % 160 === 0 &&
          train.stopTimer > 0 &&
          locoLaughCooldownRef.current <= 0
        ) {
          train.locoLaughTimer = 55;
          playSoundRef.current('loco.mp3', 0.7);
          locoLaughCooldownRef.current = 180;
        }

        // Health only decreases when train is leaving with unserved passengers
        const allServed = train.windows.every((w) => w.served >= w.wants);

        if ((train.stopTimer <= 0 || allServed) && !allServed) {
          // Count passengers who leave without samosa → damage health
          let unservedCount = 0;
          for (const win of train.windows) {
            if (win.served < win.wants) {
              unservedCount += win.wants - win.served;
              win.served = win.wants; // mark as gone
            }
          }
          if (unservedCount > 0) {
            const dmg = unservedCount * 6;
            healthRef.current = Math.max(0, healthRef.current - dmg);
            setHealth(healthRef.current);
            addFloatingText(
              `${unservedCount} LEFT HUNGRY! -${dmg}% HP`,
              width / 2,
              trainTop - 26,
              '#f87171'
            );
            if (healthRef.current <= 0) {
              triggerGameOver('health');
            }
          }
        }

        if (train.stopTimer <= 0 || allServed) {
          train.phase = 'DEPARTING';
          train.locoLaughTimer = 65;
          if (locoLaughCooldownRef.current <= 0) {
            playSoundRef.current('loco.mp3', 0.75);
            locoLaughCooldownRef.current = 180;
          }
        }
      } else if (train.phase === 'DEPARTING') {
        train.x += 6.8;
        if (train.x > width + totalTrainW / 2 + 130) {
          train.phase = 'NONE';
          train.announced = false;
          train.locoLaughTimer = 0;

          const r = Math.random();
          if (r < 0.35) {
            pendingArrivalNoteRef.current = 'EARLY';
            nextTrainCooldownRef.current = 230 + Math.floor(Math.random() * 70);
          } else if (r < 0.7) {
            pendingArrivalNoteRef.current = 'ON TIME';
            nextTrainCooldownRef.current = 300 + Math.floor(Math.random() * 80);
          } else {
            pendingArrivalNoteRef.current = 'LATE';
            nextTrainCooldownRef.current = 380 + Math.floor(Math.random() * 80);
          }
        }
      }

      // Draw Train
      if (train.phase !== 'NONE') {
        const trainLeft = train.x - totalTrainW / 2;

        ctx.fillStyle = 'rgba(0,0,0,0.35)';
        ctx.beginPath();
        ctx.ellipse(train.x, platformTopY + 2, totalTrainW / 2, 8, 0, 0, Math.PI * 2);
        ctx.fill();

        for (let c = 0; c < coachCount; c++) {
          const cLeft = trainLeft + c * coachW;
          const isAlt = c % 2 === 1;
          ctx.fillStyle = isAlt ? '#1d4ed8' : '#1e3a8a';
          ctx.beginPath();
          ctx.roundRect(cLeft + 1, trainTop, coachW - 3, trainH, [8, 6, 3, 3]);
          ctx.fill();

          ctx.fillStyle = '#93c5fd';
          ctx.beginPath();
          ctx.roundRect(cLeft + 3, trainTop - 4, coachW - 7, 5, [4, 4, 0, 0]);
          ctx.fill();

          ctx.fillStyle = '#facc15';
          ctx.fillRect(cLeft + 1, trainTop + trainH - 14, coachW - 3, 6);

          const win = train.windows[c];
          const remaining = win ? Math.max(0, win.wants - win.served) : 0;
          // BIGGER passenger window
          const winW = Math.min(48, Math.max(34, coachW * 0.5));
          const winX = cLeft + (coachW - 3) / 2 - winW / 2;
          const winY = trainTop + 8;
          const winH = Math.max(28, trainH * 0.5);

          ctx.fillStyle =
            train.phase === 'STOPPED' && remaining > 0 ? '#fef08a' : '#334155';
          ctx.beginPath();
          ctx.roundRect(winX, winY, winW, winH, 4);
          ctx.fill();

          if (train.phase === 'STOPPED' && remaining > 0) {
            // BIG passenger face
            ctx.fillStyle = '#fed7aa';
            ctx.beginPath();
            ctx.arc(winX + winW / 2, winY + winH / 2, winH * 0.34, 0, Math.PI * 2);
            ctx.fill();

            const bubbleY = trainTop - 34;
            const bubbleR = 15;
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(winX + winW / 2, bubbleY, bubbleR, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#0f172a';
            ctx.lineWidth = 1.8;
            ctx.stroke();
            ctx.fillStyle = '#0f172a';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${remaining}x`, winX + winW / 2, bubbleY + 1);
            ctx.textBaseline = 'alphabetic';
          }

          ctx.fillStyle = 'rgba(15,23,42,0.55)';
          ctx.fillRect(cLeft + coachW * 0.06, trainTop + 8, 6, trainH - 24);
          ctx.fillRect(cLeft + coachW - coachW * 0.06 - 6, trainTop + 8, 6, trainH - 24);
        }

        // Locomotive
        const engLeft = trainLeft + coachCount * coachW;
        ctx.fillStyle = '#dc2626';
        ctx.beginPath();
        ctx.roundRect(engLeft, trainTop - 4, engineW, trainH + 4, [6, 16, 3, 3]);
        ctx.fill();

        ctx.fillStyle = '#facc15';
        ctx.fillRect(engLeft, trainTop + trainH - 14, engineW, 6);

        ctx.fillStyle = '#fca5a5';
        ctx.beginPath();
        ctx.roundRect(engLeft + 4, trainTop - 7, engineW - 10, 5, [3, 8, 0, 0]);
        ctx.fill();

        // BIGGER cab window + loco pilot
        const cabWinW = Math.min(44, engineW * 0.5);
        const cabWinH = Math.max(30, trainH * 0.55);
        const cabWinX = engLeft + engineW - cabWinW - 10;
        const cabWinY = trainTop + 4;

        ctx.fillStyle = '#0f172a';
        ctx.beginPath();
        ctx.roundRect(cabWinX, cabWinY, cabWinW, cabWinH, 5);
        ctx.fill();

        const laughBob =
          train.locoLaughTimer > 0 ? Math.sin(frameCountRef.current * 0.7) * 3 : 0;
        // MUCH BIGGER loco face
        drawFaceSprite(
          imgLocoRef.current,
          cabWinX + cabWinW / 2,
          cabWinY + cabWinH / 2 - 1 + laughBob,
          cabWinH * 1.35,
          '#fde047'
        );

        if (train.locoLaughTimer > 0) {
          ctx.fillStyle = '#fde047';
          ctx.font = 'bold 13px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText('HAHA!', cabWinX + cabWinW / 2, cabWinY - 9 + laughBob);
        }

        const headlightX = engLeft + engineW - 6;
        const headlightY = trainTop + trainH * 0.6;
        const hGlow = ctx.createRadialGradient(headlightX, headlightY, 1, headlightX, headlightY, 22);
        hGlow.addColorStop(0, 'rgba(254,240,138,0.9)');
        hGlow.addColorStop(1, 'rgba(254,240,138,0)');
        ctx.fillStyle = hGlow;
        ctx.fillRect(headlightX - 22, headlightY - 22, 44, 44);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(headlightX, headlightY, 7, 0, Math.PI * 2);
        ctx.fill();

        const statusText =
          train.phase === 'STOPPED'
            ? `STOPPED • ${Math.max(1, Math.ceil(train.stopTimer / 60))}s`
            : `${train.arrivalNote} EXPRESS • 6 COACHES`;
        const pillW = 200;
        const pillY = trainTop - 52;
        ctx.fillStyle = 'rgba(2,6,23,0.9)';
        ctx.beginPath();
        ctx.roundRect(train.x - pillW / 2, pillY, pillW, 22, 11);
        ctx.fill();
        ctx.strokeStyle = train.phase === 'STOPPED' ? '#4ade80' : '#fde047';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.fillStyle = train.phase === 'STOPPED' ? '#4ade80' : '#fde047';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusText, train.x, pillY + 11);
        ctx.textBaseline = 'alphabetic';
      }

      // ==================== 5. STALL ====================
      ctx.save();

      const makerX = stallX + stallW * 0.34;
      const makerFeetY = stallBottomY - 6;

      ctx.fillStyle = '#475569';
      ctx.fillRect(makerX - 7, makerFeetY - 14, 5, 14);
      ctx.fillRect(makerX + 2, makerFeetY - 14, 5, 14);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(makerX - 11, makerFeetY - 34, 22, 22, 4);
      ctx.fill();

      // BIGGER maker face
      drawFaceSprite(imgMakerRef.current, makerX, makerFeetY - 48, 36, '#fed7aa');

      ctx.fillStyle = '#78350f';
      ctx.beginPath();
      ctx.roundRect(stallX, stallTopY, stallW, stallH, 4);
      ctx.fill();

      ctx.fillStyle = '#92400e';
      ctx.fillRect(stallX - 2, stallBottomY - 28, stallW + 4, 28);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(stallX - 2, stallBottomY - 28, stallW + 4, 5);

      ctx.fillStyle = '#1e293b';
      ctx.beginPath();
      ctx.ellipse(stallX + stallW * 0.7, stallBottomY - 28, 16, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.ellipse(stallX + stallW * 0.7, stallBottomY - 30, 12, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      if (frameCountRef.current % 20 < 12) {
        ctx.strokeStyle = 'rgba(226,232,240,0.4)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(stallX + stallW * 0.66, stallBottomY - 34);
        ctx.quadraticCurveTo(
          stallX + stallW * 0.62,
          stallBottomY - 46,
          stallX + stallW * 0.68,
          stallBottomY - 56
        );
        ctx.stroke();
      }

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.roundRect(makerX - 10, stallBottomY - 46, 20, 18, 4);
      ctx.fill();
      // BIGGER maker face at counter
      drawFaceSprite(imgMakerRef.current, makerX, stallBottomY - 58, 34, '#fed7aa');

      const awningH = 18;
      const awningY = stallTopY - awningH;
      for (let i = 0; i < Math.ceil((stallW + 8) / 16); i++) {
        ctx.fillStyle = i % 2 === 0 ? '#dc2626' : '#fef2f2';
        ctx.fillRect(stallX - 4 + i * 16, awningY, 16, awningH);
      }
      ctx.fillStyle = '#991b1b';
      ctx.fillRect(stallX - 4, awningY + awningH - 3, stallW + 8, 3);

      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath();
      ctx.roundRect(stallX + stallW / 2 - 44, awningY - 14, 88, 18, 4);
      ctx.fill();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fde047';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('SAMOSA STALL', stallX + stallW / 2, awningY - 4.5);
      ctx.textBaseline = 'alphabetic';

      ctx.restore();

      // ==================== 6. SELLER ====================
      targetRef.current.y = Math.max(
        minSellerY,
        Math.min(maxSellerY, targetRef.current.y)
      );
      targetRef.current.x = Math.max(28, Math.min(width - 28, targetRef.current.x));

      sellerRef.current.x += (targetRef.current.x - sellerRef.current.x) * 0.24;
      sellerRef.current.y += (targetRef.current.y - sellerRef.current.y) * 0.24;
      sellerRef.current.y = Math.max(
        minSellerY,
        Math.min(maxSellerY, sellerRef.current.y)
      );

      const isInsideStall =
        sellerRef.current.x <= stallX + stallW + 18 &&
        sellerRef.current.y >= stallTopY - 12 &&
        sellerRef.current.y <= stallBottomY + 18;

      if (!gameOverRef.current) {
        syncZoneLoopAudio(isInsideStall ? 'MAKING' : 'SELLING');
      }

      if (!gameOverRef.current && isInsideStall) {
        stallMakeTimerRef.current++;
        if (stallMakeTimerRef.current >= MAKE_INTERVAL_FRAMES) {
          stallMakeTimerRef.current = 0;
          if (scoreRef.current >= MAKE_COST) {
            scoreRef.current -= MAKE_COST;
            setScore(scoreRef.current);
            samosasRef.current.push({
              id: Math.random(),
              age: 0,
            });
            addFloatingText(
              `+1 Samosa (-${MAKE_COST}pt)`,
              sellerRef.current.x,
              sellerRef.current.y - 78,
              '#fbbf24'
            );
          } else {
            addFloatingText(
              `Need ${MAKE_COST} pts!`,
              sellerRef.current.x,
              sellerRef.current.y - 78,
              '#f87171'
            );
          }
        }
      } else {
        stallMakeTimerRef.current = 0;
      }

      // Age samosas — no health damage on expiry now, just remove silently after 30s
      for (const s of samosasRef.current) {
        s.age++;
      }
      const beforeExpireCount = samosasRef.current.length;
      samosasRef.current = samosasRef.current.filter(
        (s) => s.age < FRESH_THRESHOLD_FRAMES
      );
      const silentlyExpired = beforeExpireCount - samosasRef.current.length;
      if (silentlyExpired > 0) {
        playSoundRef.current('onExpiring.mp3', 0.5);
        addFloatingText(
          `${silentlyExpired} samosa expired`,
          sellerRef.current.x,
          sellerRef.current.y - 90,
          '#fbbf24'
        );
      }

      // Selling
      if (
        !gameOverRef.current &&
        train.phase === 'STOPPED' &&
        samosasRef.current.length > 0
      ) {
        const coachRowY = trainTop + trainH + 16;
        for (const win of train.windows) {
          const winX = train.x + win.offsetX;
          if (win.served < win.wants && samosasRef.current.length > 0) {
            const dist = Math.hypot(
              sellerRef.current.x - winX,
              sellerRef.current.y - coachRowY
            );
            if (dist <= 56 && frameCountRef.current % 16 === 0) {
              samosasRef.current.pop();
              win.served += 1;
              scoreRef.current += SELL_REWARD;
              setScore(scoreRef.current);
              createParticles(
                sellerRef.current.x,
                sellerRef.current.y - 35,
                '#facc15',
                8
              );
              addFloatingText(
                `+${SELL_REWARD} SOLD!`,
                sellerRef.current.x,
                sellerRef.current.y - 76,
                '#facc15'
              );
            }
          }
        }
      }

      if (
        !gameOverRef.current &&
        scoreRef.current < MAKE_COST &&
        samosasRef.current.length === 0
      ) {
        triggerGameOver('bankrupt');
      }

      // ==================== 7. SELLER BODY ====================
      ctx.save();
      ctx.translate(sellerRef.current.x, sellerRef.current.y);

      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 16, 4, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-9, -16, 6, 14);
      ctx.fillRect(3, -16, 6, 14);

      ctx.fillStyle = '#451a03';
      ctx.fillRect(-10, -4, 8, 4);
      ctx.fillRect(2, -4, 8, 4);

      ctx.fillStyle = '#f97316';
      ctx.beginPath();
      ctx.roundRect(-13, -38, 26, 24, 5);
      ctx.fill();
      ctx.strokeStyle = '#ea580c';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.strokeStyle = '#f97316';
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-12, -33);
      ctx.lineTo(-16, -24);
      ctx.moveTo(12, -33);
      ctx.lineTo(16, -24);
      ctx.stroke();

      // BIGGER seller face
      drawFaceSprite(imgSellerRef.current, 0, -52, 40, '#fed7aa');

      ctx.fillStyle = '#d97706';
      ctx.fillRect(-17, -25, 34, 8);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(-17, -19, 34, 2);

      const showCount = Math.min(6, samosasRef.current.length);
      for (let i = 0; i < showCount; i++) {
        const sx = -11 + i * 4.5;
        ctx.fillStyle = '#eab308';
        ctx.beginPath();
        ctx.moveTo(sx, -25);
        ctx.lineTo(sx + 3.5, -32);
        ctx.lineTo(sx + 7, -25);
        ctx.closePath();
        ctx.fill();
      }

      if (samosasRef.current.length > 0) {
        const oldestAge = Math.max(...samosasRef.current.map((s) => s.age));
        const freshRatio = Math.max(0, 1 - oldestAge / FRESH_THRESHOLD_FRAMES);
        const lowFresh = freshRatio < 0.3;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(-24, -71, 48, 5);
        ctx.fillStyle = lowFresh ? '#ef4444' : freshRatio < 0.6 ? '#eab308' : '#22c55e';
        ctx.fillRect(-24, -71, 48 * freshRatio, 5);

        ctx.fillStyle = '#fde047';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Samosas: ${samosasRef.current.length}`, 0, -76);
      }

      ctx.restore();

      // ==================== 8. PARTICLES & TEXT ====================
      particlesRef.current = particlesRef.current.filter((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.12;
        p.life--;

        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.life / 24;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;

        return p.life > 0;
      });

      floatingTextsRef.current = floatingTextsRef.current.filter((ft) => {
        ft.y -= 1.0;
        ft.life--;

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 42;
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;

        return ft.life > 0;
      });
    },
    [syncZoneLoopAudio, triggerGameOver]
  );

  return (
    <GameShell
      mediaBase={MEDIA_BASE}
      score={score}
      initialScore={INITIAL_SCORE}
      health={health}
      gameOver={gameOver}
      gameOverTitle={
        gameOverReason === 'bankrupt'
          ? 'Out of Points!'
          : 'Station Shift Over!'
      }
      gameOverMessage={
        gameOverReason === 'bankrupt' ? (
          <>
            No points left to make samosas. Final Score:{' '}
            <span className="font-bold text-yellow-400">{score}</span>
          </>
        ) : (
          <>
            Final Score:{' '}
            <span className="font-bold text-yellow-400">{score}</span>
          </>
        )
      }
      canvasCursorClass="cursor-pointer"
      onReset={resetGame}
      onExit={onExit}
      onDimensionsChange={handleDimensionsChange}
      onMuteChange={handleMuteChange}
      renderCanvas={renderCanvas}
      onPointerMoveCanvas={handlePointerMove}
      onPointerDownCanvas={handlePointerDown}
      registerSoundPlayer={(fn) => {
        playSoundRef.current = fn;
      }}
      footerHint={
        <>
          <span>
            Move cursor on platform (stay off track!) • Inside stall = make (-5 pts) • Outside stall = sell near stopped train (+10) • Tap
          </span>
          <FaExpand className="text-slate-200 inline" />
          <span>for fullscreen</span>
        </>
      }
    />
  );
}