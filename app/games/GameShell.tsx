'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
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

export type Dimensions = {
  width: number;
  height: number;
};

type GameShellProps = {
  mediaBase: string;
  score: number;
  initialScore?: number;
  health: number;
  gameOver: boolean;
  gameOverTitle: string;
  gameOverMessage: React.ReactNode;
  restartLabel?: string;
  canvasCursorClass?: string;
  footerHint?: React.ReactNode;
  landscapeHeight?: number;
  portraitWidth?: number;
  onReset: () => void;
  onExit: () => void;
  onDimensionsChange?: (dims: Dimensions) => void;
  onMuteChange?: (muted: boolean) => void;
  renderCanvas: (ctx: CanvasRenderingContext2D, dims: Dimensions) => void;
  onPointerMoveCanvas?: (
    e: React.PointerEvent<HTMLCanvasElement>,
    dims: Dimensions
  ) => void;
  onPointerDownCanvas?: (
    e: React.PointerEvent<HTMLCanvasElement>,
    dims: Dimensions
  ) => void;
  registerSoundPlayer?: (playSound: (fileName: string, volume?: number) => void) => void;
};

export default function GameShell({
  mediaBase,
  score,
  initialScore = 0,
  health,
  gameOver,
  gameOverTitle,
  gameOverMessage,
  restartLabel = 'Play Again',
  canvasCursorClass = 'cursor-crosshair',
  footerHint,
  landscapeHeight = 500,
  portraitWidth = 480,
  onReset,
  onExit,
  onDimensionsChange,
  onMuteChange,
  renderCanvas,
  onPointerMoveCanvas,
  onPointerDownCanvas,
  registerSoundPlayer,
}: GameShellProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [scorePop, setScorePop] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const isMutedRef = useRef(false);
  const dimensionsRef = useRef<Dimensions>({
    width: 800,
    height: landscapeHeight,
  });

  // Pop animation whenever score changes from initialScore
  useEffect(() => {
    if (score === initialScore) return;
    setScorePop(true);
    const timer = setTimeout(() => setScorePop(false), 180);
    return () => clearTimeout(timer);
  }, [score, initialScore]);

  // Match canvas internal resolution to actual container aspect ratio
  useEffect(() => {
    const updateCanvasResolution = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const aspect = rect.width / rect.height;
      let nextDims: Dimensions;

      if (aspect < 1) {
        const logicalWidth = portraitWidth;
        const logicalHeight = Math.round(logicalWidth / aspect);
        nextDims = { width: logicalWidth, height: logicalHeight };
      } else {
        const logicalHeight = landscapeHeight;
        const logicalWidth = Math.round(logicalHeight * aspect);
        nextDims = { width: logicalWidth, height: logicalHeight };
      }

      canvas.width = nextDims.width;
      canvas.height = nextDims.height;
      dimensionsRef.current = nextDims;
      onDimensionsChange?.(nextDims);
    };

    updateCanvasResolution();
    window.addEventListener('resize', updateCanvasResolution);
    return () => window.removeEventListener('resize', updateCanvasResolution);
  }, [isFullscreen, landscapeHeight, portraitWidth, onDimensionsChange]);

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
      const next = !prev;
      isMutedRef.current = next;
      onMuteChange?.(next);
      return next;
    });
  };

  const playSound = useCallback(
    (fileName: string, volume = 0.75) => {
      if (isMutedRef.current) return;
      try {
        const audio = new Audio(`${mediaBase}/${fileName}`);
        audio.volume = volume;
        audio.play().catch(() => {});
      } catch (err) {
        console.error('Audio playback failed:', err);
      }
    },
    [mediaBase]
  );

  useEffect(() => {
    registerSoundPlayer?.(playSound);
  }, [playSound, registerSoundPlayer]);

  // Main animation loop driven by GameShell
  useEffect(() => {
    if (gameOver) return;

    let animationFrameId: number;

    const tick = () => {
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        renderCanvas(ctx, dimensionsRef.current);
      }
      animationFrameId = requestAnimationFrame(tick);
    };

    animationFrameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, renderCanvas]);

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
          onPointerMove={(e) => onPointerMoveCanvas?.(e, dimensionsRef.current)}
          onPointerDown={(e) => onPointerDownCanvas?.(e, dimensionsRef.current)}
          className={`w-full h-full block touch-none ${canvasCursorClass} ${
            isFullscreen ? '' : 'border-2 border-slate-700 rounded-b-xl shadow-2xl'
          }`}
        />

        {gameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/85 text-white p-4 text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-red-500 mb-2">
              {gameOverTitle}
            </h2>
            <p className="text-base sm:text-lg text-slate-300 mb-6">
              {gameOverMessage}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={onReset}
                className="cursor-pointer px-6 py-3 bg-blue-600 hover:bg-blue-500 active:scale-95 rounded-lg font-bold text-base sm:text-lg transition flex items-center gap-2"
              >
                <FaRedo />
                <span>{restartLabel}</span>
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

      {!isFullscreen && footerHint && (
        <p className="text-xs sm:text-sm text-slate-400 text-center mt-2.5 flex items-center justify-center gap-1.5">
          {footerHint}
        </p>
      )}
    </div>
  );
}