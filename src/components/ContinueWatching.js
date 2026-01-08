"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { SkeletonList } from "./SkeletonCard";

export default function ContinueWatching() {
    const { data: session } = useSession();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!session?.user) {
            setLoading(false);
            return;
        }

        async function fetchRecommendations() {
            try {
                const response = await fetch('/api/recommendations/continue');
                if (!response.ok) {
                    throw new Error('Failed to fetch recommendations');
                }
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } catch (err) {
                console.error('Error fetching continue recommendations:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, [session]);

    // Don't show for unauthenticated users
    if (!session?.user) {
        return null;
    }

    // Show skeleton loading state
    if (loading) {
        return (
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 skeleton rounded" />
                        <div className="h-8 w-64 skeleton rounded" />
                    </div>
                    <div className="overflow-x-auto pb-4 -mx-6 px-6">
                        <div className="flex gap-4 min-w-max">
                            <SkeletonList count={3} variant="horizontal" />
                        </div>
                    </div>
                </div>
            </section>
        );
    }

    // Show friendly error state
    if (error) {
        return (
            <section className="py-12 px-6">
                <div className="max-w-7xl mx-auto text-center py-8 text-gray-500">
                    <p>Unable to load your progress. Please refresh the page.</p>
                </div>
            </section>
        );
    }

    if (recommendations.length === 0) {
        return (
            <section className="py-12 px-6">
                <h2 className="Heading-lg text-2xl mb-6 text-foreground">Continue Watching</h2>
                <p className="text-gray-500 text-center py-8">
                    All caught up! Check out recommendations below.
                </p>
            </section>
        );
    }

    return (
        <section className="py-12 px-6">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-blade-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h2 className="Heading-lg text-2xl text-foreground">Continue Where You Left Off</h2>
                </div>

                {/* Horizontal scroll container */}
                <div className="overflow-x-auto pb-4 -mx-6 px-6">
                    <div className="flex gap-4 min-w-max">
                        {recommendations.map((item) => (
                            <div
                                key={item.id}
                                className="relative w-48 h-72 flex-shrink-0 group cursor-pointer rounded-lg overflow-hidden border-2 border-transparent hover:border-blade-green transition-all duration-200"
                            >
                                {/* Full Thumbnail */}
                                {item.thumbnailUrl ? (
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gray-200 dark:bg-zinc-800 text-gray-400">
                                        <svg className="w-16 h-16 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-4">
                                    <h3 className="font-bold text-white text-lg line-clamp-2 mb-1">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-300 mb-3">
                                        {item.lastProgress || "Not started"}
                                    </p>
                                    <a
                                        href="/track"
                                        className="block w-full py-2 px-3 bg-blade-green text-black text-center text-xs font-bold uppercase tracking-wider hover:bg-blade-green/90 transition-colors"
                                        style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                                    >
                                        Continue {item.status === 'watching' ? 'Watching' : 'Reading'}
                                    </a>
                                </div>

                                {/* Always visible title at bottom */}
                                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3 group-hover:opacity-0 transition-opacity duration-200">
                                    <h3 className="font-bold text-white text-sm line-clamp-1">
                                        {item.title}
                                    </h3>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
