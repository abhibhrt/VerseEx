'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  FaRocket, 
  FaSearch, 
  FaBars, 
  FaTimes,
  FaHome,
  FaFilm,
} from 'react-icons/fa';
import { 
  PiPlanet, 
} from 'react-icons/pi';
import {   
  GiAstronautHelmet 
} from 'react-icons/gi';
import { motion, AnimatePresence } from 'framer-motion';

export default function Navbar() {
    const [searchQuery, setSearchQuery] = useState('');
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const [searchFocused, setSearchFocused] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    useEffect(() => {
        const handleScroll = () => {
            setScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Full screen mobile menu khulne par background body scroll lock karna
    useEffect(() => {
        if (menuOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [menuOpen]);

    const navLinks = [
        { 
            name: 'Home', 
            href: '/', 
            icon: <FaHome className="text-sm" /> 
        },
        { 
            name: '3D Space', 
            href: '/space-3d', 
            icon: <PiPlanet className="text-sm" /> 
        },
        { 
            name: 'Theatre', 
            href: '/theatre', 
            icon: <FaFilm className="text-sm" /> 
        }
    ];

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        router.push(`/search/${encodeURIComponent(searchQuery.trim())}`);
        setMenuOpen(false);
        setSearchQuery('');
    };

    return (
        <>
            <nav
                className={`fixed top-0 left-0 w-full z-100 transition-all duration-500 px-6 lg:px-12 py-3.5 flex items-center justify-between ${
                    scrolled
                        ? 'bg-[#0a0618]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_8px_32px_0_rgba(14,116,144,0.3)]'
                        : 'bg-gradient-to-b from-black/90 to-transparent'
                }`}
            >
                {/* Logo */}
                <Link href="/" onClick={() => setMenuOpen(false)} className="flex items-center gap-3 group cursor-pointer relative z-50">
                    <div className="flex flex-col">
                        <h1 className="text-2xl font-black tracking-wider text-white drop-shadow-[0_2px_10px_rgba(56,189,248,0.5)] flex items-center gap-1">
                            Verse
                            <span className="text-transparent my-fontstyle bg-clip-text bg-gradient-to-r from-cyan-400 via-pink-500 to-yellow-300 animate-gradient-x">
                                Ex
                            </span>
                            <FaRocket className="text-cyan-400 text-sm ml-1" />
                        </h1>
                        <p className="text-[10px] tracking-[0.3em] text-cyan-300/60 uppercase font-medium group-hover:text-cyan-300/90 transition-colors duration-300">
                            Explore the Universe
                        </p>
                    </div>
                </Link>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex items-center gap-1">
                    {navLinks.map((link) => {
                        const isActive = pathname === link.href;
                        return (
                            <Link
                                key={link.name}
                                href={link.href}
                                className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                                    isActive
                                        ? 'text-cyan-400 bg-cyan-500/10 border border-cyan-500/30'
                                        : 'text-gray-300 hover:text-white hover:bg-white/5'
                                }`}
                            >
                                {link.icon}
                                {link.name}
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTab"
                                        className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/20 to-pink-500/20 -z-10"
                                        transition={{ type: "spring", duration: 0.5 }}
                                    />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Search Bar - Desktop */}
                <div className="hidden lg:flex items-center gap-2">
                    <form
                        onSubmit={handleSearchSubmit}
                        className={`relative flex items-center transition-all duration-300 ${
                            searchFocused ? 'w-64' : 'w-48'
                        }`}
                    >
                        <div className={`absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 to-pink-500/10 blur transition-opacity duration-300 ${
                            searchFocused ? 'opacity-100' : 'opacity-0'
                        }`} />
                        <div className={`relative flex items-center w-full bg-white/5 hover:bg-white/10 border transition-all duration-300 rounded-full px-4 py-2 ${
                            searchFocused 
                                ? 'border-cyan-400/50 bg-white/10 shadow-[0_0_20px_rgba(56,189,248,0.15)]' 
                                : 'border-white/10 hover:border-white/20'
                        }`}>
                            <FaSearch className={`text-sm transition-colors duration-300 ${
                                searchFocused ? 'text-cyan-400' : 'text-gray-400'
                            }`} />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onFocus={() => setSearchFocused(true)}
                                onBlur={() => setSearchFocused(false)}
                                placeholder="Search universe..."
                                className="bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm w-full ml-2"
                            />
                            {searchQuery && (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery('')}
                                    className="text-gray-400 hover:text-white transition-colors cursor-pointer"
                                >
                                    <FaTimes className="text-xs" />
                                </button>
                            )}
                        </div>
                    </form>
                </div>

                {/* Mobile Menu Toggle Button (Z-index 50 par taaki overlay ke upar rahe) */}
                <button
                    onClick={() => setMenuOpen(!menuOpen)}
                    aria-label="Toggle Menu"
                    className="lg:hidden text-white text-lg p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 relative z-50 cursor-pointer"
                >
                    <AnimatePresence mode="wait">
                        {menuOpen ? (
                            <motion.div
                                key="close"
                                initial={{ rotate: -90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: 90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <FaTimes />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="menu"
                                initial={{ rotate: 90, opacity: 0 }}
                                animate={{ rotate: 0, opacity: 1 }}
                                exit={{ rotate: -90, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <FaBars />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </button>
            </nav>

            {/* FULL SCREEN MOBILE OVERLAY MENU */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.98 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="fixed inset-0 w-screen h-[100dvh] bg-[#070312]/98 backdrop-blur-3xl z-40 lg:hidden flex flex-col justify-between px-6 pt-24 pb-8 overflow-y-auto"
                    >
                        {/* Background Ambient Glows */}
                        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-cyan-500/15 rounded-full blur-[100px] pointer-events-none" />
                        <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-pink-500/15 rounded-full blur-[100px] pointer-events-none" />

                        {/* Top Content: Search + Navigation Links */}
                        <div className="space-y-6 relative z-10 w-full max-w-md mx-auto">
                            {/* Mobile Search Bar */}
                            <form
                                onSubmit={handleSearchSubmit}
                                className="relative flex items-center bg-white/[0.06] border border-cyan-500/20 rounded-2xl px-4 py-3.5 shadow-[0_0_20px_rgba(6,182,212,0.1)] focus-within:border-cyan-400/60 transition-all duration-300"
                            >
                                <FaSearch className="text-cyan-400 text-base shrink-0" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search cosmic archives..."
                                    className="bg-transparent text-white placeholder-gray-400 focus:outline-none text-base w-full ml-3"
                                />
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={() => setSearchQuery('')}
                                        className="text-gray-400 hover:text-white p-1"
                                    >
                                        <FaTimes className="text-sm" />
                                    </button>
                                )}
                            </form>

                            {/* Nav Links (Staggered appearance) */}
                            <div className="flex flex-col space-y-3 pt-2">
                                <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest px-2">
                                    Navigation
                                </span>

                                {navLinks.map((link, idx) => {
                                    const isActive = pathname === link.href;
                                    return (
                                        <motion.div
                                            key={link.name}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.05 * idx, duration: 0.2 }}
                                        >
                                            <Link
                                                href={link.href}
                                                onClick={() => setMenuOpen(false)}
                                                className={`flex items-center justify-between px-5 py-4 rounded-2xl transition-all duration-200 cursor-pointer ${
                                                    isActive
                                                        ? 'bg-gradient-to-r from-cyan-500/20 via-pink-500/10 to-transparent text-cyan-300 border border-cyan-500/40 shadow-[0_0_25px_rgba(6,182,212,0.2)]'
                                                        : 'bg-white/[0.03] border border-white/5 text-gray-200 hover:bg-white/[0.08] hover:border-white/10'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <span className={`p-2.5 rounded-xl ${isActive ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-gray-400'}`}>
                                                        {link.icon}
                                                    </span>
                                                    <span className="text-lg font-medium tracking-wide">{link.name}</span>
                                                </div>

                                                {isActive ? (
                                                    <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse" />
                                                ) : (
                                                    <span className="text-gray-500 text-sm">→</span>
                                                )}
                                            </Link>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Mobile Footer Area */}
                        <div className="relative z-10 w-full max-w-md mx-auto pt-6 border-t border-white/10 flex items-center justify-between text-xs text-gray-400">
                            <div className="flex items-center gap-2">
                                <PiPlanet className="text-cyan-400 text-base" />
                                <span>Explore the cosmos</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <GiAstronautHelmet className="text-pink-400 text-base" />
                                <span className="font-mono text-zinc-500">v2.0</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <style jsx>{`
                @keyframes gradient-x {
                    0%, 100% { background-position: 0% 50%; }
                    50% { background-position: 100% 50%; }
                }
                .animate-gradient-x {
                    background-size: 200% 200%;
                    animation: gradient-x 3s ease infinite;
                }
            `}</style>
        </>
    );
}