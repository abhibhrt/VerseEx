'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaExpand } from 'react-icons/fa';
import GameShell, { Dimensions } from './GameShell';

const MEDIA_BASE =
  'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/Chocho-Catcher';

const INITIAL_SCORE = 5;

type FallingItem = {
  id: number;
  type: 'choco' | 'bomb';
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  vRot: number;
  radius: number;
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

type CatcherGameProps = {
  onExit: () => void;
};

export default function CatcherGame({ onExit }: CatcherGameProps) {
  const [score, setScore] = useState(INITIAL_SCORE);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'bomb' | 'score'>('bomb');

  const playSoundRef = useRef<(fileName: string, volume?: number) => void>(() => {});

  // Face image refs from GitHub
  const imgCatcherRef = useRef<HTMLImageElement | null>(null);
  const imgCatcherChocoRef = useRef<HTMLImageElement | null>(null);
  const imgCatcherBombRef = useRef<HTMLImageElement | null>(null);
  const imgBomberRef = useRef<HTMLImageElement | null>(null);
  const imgChocoGirlRef = useRef<HTMLImageElement | null>(null);

  // Game state refs
  const playerXRef = useRef(400);
  const targetPlayerXRef = useRef(400);
  const keysRef = useRef({ left: false, right: false });
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const healthRef = useRef(100);
  const scoreRef = useRef(INITIAL_SCORE);
  const gameOverRef = useRef(false);
  const screenShakeRef = useRef(0);

  const catcherReactionRef = useRef<{
    type: 'happy' | 'hurt' | 'neutral';
    timer: number;
  }>({
    type: 'neutral',
    timer: 0,
  });

  const chocoGirlRef = useRef({
    x: 240,
    vx: 2.3,
    jitterTimer: 0,
    throwAnim: 0,
  });

  const bombGirlRef = useRef({
    x: 560,
    vx: -2.6,
    jitterTimer: 0,
    throwAnim: 0,
  });

  const globalThrowCooldownRef = useRef(55);
  const throwCountRef = useRef(0);

  // Preload face images from GitHub
  useEffect(() => {
    const loadImg = (fileName: string) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = `${MEDIA_BASE}/${fileName}`;
      return img;
    };

    imgCatcherRef.current = loadImg('catcher.png');
    imgCatcherChocoRef.current = loadImg('catcher1.png');
    imgCatcherBombRef.current = loadImg('catcher2.png');
    imgBomberRef.current = loadImg('bomber.png');
    imgChocoGirlRef.current = loadImg('choco.png');
  }, []);

  // Keyboard Arrow / A-D controls
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = true;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = true;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        keysRef.current.left = false;
      }
      if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        keysRef.current.right = false;
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const handleDimensionsChange = useCallback((dims: Dimensions) => {
    playerXRef.current = dims.width / 2;
    targetPlayerXRef.current = dims.width / 2;
  }, []);

  const triggerGameOver = useCallback((reason: 'bomb' | 'score') => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    playSoundRef.current('over.mp3', 0.85);
    setGameOverReason(reason);
    setGameOver(true);
  }, []);

  const resetGame = useCallback(() => {
    const width = playerXRef.current * 2 || 800;
    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    healthRef.current = 100;
    scoreRef.current = INITIAL_SCORE;
    gameOverRef.current = false;
    screenShakeRef.current = 0;
    globalThrowCooldownRef.current = 50;
    throwCountRef.current = 0;
    playerXRef.current = width / 2;
    targetPlayerXRef.current = width / 2;
    chocoGirlRef.current = { x: width * 0.3, vx: 2.3, jitterTimer: 0, throwAnim: 0 };
    bombGirlRef.current = { x: width * 0.7, vx: -2.6, jitterTimer: 0, throwAnim: 0 };
    catcherReactionRef.current = { type: 'neutral', timer: 0 };

    setScore(INITIAL_SCORE);
    setHealth(100);
    setGameOver(false);
  }, []);

  const updatePointerTarget = (clientX: number, rect: DOMRect, dims: Dimensions) => {
    targetPlayerXRef.current = ((clientX - rect.left) / rect.width) * dims.width;
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, dims: Dimensions) => {
      updatePointerTarget(e.clientX, e.currentTarget.getBoundingClientRect(), dims);
    },
    []
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>, dims: Dimensions) => {
      updatePointerTarget(e.clientX, e.currentTarget.getBoundingClientRect(), dims);
    },
    []
  );

  const renderCanvas = useCallback(
    (ctx: CanvasRenderingContext2D, dims: Dimensions) => {
      const { width, height } = dims;
      const roofY = Math.max(98, height * 0.22);
      const groundY = height - 32;
      const basketW = 78;

      const createSplash = (x: number, y: number, color: string, count = 12) => {
        for (let i = 0; i < count; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 1.2 + Math.random() * 4;
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

      const drawFaceImage = (
        img: HTMLImageElement | null,
        centerX: number,
        centerY: number,
        maxSize: number,
        fallbackColor = '#fed7aa'
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
          ctx.arc(centerX, centerY, maxSize * 0.42, 0, Math.PI * 2);
          ctx.fill();
        }
      };

      const drawGirlOnRoof = (
        x: number,
        y: number,
        type: 'choco' | 'bomb',
        throwAnim: number
      ) => {
        ctx.save();
        ctx.translate(x, y);

        const isChoco = type === 'choco';

        if (isChoco) {
          const creamCoat = '#f5f0e1';
          const creamShade = '#dfd5bc';
          const innerShirt = '#78350f';

          ctx.fillStyle = creamShade;
          ctx.fillRect(-9, -18, 7, 18);
          ctx.fillRect(2, -18, 7, 18);

          ctx.fillStyle = '#451a03';
          ctx.fillRect(-10, -3, 8, 3);
          ctx.fillRect(2, -3, 8, 3);

          ctx.fillStyle = creamCoat;
          ctx.beginPath();
          ctx.roundRect(-13, -38, 26, 23, 4);
          ctx.fill();
          ctx.strokeStyle = creamShade;
          ctx.lineWidth = 1;
          ctx.stroke();

          ctx.fillStyle = innerShirt;
          ctx.beginPath();
          ctx.moveTo(-4, -38);
          ctx.lineTo(4, -38);
          ctx.lineTo(0, -27);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#92400e';
          ctx.beginPath();
          ctx.arc(0, -23, 1.3, 0, Math.PI * 2);
          ctx.arc(0, -18, 1.3, 0, Math.PI * 2);
          ctx.fill();

          ctx.strokeStyle = creamCoat;
          ctx.lineWidth = 4.5;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(10, -33);
          if (throwAnim > 0) {
            ctx.lineTo(22, -49);
          } else {
            ctx.lineTo(19, -25);
          }
          ctx.stroke();

          if (throwAnim <= 0) {
            ctx.fillStyle = '#5c2d16';
            ctx.fillRect(15, -31, 11, 7);
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(15, -31, 4, 7);
          }
        } else {
          const sareeWhite = '#ffffff';
          const sareeBorder = '#dc2626';
          const goldTrim = '#facc15';

          ctx.fillStyle = '#fed7aa';
          ctx.fillRect(-7, -3, 5, 3);
          ctx.fillRect(2, -3, 5, 3);

          ctx.fillStyle = sareeWhite;
          ctx.beginPath();
          ctx.moveTo(-10, -24);
          ctx.lineTo(10, -24);
          ctx.lineTo(14, -2);
          ctx.lineTo(-14, -2);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = '#cbd5e1';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-3, -24);
          ctx.lineTo(-4, -2);
          ctx.moveTo(2, -24);
          ctx.lineTo(2, -2);
          ctx.stroke();

          ctx.fillStyle = sareeBorder;
          ctx.fillRect(-14, -5, 28, 3);
          ctx.fillStyle = goldTrim;
          ctx.fillRect(-14, -6, 28, 1.2);

          ctx.fillStyle = '#f8fafc';
          ctx.beginPath();
          ctx.roundRect(-10, -38, 20, 14, 3);
          ctx.fill();

          ctx.fillStyle = sareeWhite;
          ctx.beginPath();
          ctx.moveTo(-10, -38);
          ctx.lineTo(-3, -38);
          ctx.lineTo(11, -22);
          ctx.lineTo(4, -22);
          ctx.closePath();
          ctx.fill();

          ctx.strokeStyle = sareeBorder;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(-9, -38);
          ctx.lineTo(5, -22);
          ctx.stroke();

          ctx.strokeStyle = '#fed7aa';
          ctx.lineWidth = 4;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(9, -33);
          if (throwAnim > 0) {
            ctx.lineTo(22, -49);
          } else {
            ctx.lineTo(19, -25);
          }
          ctx.stroke();

          if (throwAnim <= 0) {
            ctx.fillStyle = '#0f172a';
            ctx.beginPath();
            ctx.arc(21, -25, 5.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#facc15';
            ctx.beginPath();
            ctx.arc(23, -31, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }

        const faceImg = isChoco ? imgChocoGirlRef.current : imgBomberRef.current;
        drawFaceImage(faceImg, 0, -58, 52);

        ctx.restore();
      };

      const drawManCatcher = (x: number, y: number, w: number) => {
        ctx.save();
        ctx.translate(x, y);

        const kurtaOrange = '#f97316';
        const kurtaBorder = '#ea580c';
        const goldEmbroidery = '#fde047';

        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(-11, -18, 8, 18);
        ctx.fillRect(3, -18, 8, 18);

        ctx.fillStyle = '#78350f';
        ctx.fillRect(-13, -4, 10, 4);
        ctx.fillRect(3, -4, 10, 4);

        ctx.fillStyle = kurtaOrange;
        ctx.beginPath();
        ctx.roundRect(-16, -46, 32, 34, [6, 6, 2, 2]);
        ctx.fill();
        ctx.strokeStyle = kurtaBorder;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        ctx.fillStyle = kurtaBorder;
        ctx.fillRect(-2.5, -46, 5, 14);
        ctx.fillStyle = goldEmbroidery;
        ctx.beginPath();
        ctx.arc(0, -42, 1.2, 0, Math.PI * 2);
        ctx.arc(0, -37, 1.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = goldEmbroidery;
        ctx.fillRect(-15, -14, 30, 1.8);

        const basketY = -104;
        ctx.strokeStyle = kurtaOrange;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(-15, -40);
        ctx.lineTo(-w / 2 + 8, basketY + 12);
        ctx.moveTo(15, -40);
        ctx.lineTo(w / 2 - 8, basketY + 12);
        ctx.stroke();

        ctx.strokeStyle = '#fed7aa';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(-w / 2 + 8, basketY + 12);
        ctx.lineTo(-w / 2 + 6, basketY + 8);
        ctx.moveTo(w / 2 - 8, basketY + 12);
        ctx.lineTo(w / 2 - 6, basketY + 8);
        ctx.stroke();

        const reaction = catcherReactionRef.current.type;
        const activeCatcherImg =
          reaction === 'happy'
            ? imgCatcherChocoRef.current
            : reaction === 'hurt'
            ? imgCatcherBombRef.current
            : imgCatcherRef.current;

        drawFaceImage(activeCatcherImg, 0, -70, 58);

        ctx.fillStyle = '#2563eb';
        ctx.beginPath();
        ctx.moveTo(-w / 2, basketY);
        ctx.lineTo(w / 2, basketY);
        ctx.lineTo(w / 2 - 7, basketY + 15);
        ctx.lineTo(-w / 2 + 7, basketY + 15);
        ctx.closePath();
        ctx.fill();

        ctx.fillStyle = '#93c5fd';
        ctx.fillRect(-w / 2 - 2, basketY - 3, w + 4, 4.5);

        ctx.restore();
      };

      const drawScene = () => {
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#090d16');
        skyGrad.addColorStop(1, '#1e293b');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        const moonX = Math.min(65, width * 0.12);
        ctx.fillStyle = '#fef08a';
        ctx.beginPath();
        ctx.arc(moonX, 42, 13, 0, Math.PI * 2);
        ctx.fill();

        const roofLeft = Math.max(18, width * 0.05);
        const roofRight = Math.min(width - 18, width * 0.95);
        const roofW = roofRight - roofLeft;

        ctx.fillStyle = '#0f172a';
        ctx.fillRect(roofLeft + 10, roofY, roofW - 20, 34);

        ctx.fillStyle = '#1e3a8a';
        const winCount = Math.max(3, Math.floor((roofW - 60) / 70));
        for (let i = 0; i < winCount; i++) {
          const wx = roofLeft + 30 + i * ((roofW - 80) / Math.max(1, winCount - 1));
          ctx.fillRect(wx, roofY + 8, 22, 18);
        }

        ctx.fillStyle = '#475569';
        ctx.fillRect(roofLeft, roofY - 7, roofW, 10);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(roofLeft, roofY - 7, roofW, 2.5);

        ctx.fillStyle = '#27170d';
        ctx.fillRect(0, groundY, width, height - groundY);
        ctx.fillStyle = '#451a03';
        ctx.fillRect(0, groundY, width, 4);
      };

      ctx.save();

      if (screenShakeRef.current > 0) {
        const dx = (Math.random() - 0.5) * screenShakeRef.current;
        const dy = (Math.random() - 0.5) * screenShakeRef.current;
        ctx.translate(dx, dy);
        screenShakeRef.current *= 0.86;
        if (screenShakeRef.current < 0.5) screenShakeRef.current = 0;
      }

      if (catcherReactionRef.current.timer > 0) {
        catcherReactionRef.current.timer--;
      } else {
        catcherReactionRef.current.type = 'neutral';
      }

      drawScene();

      const speedMult = 1 + Math.min(1.2, Math.max(0, scoreRef.current - 5) / 250);

      const roofLeft = Math.max(18, width * 0.05) + 32;
      const roofRight = Math.min(width - 18, width * 0.95) - 32;

      const updateGirl = (girl: typeof chocoGirlRef.current) => {
        girl.jitterTimer--;
        if (girl.jitterTimer <= 0) {
          const flip = Math.random() < 0.38 ? -1 : 1;
          const dir = (Math.sign(girl.vx) || 1) * flip;
          const speed = (1.6 + Math.random() * 3.1) * speedMult;
          girl.vx = dir * speed;
          girl.jitterTimer = 16 + Math.floor(Math.random() * 32);
        }

        girl.x += girl.vx;
        if (girl.x < roofLeft) {
          girl.x = roofLeft;
          girl.vx = Math.abs(girl.vx);
        } else if (girl.x > roofRight) {
          girl.x = roofRight;
          girl.vx = -Math.abs(girl.vx);
        }

        if (girl.throwAnim > 0) girl.throwAnim--;
      };

      updateGirl(chocoGirlRef.current);
      updateGirl(bombGirlRef.current);

      globalThrowCooldownRef.current--;
      if (globalThrowCooldownRef.current <= 0 && !gameOverRef.current) {
        throwCountRef.current += 1;
        const shouldPlayThrowSound = throwCountRef.current % 2 === 0;
        const isChocoThrow = Math.random() < 0.62;

        if (isChocoThrow) {
          chocoGirlRef.current.throwAnim = 18;
          if (shouldPlayThrowSound) {
            playSoundRef.current('throwchoco.mp3', 0.7);
          }
          itemsRef.current.push({
            id: Math.random(),
            type: 'choco',
            x: chocoGirlRef.current.x,
            y: roofY - 24,
            vx: (Math.random() - 0.5) * 2.0,
            vy: (3.0 + Math.random() * 1.3) * speedMult,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.1,
            radius: 14,
          });
        } else {
          bombGirlRef.current.throwAnim = 18;
          if (shouldPlayThrowSound) {
            playSoundRef.current('throwbomb.mp3', 0.7);
          }
          itemsRef.current.push({
            id: Math.random(),
            type: 'bomb',
            x: bombGirlRef.current.x,
            y: roofY - 24,
            vx: (Math.random() - 0.5) * 2.0,
            vy: (3.2 + Math.random() * 1.4) * speedMult,
            rotation: 0,
            vRot: (Math.random() - 0.5) * 0.12,
            radius: 15,
          });
        }

        const gap = Math.max(34, 68 - Math.floor(scoreRef.current / 15));
        globalThrowCooldownRef.current = gap + Math.floor(Math.random() * 20);
      }

      drawGirlOnRoof(
        chocoGirlRef.current.x,
        roofY - 7,
        'choco',
        chocoGirlRef.current.throwAnim
      );
      drawGirlOnRoof(
        bombGirlRef.current.x,
        roofY - 7,
        'bomb',
        bombGirlRef.current.throwAnim
      );

      const moveSpeed = 9;
      if (keysRef.current.left) targetPlayerXRef.current -= moveSpeed;
      if (keysRef.current.right) targetPlayerXRef.current += moveSpeed;

      const halfBasket = basketW / 2;
      targetPlayerXRef.current = Math.max(
        halfBasket + 8,
        Math.min(width - halfBasket - 8, targetPlayerXRef.current)
      );
      playerXRef.current += (targetPlayerXRef.current - playerXRef.current) * 0.35;

      const basketTopY = groundY - 104;
      const basketBottomY = basketTopY + 18;

      const remainingItems: FallingItem[] = [];
      for (const item of itemsRef.current) {
        item.x += item.vx;
        item.y += item.vy;
        item.vy += 0.04;
        item.rotation += item.vRot;

        if (item.x < 16) {
          item.x = 16;
          item.vx = Math.abs(item.vx);
        } else if (item.x > width - 16) {
          item.x = width - 16;
          item.vx = -Math.abs(item.vx);
        }

        const caughtX = Math.abs(item.x - playerXRef.current) <= halfBasket + 6;
        const caughtY =
          item.y + item.radius >= basketTopY && item.y - item.radius <= basketBottomY;

        if (caughtX && caughtY && !gameOverRef.current) {
          if (item.type === 'choco') {
            playSoundRef.current('catchchoco.mp3', 0.8);
            scoreRef.current += 10;
            setScore(scoreRef.current);
            catcherReactionRef.current = { type: 'happy', timer: 35 };
            createSplash(item.x, basketTopY, '#facc15', 10);
            floatingTextsRef.current.push({
              id: Math.random(),
              text: '+10',
              x: item.x,
              y: basketTopY - 10,
              color: '#facc15',
              life: 26,
            });
          } else {
            playSoundRef.current('catchbomb.mp3', 0.85);
            healthRef.current = Math.max(0, healthRef.current - 25);
            setHealth(healthRef.current);
            screenShakeRef.current = 14;
            catcherReactionRef.current = { type: 'hurt', timer: 42 };
            createSplash(item.x, basketTopY, '#ef4444', 18);
            floatingTextsRef.current.push({
              id: Math.random(),
              text: 'BOOM! -25%',
              x: item.x,
              y: basketTopY - 12,
              color: '#ef4444',
              life: 30,
            });

            if (healthRef.current <= 0) {
              triggerGameOver('bomb');
            }
          }
          continue;
        }

        if (item.y > groundY) {
          if (item.type === 'choco' && !gameOverRef.current) {
            scoreRef.current = Math.max(0, scoreRef.current - 5);
            setScore(scoreRef.current);
            createSplash(item.x, groundY - 3, '#ec4899', 8);
            floatingTextsRef.current.push({
              id: Math.random(),
              text: 'MISSED! -5',
              x: item.x,
              y: groundY - 16,
              color: '#fb7185',
              life: 28,
            });

            if (scoreRef.current <= 0) {
              triggerGameOver('score');
            }
          } else {
            createSplash(item.x, groundY - 3, '#94a3b8', 6);
          }
          continue;
        }

        ctx.save();
        ctx.translate(item.x, item.y);
        ctx.rotate(item.rotation);

        if (item.type === 'choco') {
          ctx.fillStyle = '#451a03';
          ctx.beginPath();
          ctx.roundRect(-13, -8, 26, 16, 4);
          ctx.fill();

          ctx.fillStyle = '#78350f';
          ctx.fillRect(-10, -5, 8, 4);
          ctx.fillRect(1, -5, 8, 4);
          ctx.fillRect(-10, 1, 8, 4);
          ctx.fillRect(1, 1, 8, 4);

          ctx.fillStyle = '#ec4899';
          ctx.fillRect(-13, -8, 7, 16);
        } else {
          ctx.fillStyle = '#090d16';
          ctx.strokeStyle = '#475569';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(0, 2, 13, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();

          ctx.strokeStyle = '#d97706';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(0, -11);
          ctx.lineTo(6, -17);
          ctx.stroke();

          ctx.fillStyle = Math.random() > 0.5 ? '#facc15' : '#ef4444';
          ctx.beginPath();
          ctx.arc(6, -17, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        remainingItems.push(item);
      }
      itemsRef.current = remainingItems;

      drawManCatcher(playerXRef.current, groundY, basketW);

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
        ft.y -= 1.1;
        ft.life--;

        ctx.fillStyle = ft.color;
        ctx.globalAlpha = ft.life / 30;
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ft.text, ft.x, ft.y);
        ctx.globalAlpha = 1;

        return ft.life > 0;
      });

      ctx.restore();
    },
    [triggerGameOver]
  );

  return (
    <GameShell
      mediaBase={MEDIA_BASE}
      score={score}
      initialScore={INITIAL_SCORE}
      health={health}
      gameOver={gameOver}
      gameOverTitle={
        gameOverReason === 'score' ? 'Score Dropped to 0!' : 'Boom! Game Over!'
      }
      gameOverMessage={
        gameOverReason === 'score' ? (
          'You missed too many chocolates!'
        ) : (
          <>
            Final Score:{' '}
            <span className="font-bold text-yellow-400">{score}</span>
          </>
        )
      }
      canvasCursorClass="cursor-ew-resize"
      onReset={resetGame}
      onExit={onExit}
      onDimensionsChange={handleDimensionsChange}
      renderCanvas={renderCanvas}
      onPointerMoveCanvas={handlePointerMove}
      onPointerDownCanvas={handlePointerDown}
      registerSoundPlayer={(fn) => {
        playSoundRef.current = fn;
      }}
      footerHint={
        <>
          <span>Don&apos;t drop chocolates (-5) • Tap</span>
          <FaExpand className="text-slate-200 inline" />
          <span>at top-right for edge-to-edge mobile play</span>
        </>
      }
    />
  );
}