'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  FaSearch,
  FaBars,
  FaTimes,
  FaHome,
  FaFilm,
  FaGamepad,
} from 'react-icons/fa';
import { PiPlanet } from 'react-icons/pi';
import { GiAstronautHelmet } from 'react-icons/gi';
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
      icon: <FaHome className="text-sm" />,
    },
    {
      name: '3D Space',
      href: '/space-3d',
      icon: <PiPlanet className="text-sm" />,
    },
    {
      name: 'Theatre',
      href: '/theatre',
      icon: <FaFilm className="text-sm" />,
    },
    {
      name: 'Games',
      href: '/games',
      icon: <FaGamepad className="text-sm" />,
    },
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
            ? 'bg-[#08090f]/90 backdrop-blur-xl border-b border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.6)]'
            : 'bg-gradient-to-b from-black/80 to-transparent'
        }`}
      >
        {/* Aesthetic Editorial / Cosmic Wordmark Logo */}
        <Link
          href="/"
          onClick={() => setMenuOpen(false)}
          className="flex items-center gap-3 group cursor-pointer relative z-50 select-none"
        >
          {/* Minimalist Orbital Mark */}
          <div className="relative flex items-center justify-center w-9 h-9 rounded-full border border-white/15 bg-white/[0.03] group-hover:border-cyan-400/50 transition-colors duration-300">
            <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_10px_rgba(103,232,249,0.8)]" />
            <span className="absolute inset-1 rounded-full border border-dashed border-white/20 group-hover:rotate-45 transition-transform duration-500" />
          </div>

          {/* Refined Typographic Brand */}
          <div className="flex flex-col leading-none">
            <div className="flex items-baseline gap-1.5">
              <span className="text-lg sm:text-xl font-semibold tracking-[0.2em] uppercase text-white">
                Verse
              </span>
              <span className="text-lg sm:text-xl font-light tracking-[0.16em] uppercase text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-200 to-violet-300">
                Ex
              </span>
            </div>
            <span className="mt-1 text-[9px] tracking-[0.34em] uppercase text-zinc-400 group-hover:text-zinc-200 transition-colors duration-300">
              Cosmos &amp; Beyond
            </span>
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
                    ? 'text-cyan-300 bg-white/[0.07] border border-white/15'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                {link.icon}
                {link.name}
                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-400/10 to-violet-400/10 -z-10"
                    transition={{ type: 'spring', duration: 0.5 }}
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
            <div
              className={`relative flex items-center w-full bg-white/[0.04] hover:bg-white/[0.07] border transition-all duration-300 rounded-full px-4 py-2 ${
                searchFocused
                  ? 'border-cyan-400/40 bg-white/[0.08] shadow-[0_0_20px_rgba(34,211,238,0.12)]'
                  : 'border-white/10 hover:border-white/20'
              }`}
            >
              <FaSearch
                className={`text-xs transition-colors duration-300 ${
                  searchFocused ? 'text-cyan-300' : 'text-zinc-400'
                }`}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                placeholder="Search universe..."
                className="bg-transparent text-white placeholder-zinc-500 focus:outline-none text-sm w-full ml-2.5"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Mobile Menu Toggle Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle Menu"
          className="lg:hidden text-white text-base p-2.5 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 transition-all duration-300 relative z-50 cursor-pointer"
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
            className="fixed inset-0 w-screen h-[100dvh] bg-[#07080e]/98 backdrop-blur-3xl z-40 lg:hidden flex flex-col justify-between px-6 pt-24 pb-8 overflow-y-auto"
          >
            {/* Subtle Ambient Glows */}
            <div className="absolute top-1/4 -left-20 w-72 h-72 bg-cyan-500/10 rounded-full blur-[110px] pointer-events-none" />
            <div className="absolute bottom-1/4 -right-20 w-72 h-72 bg-violet-500/10 rounded-full blur-[110px] pointer-events-none" />

            {/* Top Content: Search + Navigation Links */}
            <div className="space-y-6 relative z-10 w-full max-w-md mx-auto">
              {/* Mobile Search Bar */}
              <form
                onSubmit={handleSearchSubmit}
                className="relative flex items-center bg-white/[0.05] border border-white/10 rounded-2xl px-4 py-3.5 focus-within:border-cyan-400/40 transition-all duration-300"
              >
                <FaSearch className="text-cyan-300 text-sm shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search cosmic archives..."
                  className="bg-transparent text-white placeholder-zinc-500 focus:outline-none text-base w-full ml-3"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="text-zinc-400 hover:text-white p-1"
                  >
                    <FaTimes className="text-sm" />
                  </button>
                )}
              </form>

              {/* Nav Links */}
              <div className="flex flex-col space-y-3 pt-2">
                <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-[0.25em] px-2">
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
                            ? 'bg-white/[0.08] text-cyan-300 border border-cyan-400/30 shadow-[0_0_25px_rgba(34,211,238,0.12)]'
                            : 'bg-white/[0.02] border border-white/5 text-zinc-300 hover:bg-white/[0.06] hover:border-white/10'
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <span
                            className={`p-2.5 rounded-xl ${
                              isActive
                                ? 'bg-cyan-400/15 text-cyan-300'
                                : 'bg-white/5 text-zinc-400'
                            }`}
                          >
                            {link.icon}
                          </span>
                          <span className="text-lg font-medium tracking-wide">
                            {link.name}
                          </span>
                        </div>

                        {isActive ? (
                          <span className="w-2 h-2 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
                        ) : (
                          <span className="text-zinc-600 text-sm">→</span>
                        )}
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Footer Area */}
            <div className="relative z-10 w-full max-w-md mx-auto pt-6 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
              <div className="flex items-center gap-2">
                <PiPlanet className="text-cyan-300 text-base" />
                <span>Explore the cosmos</span>
              </div>
              <div className="flex items-center gap-2">
                <GiAstronautHelmet className="text-violet-300 text-base" />
                <span className="font-mono text-zinc-500">v2.0</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}