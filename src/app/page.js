import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center relative overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blade-green/5 rounded-full blur-[80px] pointer-events-none" />

      {/* Light Mode Glass Panel */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-white/30 backdrop-blur-[1px] -z-0 opacity-0 light:opacity-100 transition-opacity duration-200 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Kicker */}
        <span className="text-blade-silver light:text-gray-500 tracking-[0.25em] uppercase text-sm font-bold mb-3">
          Your Realm For
        </span>

        {/* Main Title - Tightened spacing */}
        <h1 className="flex flex-col items-center leading-[0.85] uppercase font-display italic transform -skew-x-6">
          <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-gray-400 light:from-gray-800 light:to-gray-600">
            Manga
          </span>
          <span className="text-6xl md:text-8xl font-black gradient-text-hero">
            & Anime
          </span>
        </h1>

        {/* Subtext - Reduced spacing */}
        <p className="mt-6 max-w-md text-base md:text-lg text-gray-300 light:text-gray-600 font-normal tracking-wide leading-snug">
          Track what you read. Discover what's next. <br />
          <span className="text-white light:text-gray-900 font-semibold">No clutter. Just action.</span>
        </p>

        {/* Action Buttons - Slash styled */}
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Link
            href="/track"
            className="blade-button text-base tracking-wider"
          >
            Start Tracking
          </Link>
          <Link
            href="/discover"
            className="blade-button blade-button-secondary text-base tracking-wider"
          >
            Discover Series
          </Link>
        </div>
      </div>
    </div>
  );
}
