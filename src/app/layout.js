import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SessionProvider from "@/components/SessionProvider";
import { SeriesProvider } from "@/lib/store";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "MangaVerse - Track & Discover",
  description: "Track your reading and discover new manga/anime series.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-white dark:bg-black text-gray-900 dark:text-gray-100`}
      >
        <SessionProvider>
          <SeriesProvider>
            <Navbar />
            <main className="flex-grow">
              {children}
            </main>
            <Footer />
          </SeriesProvider>
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
