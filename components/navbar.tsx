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
  FaQuestionCircle,
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
        <nav
            className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 px-6 lg:px-12 py-3 flex items-center justify-between ${
                scrolled
                    ? 'bg-[#0a0618]/95 backdrop-blur-2xl border-b border-cyan-500/20 shadow-[0_8px_32px_0_rgba(14,116,144,0.3)]'
                    : 'bg-gradient-to-b from-black/80 to-transparent'
            }`}
        >
            {/* Logo */}
            <Link href="/" className="flex items-center gap-3 group cursor-pointer relative">
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
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <FaTimes className="text-xs" />
                            </button>
                        )}
                    </div>
                </form>
            </div>

            {/* Mobile Menu Button */}
            <button
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label="Toggle Menu"
                className="lg:hidden text-white text-xl p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 relative"
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

            {/* Mobile Menu */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="absolute top-full left-0 w-full bg-[#0a0618]/98 backdrop-blur-2xl border-b border-cyan-500/20 shadow-2xl lg:hidden"
                    >
                        <div className="flex flex-col p-6 space-y-4">
                            {/* Mobile Search */}
                            <form
                                onSubmit={handleSearchSubmit}
                                className="flex items-center bg-white/5 border border-white/10 rounded-full px-4 py-2 transition-all duration-300"
                            >
                                <FaSearch className="text-gray-400 text-sm" />
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search universe..."
                                    className="bg-transparent text-white placeholder-gray-400 focus:outline-none text-sm w-full ml-2"
                                />
                            </form>

                            {/* Mobile Links */}
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.name}
                                        href={link.href}
                                        onClick={() => setMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                                            isActive
                                                ? 'bg-gradient-to-r from-cyan-500/20 to-pink-500/20 text-cyan-400 border border-cyan-500/30'
                                                : 'text-gray-300 hover:text-white hover:bg-white/5'
                                        }`}
                                    >
                                        <span className={`text-lg ${isActive ? 'text-cyan-400' : 'text-gray-400'}`}>
                                            {link.icon}
                                        </span>
                                        <span className="text-sm font-medium">{link.name}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="mobileActive"
                                                className="ml-auto w-1.5 h-1.5 rounded-full bg-cyan-400"
                                            />
                                        )}
                                    </Link>
                                );
                            })}

                            {/* Footer Info */}
                            <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs text-gray-500">
                                <div className="flex items-center gap-2">
                                    <PiPlanet className="text-cyan-400" />
                                    <span>Explore the cosmos</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <GiAstronautHelmet className="text-pink-400" />
                                    <span>v2.0</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add custom gradient animation */}
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
        </nav>
    );
}