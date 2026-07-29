'use client';

import React from 'react';
import Link from 'next/link';
import { FaRocket, FaGalacticRepublic, FaShieldAlt } from 'react-icons/fa';
import { PiPlanet, PiStarFill } from 'react-icons/pi';
import { GiAstronautHelmet } from 'react-icons/gi';
import { MdOutlineExplore, MdScience, MdChat, MdQuiz, MdGamepad } from 'react-icons/md';

export default function Footer() {
    return (
        <footer className="w-full bg-[#030712] border-t border-zinc-900 text-zinc-400 font-sans pt-16 pb-12 px-6 lg:px-12 relative overflow-hidden">
            {/* Subtle background ambient glow */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-32 bg-cyan-500/5 blur-[120px] pointer-events-none" />

            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 pb-12 border-b border-zinc-900">
                {/* Brand Column */}
                <div className="space-y-4 md:col-span-1">
                    <Link href="/" className="flex flex-col group cursor-pointer inline-block">
                        <h2 className="text-2xl font-black tracking-wider text-white drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)] flex items-center gap-2">
                            <PiPlanet className="text-cyan-400 text-2xl" />
                            Verse <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-300">Ex</span>
                        </h2>
                        <p className="text-[10px] tracking-widest text-cyan-300/70 uppercase font-medium group-hover:text-cyan-300 transition-colors flex items-center gap-1">
                            <PiStarFill className="text-[10px]" />
                            Explore the Universe
                            <PiStarFill className="text-[10px]" />
                        </p>
                    </Link>
                    <p className="text-xs text-zinc-500 leading-relaxed font-light">
                        Your gateway to the cosmos. Discover celestial bodies, track space research, and explore the infinite depths of our universe.
                    </p>
                    <div className="flex gap-3 text-zinc-600">
                        <GiAstronautHelmet className="text-xl hover:text-cyan-400 transition-colors cursor-pointer" />
                        <FaGalacticRepublic className="text-xl hover:text-cyan-400 transition-colors cursor-pointer" />
                        <PiPlanet className="text-xl hover:text-cyan-400 transition-colors cursor-pointer" />
                    </div>
                </div>

                {/* Navigation Links */}
                <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-200 flex items-center gap-2">
                        <MdOutlineExplore className="text-cyan-400" />
                        Navigation
                    </h3>
                    <ul className="space-y-2.5 text-xs">
                        <li>
                            <Link href="/" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <FaRocket className="text-[10px] text-zinc-600" />
                                Home Base
                            </Link>
                        </li>
                        <li>
                            <Link href="/objects" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <PiPlanet className="text-[10px] text-zinc-600" />
                                Space Objects
                            </Link>
                        </li>
                        <li>
                            <Link href="/research" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <MdScience className="text-[10px] text-zinc-600" />
                                Research Archive
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Interactive Features */}
                <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-200 flex items-center gap-2">
                        <PiPlanet className="text-cyan-400" />
                        Experience
                    </h3>
                    <ul className="space-y-2.5 text-xs">
                        <li>
                            <Link href="/chatex" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <MdChat className="text-[10px] text-zinc-600" />
                                ChatEx AI
                            </Link>
                        </li>
                        <li>
                            <Link href="/quizzes" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <MdQuiz className="text-[10px] text-zinc-600" />
                                Cosmic Quizzes
                            </Link>
                        </li>
                        <li>
                            <Link href="/game" className="hover:text-cyan-400 transition-colors flex items-center gap-2">
                                <MdGamepad className="text-[10px] text-zinc-600" />
                                Play Game
                            </Link>
                        </li>
                    </ul>
                </div>

                {/* Mission Status / Info */}
                <div className="space-y-4">
                    <h3 className="text-xs font-mono uppercase tracking-widest text-zinc-200 flex items-center gap-2">
                        <FaShieldAlt className="text-cyan-400" />
                        Mission Status
                    </h3>
                    <div className="bg-zinc-950 border border-zinc-900 p-4 space-y-2 rounded-lg">
                        <div className="flex items-center space-x-2 text-xs font-mono text-zinc-300">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                            <span>SYSTEMS: ONLINE</span>
                        </div>
                        <p className="text-[11px] text-zinc-500 font-mono leading-relaxed">
                            Continuously scanning databases and stellar charts for space enthusiasts.
                        </p>
                    </div>
                </div>
            </div>

            {/* Bottom Sub-footer */}
            <div className="max-w-7xl mx-auto pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-600 font-mono">
                <p className="flex items-center gap-2">
                    <PiStarFill className="text-[10px] text-cyan-400" />
                    &copy; {new Date().getFullYear()} VerseEx. All rights reserved across all star systems.
                    <PiStarFill className="text-[10px] text-cyan-400" />
                </p>
                <div className="flex space-x-6 mt-4 sm:mt-0">
                    <span className="hover:text-zinc-400 transition-colors cursor-pointer flex items-center gap-1">
                        <FaShieldAlt className="text-[10px]" />
                        Privacy Protocol
                    </span>
                    <span className="hover:text-zinc-400 transition-colors cursor-pointer flex items-center gap-1">
                        <FaRocket className="text-[10px]" />
                        Terms of Transmission
                    </span>
                </div>
            </div>
        </footer>
    );
}