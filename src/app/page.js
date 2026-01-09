import Link from 'next/link';
import RecommendedForYou from '@/components/RecommendedForYou';

export default function Home() {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-[85vh] px-6 text-center relative overflow-hidden">
        {/* Background Ambience - Toned down for light mode */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blade-green/3 dark:bg-blade-green/5 rounded-full blur-[80px] pointer-events-none" />

        {/* Hero Content - Clean layout without box */}
        <div className="relative z-10 flex flex-col items-center p-8 md:p-12 transition-all duration-300">

          {/* Kicker */}
          <span className="text-gray-600 dark:text-blade-silver tracking-[0.25em] uppercase text-sm font-bold mb-4">
            Your Realm For
          </span>

          {/* Main Title - Tightened spacing */}
          <h1 className="flex flex-col items-center leading-[0.85] uppercase font-display italic transform -skew-x-6">
            <span className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-gray-900 to-gray-700 dark:from-white dark:to-gray-400">
              Manga
            </span>
            <span className="text-6xl md:text-8xl font-black gradient-text-hero">
              & Anime
            </span>
          </h1>

          {/* Subtext - Improved contrast */}
          <p className="mt-8 max-w-lg text-base md:text-lg text-gray-700 dark:text-gray-300 font-medium tracking-wide leading-relaxed">
            Track what you read. Discover what's next. <br />
            <span className="text-black dark:text-white font-bold">No clutter. Just action.</span>
          </p>

          {/* Action Buttons - Slash styled */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link
              href="/track"
              className="blade-button text-base tracking-wider shadow-xl dark:shadow-none"
            >
              Start Tracking
            </Link>
            <Link
              href="/discover"
              className="blade-button blade-button-secondary text-base tracking-wider shadow-md dark:shadow-none"
            >
              Discover Series
            </Link>
          </div>
        </div>
      </div>

      {/* Personalized Recommendations (Auth Only) */}
      <RecommendedForYou />
    </>
  );
}
