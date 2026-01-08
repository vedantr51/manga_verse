"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AuthButton from './AuthButton';

export default function Navbar() {
  const [isDark, setIsDark] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    // Check if user has a preference or if system is dark
    // For now, we default to Light as requested, but we can check local storage or class
    if (document.body.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  // Scroll Lock Effect
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  const toggleTheme = () => {
    document.body.classList.toggle('dark');
    setIsDark(!isDark);
  };

  return (
    <nav className="border-b border-gray-200 dark:border-blade-silver/20 bg-white/95 dark:bg-black/95 backdrop-blur-md px-6 py-3 sticky top-0 z-50 transition-colors duration-150">
      <div className="w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group relative z-50">
          <div className="relative w-48 h-12 md:w-64 md:h-16 overflow-hidden transition-all duration-150 group-hover:scale-[1.02]">
            <Image
              src="/logo-v2.png"
              alt="MangaVerse"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/track"
            className="Heading-lg text-base text-gray-600 dark:text-gray-400 hover:text-blade-green transition-colors duration-150 tracking-wider relative group"
          >
            Track
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blade-green transition-all duration-150 group-hover:w-full" />
          </Link>
          <Link
            href="/discover"
            className="Heading-lg text-base text-gray-600 dark:text-gray-400 hover:text-blade-green transition-colors duration-150 tracking-wider relative group"
          >
            Discover
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blade-green transition-all duration-150 group-hover:w-full" />
          </Link>
          <Link
            href="/about"
            className="Heading-lg text-base text-gray-600 dark:text-gray-400 hover:text-blade-green transition-colors duration-150 tracking-wider relative group"
          >
            About
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blade-green transition-all duration-150 group-hover:w-full" />
          </Link>

          {/* Theme Toggle (Desktop) */}
          <button
            onClick={toggleTheme}
            className="ml-2 p-2.5 border border-blade-silver/20 dark:border-gray-200 text-blade-green hover:bg-blade-green/10 transition-all duration-150 active:scale-95"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {/* Auth Button (Desktop) */}
          <AuthButton />
        </div>

        {/* Mobile Header Right Side (Toggle + Hamburger) */}
        <div className="flex md:hidden items-center gap-4">
          {/* Theme Toggle (Mobile) */}
          <button
            onClick={toggleTheme}
            className="p-2 text-blade-green hover:bg-blade-green/10 rounded-full transition-colors"
            aria-label="Toggle Theme"
          >
            {isDark ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            )}
          </button>

          {/* Hamburger */}
          <button
            className="relative z-50 p-2 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <div className="w-6 h-6 flex flex-col justify-center gap-1.5">
              <span className={`block w-full h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`} />
              <span className={`block w-full h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? 'opacity-0' : ''}`} />
              <span className={`block w-full h-0.5 bg-current transition-all duration-300 ${mobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity duration-300 md:hidden ${mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        onClick={() => setMobileMenuOpen(false)}
      />

      {/* Mobile Menu Floating Box */}
      <div
        className={`fixed top-24 left-1/2 -translate-x-1/2 w-[90%] max-w-[340px] z-50 transition-all duration-300 md:hidden flex flex-col items-center py-8 gap-6 rounded-2xl border border-white/20 shadow-2xl overflow-hidden bg-white/95 dark:bg-black/95 backdrop-blur-3xl ${mobileMenuOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-4 pointer-events-none'
          }`}
      >
        <Link
          href="/track"
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400"
          onClick={() => setMobileMenuOpen(false)}
        >
          TRACK
        </Link>
        <Link
          href="/discover"
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400"
          onClick={() => setMobileMenuOpen(false)}
        >
          DISCOVER
        </Link>
        <Link
          href="/about"
          className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400"
          onClick={() => setMobileMenuOpen(false)}
        >
          ABOUT
        </Link>

        <div className="w-12 h-px bg-gray-200 dark:bg-gray-800" />

        <div onClick={() => setMobileMenuOpen(false)}>
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
