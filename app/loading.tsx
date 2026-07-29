'use client';

import React from 'react';
import { FaRocket } from 'react-icons/fa';

export default function Loading() {
    const stars = Array.from({ length: 45 });

    return (
        <div
            id="loading-page"
            className="fixed inset-0 bg-[#07030c]/98 backdrop-blur-lg z-[100] flex flex-col items-center justify-center overflow-hidden"
        >
            {/* Background Stars and Glowing Dots */}
            <div className="absolute inset-0 pointer-events-none">
                {stars.map((_, i) => {
                    const randomTop = Math.random() * 100;
                    const randomLeft = Math.random() * 100;
                    const randomDelay = Math.random() * 3;
                    const randomDuration = 2 + Math.random() * 3;
                    const size = Math.random() > 0.5 ? 'w-1 h-1' : 'w-0.5 h-0.5';

                    return (
                        <span
                            key={i}
                            className={`absolute bg-white rounded-full animate-pulse ${size}`}
                            style={{
                                top: `${randomTop}%`,
                                left: `${randomLeft}%`,
                                animationDelay: `${randomDelay}s`,
                                animationDuration: `${randomDuration}s`,
                                opacity: Math.random() * 0.7 + 0.3,
                                boxShadow: '0 0 6px rgba(255, 255, 255, 0.8)'
                            }}
                        />
                    );
                })}
            </div>

            {/* Rocket & Smoke Container */}
            <div className="relative flex flex-col items-center justify-center h-48 mb-4 z-10">
                {/* Flying Rocket */}
                <div className="animate-rocket-fly relative">
                    <FaRocket className="text-5xl text-purple-400 drop-shadow-[0_0_20px_rgba(192,132,252,0.8)]" />
                </div>

                {/* Smoke / Exhaust Tail Effect */}
                <div className="absolute top-12 flex flex-col items-center pointer-events-none">
                    <div className="w-3 h-6 bg-gradient-to-t from-transparent via-purple-300/80 to-white rounded-full animate-smoke-puff blur-[1px]"></div>
                    <div className="w-5 h-8 bg-gradient-to-t from-transparent via-purple-500/50 to-purple-300/80 rounded-full animate-smoke-puff-delayed blur-[2px] -mt-2"></div>
                    <div className="w-8 h-12 bg-gradient-to-t from-transparent via-indigo-500/30 to-purple-500/50 rounded-full animate-smoke-puff-slow blur-[3px] -mt-3"></div>
                </div>
            </div>

            <span className="text-white text-2xl font-bold tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-white via-purple-200 to-[#eb9dff] mb-4 animate-pulse z-10">
                Let's Fly
            </span>
        </div>
    );
}