export const metadata = {
    title: "About - MangaVerse",
    description: "Learn about MangaVerse and our mission.",
};

export default function AboutPage() {
    return (
        <div className="max-w-3xl mx-auto px-6 py-12">
            <h1 className="Heading-lg text-3xl mb-8 text-foreground">About MangaVerse</h1>

            {/* Mission Section */}
            <section className="section-card p-6 mb-6">
                <h2 className="text-lg font-bold mb-3 text-foreground flex items-center gap-2">
                    <svg className="w-5 h-5 text-blade-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Our Mission
                </h2>
                <p className="text-gray-600 light:text-gray-600 leading-relaxed mb-3">
                    MangaVerse is a companion tool designed to help you organize your reading life in a calm, distraction-free environment.
                </p>
                <p className="text-gray-600 light:text-gray-600 leading-relaxed">
                    We believe that tracking your progress should be effortless, and finding your next obsession should be based on how you want to feel, not just popularity charts.
                </p>
            </section>

            {/* What MangaVerse is NOT - Dark Contrast Card */}
            <div className="contrast-card mb-8">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2 text-blade-orange">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                    </svg>
                    What MangaVerse is NOT
                </h2>
                <ul className="space-y-2 text-sm text-gray-300">
                    <li className="flex items-start gap-2">
                        <span className="text-blade-orange mt-0.5">✕</span>
                        <span>It is NOT a reader application.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blade-orange mt-0.5">✕</span>
                        <span>It does NOT host, scrape, or distribute copyrighted content.</span>
                    </li>
                    <li className="flex items-start gap-2">
                        <span className="text-blade-orange mt-0.5">✕</span>
                        <span>It does NOT provide links to pirated material.</span>
                    </li>
                </ul>
            </div>

            {/* Future Vision Section */}
            <section className="section-card p-6 mb-8">
                <h2 className="text-lg font-bold mb-3 text-foreground flex items-center gap-2">
                    <svg className="w-5 h-5 text-blade-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Future Vision
                </h2>
                <p className="text-gray-600 light:text-gray-600 leading-relaxed">
                    We are building towards a future where intelligent assistants help you explore lore, compare characters, and find hidden gems deep within the genres you love.
                </p>
            </section>

            {/* Roadmap Section */}
            <section>
                <h2 className="Heading-lg text-xl mb-4 text-foreground">Roadmap</h2>
                <div className="grid sm:grid-cols-2 gap-4">
                    <div className="roadmap-card">
                        <div className="text-xs font-bold text-blade-green uppercase tracking-wider mb-2">Phase 1</div>
                        <h3 className="font-bold text-foreground mb-1">Core Tracking</h3>
                        <p className="text-sm text-gray-500">Track manga, manhwa, and anime progress with a clean interface.</p>
                    </div>
                    <div className="roadmap-card">
                        <div className="text-xs font-bold text-blade-green uppercase tracking-wider mb-2">Phase 2</div>
                        <h3 className="font-bold text-foreground mb-1">Smart Discovery</h3>
                        <p className="text-sm text-gray-500">Mood-based recommendations and advanced filtering.</p>
                    </div>
                    <div className="roadmap-card">
                        <div className="text-xs font-bold text-blade-orange uppercase tracking-wider mb-2">Coming Soon</div>
                        <h3 className="font-bold text-foreground mb-1">AI Lore Assistant</h3>
                        <p className="text-sm text-gray-500">Explore character backgrounds and plot summaries without spoilers.</p>
                    </div>
                    <div className="roadmap-card">
                        <div className="text-xs font-bold text-blade-orange uppercase tracking-wider mb-2">Coming Soon</div>
                        <h3 className="font-bold text-foreground mb-1">Community Features</h3>
                        <p className="text-sm text-gray-500">Share lists, compare progress, and discuss with fellow readers.</p>
                    </div>
                </div>
            </section>
        </div>
    );
}
