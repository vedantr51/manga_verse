"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import AuthButton from './AuthButton';
import SyncStatus from './SyncStatus';

export default function Navbar() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    if (document.body.classList.contains('light')) {
      setIsLight(true);
    }
  }, []);

  const toggleTheme = () => {
    document.body.classList.toggle('light');
    setIsLight(!isLight);
  };

  return (
    <nav className="border-b border-blade-silver/20 light:border-gray-200 bg-black/95 light:bg-white/95 backdrop-blur-md px-6 py-3 sticky top-0 z-50 transition-colors duration-150">
      <div className="w-full flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative w-64 h-16 overflow-hidden transition-all duration-150 group-hover:scale-[1.02]">
            <Image
              src="/logo-v2.png"
              alt="MangaVerse"
              fill
              className="object-contain object-left"
              priority
            />
          </div>
        </Link>

        <div className="flex items-center gap-6">
          <Link
            href="/track"
            className="Heading-lg text-base text-gray-400 light:text-gray-600 hover:text-blade-green transition-colors duration-150 tracking-wider relative group"
          >
            Track
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blade-green transition-all duration-150 group-hover:w-full" />
          </Link>
          <Link
            href="/discover"
            className="Heading-lg text-base text-gray-400 light:text-gray-600 hover:text-blade-green transition-colors duration-150 tracking-wider relative group"
          >
            Discover
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blade-green transition-all duration-150 group-hover:w-full" />
          </Link>
          <Link
            href="/about"
            className="Heading-lg text-base text-gray-400 light:text-gray-600 hover:text-blade-green transition-colors duration-150 tracking-wider relative group"
          >
            About
            <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blade-green transition-all duration-150 group-hover:w-full" />
          </Link>

          {/* Sync Status Indicator */}
          <SyncStatus />

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="ml-2 p-2.5 border border-blade-silver/20 light:border-gray-200 text-blade-green hover:bg-blade-green/10 transition-all duration-150 active:scale-95"
            style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
            aria-label="Toggle Theme"
          >
            {isLight ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>

          {/* Auth Button */}
          <AuthButton />
        </div>
      </div>
    </nav>
  );
}
