export default function Footer() {
    return (
        <footer className="border-t border-blade-silver/20 bg-black/95 py-8 px-6 mt-auto">
            <div className="max-w-4xl mx-auto text-center text-gray-500 text-sm">
                <p className="font-bold text-gray-400 tracking-wider font-display">© {new Date().getFullYear()} MANGAVERSE</p>
                <p className="mt-2 text-xs opacity-60 max-w-md mx-auto leading-relaxed font-sans">
                    MangaVerse does not host, distribute, or scrape copyrighted content.
                    This is a companion app for tracking purposes only.
                </p>
            </div>
        </footer>
    );
}
