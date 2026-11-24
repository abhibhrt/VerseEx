'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  FaVolumeUp,
  FaVolumeMute,
  FaExpand,
  FaCompress,
  FaHeart,
  FaStar,
  FaRedo,
  FaSignOutAlt,
} from 'react-icons/fa';

const MEDIA_BASE =
  'https://raw.githubusercontent.com/abhibhrt/VerseEx-Media/main/Chocho-Catcher';

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
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Always start game with score 5
  const [score, setScore] = useState(5);
  const [scorePop, setScorePop] = useState(false);
  const [health, setHealth] = useState(100);
  const [gameOver, setGameOver] = useState(false);
  const [gameOverReason, setGameOverReason] = useState<'bomb' | 'score'>('bomb');
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Face image refs from GitHub
  const imgCatcherRef = useRef<HTMLImageElement | null>(null);
  const imgCatcherChocoRef = useRef<HTMLImageElement | null>(null);
  const imgCatcherBombRef = useRef<HTMLImageElement | null>(null);
  const imgBomberRef = useRef<HTMLImageElement | null>(null);
  const imgChocoGirlRef = useRef<HTMLImageElement | null>(null);

  // Dynamic logical dimensions matching MosquitoGame
  const dimensionsRef = useRef({ width: 800, height: 500 });

  // Game state refs
  const playerXRef = useRef(400);
  const targetPlayerXRef = useRef(400);
  const keysRef = useRef({ left: false, right: false });
  const itemsRef = useRef<FallingItem[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatingTextsRef = useRef<FloatingText[]>([]);

  const healthRef = useRef(100);
  const scoreRef = useRef(5);
  const gameOverRef = useRef(false);
  const isMutedRef = useRef(false);
  const screenShakeRef = useRef(0);

  // 'neutral' -> catcher.png | 'happy' -> catcher1.png | 'hurt' -> catcher2.png
  const catcherReactionRef = useRef<{ type: 'happy' | 'hurt' | 'neutral'; timer: number }>({
    type: 'neutral',
    timer: 0,
  });

  // Two girls on the roof moving erratically ("not stable")
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

  // Shared cooldown so the two girls NEVER throw at the same time
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

  // Trigger pop animation whenever score changes
  useEffect(() => {
    if (score === 5) return;
    setScorePop(true);
    const timer = setTimeout(() => setScorePop(false), 180);
    return () => clearTimeout(timer);
  }, [score]);

  // Match canvas internal resolution to actual container aspect ratio
  useEffect(() => {
    const updateCanvasResolution = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const aspect = rect.width / rect.height;
      if (aspect < 1) {
        const logicalWidth = 480;
        const logicalHeight = Math.round(logicalWidth / aspect);
        canvas.width = logicalWidth;
        canvas.height = logicalHeight;
        dimensionsRef.current = { width: logicalWidth, height: logicalHeight };
      } else {
        const logicalHeight = 500;
        const logicalWidth = Math.round(logicalHeight * aspect);
        canvas.width = logicalWidth;
        canvas.height = logicalHeight;
        dimensionsRef.current = { width: logicalWidth, height: logicalHeight };
      }

      playerXRef.current = dimensionsRef.current.width / 2;
      targetPlayerXRef.current = dimensionsRef.current.width / 2;
    };

    updateCanvasResolution();
    window.addEventListener('resize', updateCanvasResolution);
    return () => window.removeEventListener('resize', updateCanvasResolution);
  }, [isFullscreen]);

  // Sync native fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
      }
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

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
      // CSS fixed fullscreen fallback handles mobile Safari
    }
  };

  const handleExitGame = async () => {
    if (document.fullscreenElement) {
      try {
        await document.exitFullscreen();
      } catch {
        // Ignore exit error
      }
    }
    onExit();
  };

  const toggleMute = () => {
    setIsMuted((prev) => {
      isMutedRef.current = !prev;
      return !prev;
    });
  };

  const playSound = (fileName: string, volume = 0.75) => {
    if (isMutedRef.current) return;
    try {
      const audio = new Audio(`${MEDIA_BASE}/${fileName}`);
      audio.volume = volume;
      audio.play().catch(() => {});
    } catch (err) {
      console.error('Audio playback failed:', err);
    }
  };

  const triggerGameOver = (reason: 'bomb' | 'score') => {
    if (gameOverRef.current) return;
    gameOverRef.current = true;
    playSound('over.mp3', 0.85);
    setGameOverReason(reason);
    setGameOver(true);
  };

  const resetGame = () => {
    const { width } = dimensionsRef.current;
    itemsRef.current = [];
    particlesRef.current = [];
    floatingTextsRef.current = [];
    healthRef.current = 100;
    scoreRef.current = 5;
    gameOverRef.current = false;
    screenShakeRef.current = 0;
    globalThrowCooldownRef.current = 50;
    throwCountRef.current = 0;
    playerXRef.current = width / 2;
    targetPlayerXRef.current = width / 2;
    chocoGirlRef.current = { x: width * 0.3, vx: 2.3, jitterTimer: 0, throwAnim: 0 };
    bombGirlRef.current = { x: width * 0.7, vx: -2.6, jitterTimer: 0, throwAnim: 0 };
    catcherReactionRef.current = { type: 'neutral', timer: 0 };

    setScore(5);
    setHealth(100);
    setGameOver(false);
  };

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

  const updatePointerTarget = (clientX: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const { width } = dimensionsRef.current;
    targetPlayerXRef.current = ((clientX - rect.left) / rect.width) * width;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointerTarget(e.clientX);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    updatePointerTarget(e.clientX);
  };

  useEffect(() => {
    if (gameOver) return;

    let animationFrameId: number;

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

    // Helper to draw PNG face cleanly preserving aspect ratio
    const drawFaceImage = (
      ctx: CanvasRenderingContext2D,
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
      ctx: CanvasRenderingContext2D,
      x: number,
      roofY: number,
      type: 'choco' | 'bomb',
      throwAnim: number
    ) => {
      ctx.save();
      ctx.translate(x, roofY);

      const isChoco = type === 'choco';

      if (isChoco) {
        // CHOCO GIRL: Cream-colored Coat & Pant
        const creamCoat = '#f5f0e1';
        const creamShade = '#dfd5bc';
        const innerShirt = '#78350f';

        // Cream Pants
        ctx.fillStyle = creamShade;
        ctx.fillRect(-9, -18, 7, 18);
        ctx.fillRect(2, -18, 7, 18);

        // Shoes
        ctx.fillStyle = '#451a03';
        ctx.fillRect(-10, -3, 8, 3);
        ctx.fillRect(2, -3, 8, 3);

        // Cream Coat Jacket
        ctx.fillStyle = creamCoat;
        ctx.beginPath();
        ctx.roundRect(-13, -38, 26, 23, 4);
        ctx.fill();
        ctx.strokeStyle = creamShade;
        ctx.lineWidth = 1;
        ctx.stroke();

        // Inner V-neck & Coat Lapels
        ctx.fillStyle = innerShirt;
        ctx.beginPath();
        ctx.moveTo(-4, -38);
        ctx.lineTo(4, -38);
        ctx.lineTo(0, -27);
        ctx.closePath();
        ctx.fill();

        // Coat buttons
        ctx.fillStyle = '#92400e';
        ctx.beginPath();
        ctx.arc(0, -23, 1.3, 0, Math.PI * 2);
        ctx.arc(0, -18, 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Cream Coat Sleeve Throwing Arm
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

        // Held Chocolate preview when ready
        if (throwAnim <= 0) {
          ctx.fillStyle = '#5c2d16';
          ctx.fillRect(15, -31, 11, 7);
          ctx.fillStyle = '#ec4899';
          ctx.fillRect(15, -31, 4, 7);
        }
      } else {
        // BOMBER GIRL: White Saree
        const sareeWhite = '#ffffff';
        const sareeBorder = '#dc2626';
        const goldTrim = '#facc15';

        // Feet peeking under saree
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(-7, -3, 5, 3);
        ctx.fillRect(2, -3, 5, 3);

        // White Saree Skirt
        ctx.fillStyle = sareeWhite;
        ctx.beginPath();
        ctx.moveTo(-10, -24);
        ctx.lineTo(10, -24);
        ctx.lineTo(14, -2);
        ctx.lineTo(-14, -2);
        ctx.closePath();
        ctx.fill();

        // Saree Pleats
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-3, -24);
        ctx.lineTo(-4, -2);
        ctx.moveTo(2, -24);
        ctx.lineTo(2, -2);
        ctx.stroke();

        // Bottom Saree Border (Red & Gold)
        ctx.fillStyle = sareeBorder;
        ctx.fillRect(-14, -5, 28, 3);
        ctx.fillStyle = goldTrim;
        ctx.fillRect(-14, -6, 28, 1.2);

        // White Blouse
        ctx.fillStyle = '#f8fafc';
        ctx.beginPath();
        ctx.roundRect(-10, -38, 20, 14, 3);
        ctx.fill();

        // White Saree Pallu
        ctx.fillStyle = sareeWhite;
        ctx.beginPath();
        ctx.moveTo(-10, -38);
        ctx.lineTo(-3, -38);
        ctx.lineTo(11, -22);
        ctx.lineTo(4, -22);
        ctx.closePath();
        ctx.fill();

        // Red & Gold Pallu Border
        ctx.strokeStyle = sareeBorder;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(-9, -38);
        ctx.lineTo(5, -22);
        ctx.stroke();

        // Throwing Arm
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

        // Held Bomb preview when ready
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

      // Oversized Face Image (52px — bigger than body!)
      const faceImg = isChoco ? imgChocoGirlRef.current : imgBomberRef.current;
      drawFaceImage(ctx, faceImg, 0, -58, 52);

      ctx.restore();
    };

    const drawManCatcher = (
      ctx: CanvasRenderingContext2D,
      x: number,
      groundY: number,
      basketW: number
    ) => {
      ctx.save();
      ctx.translate(x, groundY);

      // CATCHER: Orange Kurta & White Pajama
      const kurtaOrange = '#f97316';
      const kurtaBorder = '#ea580c';
      const goldEmbroidery = '#fde047';

      // White Churidar / Pajama Legs
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(-11, -18, 8, 18);
      ctx.fillRect(3, -18, 8, 18);

      // Traditional Brown Mojari / Sandals
      ctx.fillStyle = '#78350f';
      ctx.fillRect(-13, -4, 10, 4);
      ctx.fillRect(3, -4, 10, 4);

      // Orange Kurta Tunic
      ctx.fillStyle = kurtaOrange;
      ctx.beginPath();
      ctx.roundRect(-16, -46, 32, 34, [6, 6, 2, 2]);
      ctx.fill();
      ctx.strokeStyle = kurtaBorder;
      ctx.lineWidth = 1.2;
      ctx.stroke();

      // Kurta Neck Placket & Gold Buttons
      ctx.fillStyle = kurtaBorder;
      ctx.fillRect(-2.5, -46, 5, 14);
      ctx.fillStyle = goldEmbroidery;
      ctx.beginPath();
      ctx.arc(0, -42, 1.2, 0, Math.PI * 2);
      ctx.arc(0, -37, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Kurta Bottom Hem Trim
      ctx.fillStyle = goldEmbroidery;
      ctx.fillRect(-15, -14, 30, 1.8);

      // Orange Kurta Sleeves holding Catching Basket overhead
      const basketY = -104;
      ctx.strokeStyle = kurtaOrange;
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-15, -40);
      ctx.lineTo(-basketW / 2 + 8, basketY + 12);
      ctx.moveTo(15, -40);
      ctx.lineTo(basketW / 2 - 8, basketY + 12);
      ctx.stroke();

      // Hands gripping basket
      ctx.strokeStyle = '#fed7aa';
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(-basketW / 2 + 8, basketY + 12);
      ctx.lineTo(-basketW / 2 + 6, basketY + 8);
      ctx.moveTo(basketW / 2 - 8, basketY + 12);
      ctx.lineTo(basketW / 2 - 6, basketY + 8);
      ctx.stroke();

      // Oversized Face Image (58px — bigger than his body!)
      const reaction = catcherReactionRef.current.type;
      const activeCatcherImg =
        reaction === 'happy'
          ? imgCatcherChocoRef.current
          : reaction === 'hurt'
          ? imgCatcherBombRef.current
          : imgCatcherRef.current;

      drawFaceImage(ctx, activeCatcherImg, 0, -70, 58);

      // Catching Basket above head
      ctx.fillStyle = '#2563eb';
      ctx.beginPath();
      ctx.moveTo(-basketW / 2, basketY);
      ctx.lineTo(basketW / 2, basketY);
      ctx.lineTo(basketW / 2 - 7, basketY + 15);
      ctx.lineTo(-basketW / 2 + 7, basketY + 15);
      ctx.closePath();
      ctx.fill();

      // Basket Rim
      ctx.fillStyle = '#93c5fd';
      ctx.fillRect(-basketW / 2 - 2, basketY - 3, basketW + 4, 4.5);

      ctx.restore();
    };

    const drawScene = (ctx: CanvasRenderingContext2D) => {
      const { width, height } = dimensionsRef.current;
      const roofY = Math.max(98, height * 0.22);
      const groundY = height - 32;

      // 1. Dark Night Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, '#090d16');
      skyGrad.addColorStop(1, '#1e293b');
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Moon in night sky
      const moonX = Math.min(65, width * 0.12);
      ctx.fillStyle = '#fef08a';
      ctx.beginPath();
      ctx.arc(moonX, 42, 13, 0, Math.PI * 2);
      ctx.fill();

      // 2. Rooftop Building Structure
      const roofLeft = Math.max(18, width * 0.05);
      const roofRight = Math.min(width - 18, width * 0.95);
      const roofW = roofRight - roofLeft;

      // Building upper wall under roof
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(roofLeft + 10, roofY, roofW - 20, 34);

      // Lit building windows under roof
      ctx.fillStyle = '#1e3a8a';
      const winCount = Math.max(3, Math.floor((roofW - 60) / 70));
      for (let i = 0; i < winCount; i++) {
        const wx = roofLeft + 30 + i * ((roofW - 80) / Math.max(1, winCount - 1));
        ctx.fillRect(wx, roofY + 8, 22, 18);
      }

      // Roof Ledge
      ctx.fillStyle = '#475569';
      ctx.fillRect(roofLeft, roofY - 7, roofW, 10);
      ctx.fillStyle = '#94a3b8';
      ctx.fillRect(roofLeft, roofY - 7, roofW, 2.5);

      // Street / Floorboard at bottom
      ctx.fillStyle = '#27170d';
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.fillStyle = '#451a03';
      ctx.fillRect(0, groundY, width, 4);
    };

    const updateAndRender = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (!canvas || !ctx) return;

      const { width, height } = dimensionsRef.current;
      const roofY = Math.max(98, height * 0.22);
      const groundY = height - 32;
      const basketW = 78;

      ctx.save();

      // Screen shake on bomb catch
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

      drawScene(ctx);

      const speedMult = 1 + Math.min(1.2, Math.max(0, scoreRef.current - 5) / 250);

      // 1. Update Two Girls Moving Left-to-Right Unstably on the Roof
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

      // 2. Non-Overlapping Throw Logic (play throw sound once every 2 throws)
      globalThrowCooldownRef.current--;
      if (globalThrowCooldownRef.current <= 0 && !gameOverRef.current) {
        throwCountRef.current += 1;
        const shouldPlayThrowSound = throwCountRef.current % 2 === 0;
        const isChocoThrow = Math.random() < 0.62;

        if (isChocoThrow) {
          chocoGirlRef.current.throwAnim = 18;
          if (shouldPlayThrowSound) {
            playSound('throwchoco.mp3', 0.7);
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
            playSound('throwbomb.mp3', 0.7);
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

      // 3. Draw Both Girls on the Roof
      drawGirlOnRoof(ctx, chocoGirlRef.current.x, roofY - 7, 'choco', chocoGirlRef.current.throwAnim);
      drawGirlOnRoof(ctx, bombGirlRef.current.x, roofY - 7, 'bomb', bombGirlRef.current.throwAnim);

      // 4. Update Catcher Man Movement
      const moveSpeed = 9;
      if (keysRef.current.left) targetPlayerXRef.current -= moveSpeed;
      if (keysRef.current.right) targetPlayerXRef.current += moveSpeed;

      const halfBasket = basketW / 2;
      targetPlayerXRef.current = Math.max(
        halfBasket + 8,
        Math.min(width - halfBasket - 8, targetPlayerXRef.current)
      );
      playerXRef.current += (targetPlayerXRef.current - playerXRef.current) * 0.35;

      // 5. Update & Draw Falling Chocolates and Bombs
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

        // Check Catch inside Basket
        const caughtX = Math.abs(item.x - playerXRef.current) <= halfBasket + 6;
        const caughtY = item.y + item.radius >= basketTopY && item.y - item.radius <= basketBottomY;

        if (caughtX && caughtY && !gameOverRef.current) {
          if (item.type === 'choco') {
            playSound('catchchoco.mp3', 0.8);
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
            playSound('catchbomb.mp3', 0.85);
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

        // Ground impact
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

        // Draw Falling Item
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

      // 6. Draw Catcher Man at Bottom
      drawManCatcher(ctx, playerXRef.current, groundY, basketW);

      // 7. Update & Draw Particles
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

      // 8. Update & Draw Floating Texts
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
        className={`flex items-center justify-between gap-2 bg-slate-900/95 backdrop-blur px-3 sm:px-5 py-2.5 border-slate-700 ${
          isFullscreen
            ? 'w-full border-b shrink-0'
            : 'w-full max-w-[800px] rounded-t-xl border border-b-0'
        }`}
      >
        {/* Left: Exit Game Button + Score Counter */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            onClick={handleExitGame}
            aria-label="Exit Game"
            title="Exit to Game Menu"
            className="cursor-pointer h-9 px-2.5 sm:px-3 flex items-center justify-center gap-1.5 bg-rose-600/20 hover:bg-rose-600/35 active:scale-95 border border-rose-500/40 rounded-lg text-xs sm:text-sm font-bold text-rose-300 transition"
          >
            <FaSignOutAlt className="rotate-180" />
            <span className="hidden sm:inline">Exit</span>
          </button>

          <div className="flex items-center gap-1.5 text-sm sm:text-xl font-bold text-yellow-400">
            <FaStar className="text-yellow-400 text-xs sm:text-base" />
            <span className="hidden xs:inline">Score:</span>
            <span
              className={`inline-block transition-all duration-200 origin-left ${
                scorePop
                  ? 'scale-125 text-white drop-shadow-[0_0_8px_rgba(250,204,21,0.9)]'
                  : 'scale-100 text-yellow-400'
              }`}
            >
              {score}
            </span>
          </div>
        </div>

        {/* Health Bar */}
        <div className="flex items-center gap-2 flex-1 max-w-[220px] mx-1 sm:mx-2">
          <FaHeart
            className={`text-sm sm:text-base shrink-0 transition-transform ${
              health > 50
                ? 'text-emerald-400'
                : health > 25
                ? 'text-amber-400 animate-pulse'
                : 'text-rose-500 animate-bounce'
            }`}
          />
          <div className="relative w-full h-4 bg-slate-950 rounded-full p-0.5 border border-slate-700 shadow-inner overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ease-out relative overflow-hidden ${
                health > 50
                  ? 'bg-gradient-to-r from-emerald-600 via-green-500 to-lime-400 shadow-[0_0_10px_rgba(16,185,129,0.6)]'
                  : health > 25
                  ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.6)]'
                  : 'bg-gradient-to-r from-red-700 via-rose-600 to-red-400 shadow-[0_0_12px_rgba(239,68,68,0.8)]'
              }`}
              style={{ width: `${health}%` }}
            >
              <div className="absolute inset-x-0 top-0 h-1/2 bg-white/25 rounded-full" />
            </div>
          </div>
          <span className="text-[11px] sm:text-xs font-extrabold text-slate-200 tabular-nums shrink-0 w-8 text-right">
            {health}%
          </span>
        </div>

        {/* Right Controls: Icon-Only Mute & Fullscreen */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={toggleMute}
            aria-label={isMuted ? 'Unmute' : 'Mute'}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="cursor-pointer w-9 h-9 flex items-center justify-center bg-slate-800 hover:bg-slate-700 active:scale-95 border border-slate-600 rounded-lg text-base sm:text-lg transition"
          >
            {isMuted ? (
              <FaVolumeMute className="text-rose-400" />
            ) : (
              <FaVolumeUp className="text-emerald-400" />
            )}
          </button>

          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen'}
            className="cursor-pointer w-9 h-9 flex items-center justify-center bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg text-base sm:text-lg text-white transition"
          >
            {isFullscreen ? <FaCompress /> : <FaExpand />}
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
          className={`w-full h-full block cursor-ew-resize touch-none ${
            isFullscreen ? '' : 'border-2 border-slate-700 rounded-b-xl shadow-2xl'
          }`}
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-red-500 mb-2">
              {gameOverReason === 'score' ? 'Score Dropped to 0!' : 'Boom! Game Over!'}
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-6">
              {gameOverReason === 'score' ? (
                'You missed too many chocolates!'
              ) : (
                <>
                  Final Score:{' '}
                  <span className="font-bold text-yellow-400">{score}</span>
                </>
              )}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={resetGame}
                className="cursor-pointer px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg font-bold text-base sm:text-lg transition flex items-center gap-2"
              >
                <FaRedo />
                <span>Play Again</span>
              </button>
              <button
                onClick={handleExitGame}
                className="cursor-pointer px-5 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-600 active:scale-95 rounded-lg font-bold text-base sm:text-lg transition flex items-center gap-2"
              >
                <FaSignOutAlt className="rotate-180" />
                <span>Exit Game</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {!isFullscreen && (
        <p className="text-xs sm:text-sm text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1.5">
          <span>Don&apos;t drop chocolates (-5) • Tap</span>
          <FaExpand className="text-slate-200 inline" />
          <span>at top-right for edge-to-edge mobile play</span>
        </p>
      )}
    </div>
  );
}
