"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useSeries } from "@/lib/store";
import { SkeletonList } from "./SkeletonCard";

export default function RecommendedForYou() {
    const { data: session } = useSession();
    const { addSeries, showToast } = useSeries();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingIds, setAddingIds] = useState(new Set());

    useEffect(() => {
        if (!session?.user) {
            setLoading(false);
            return;
        }

        async function fetchRecommendations() {
            try {
                const response = await fetch('/api/recommendations/for-you');
                if (!response.ok) {
                    throw new Error('Failed to fetch recommendations');
                }
                const data = await response.json();
                setRecommendations(data.recommendations || []);
            } catch (err) {
                console.error('Error fetching taste-based recommendations:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchRecommendations();
    }, [session]);

    const handleAddToLibrary = async (recommendation) => {
        if (addingIds.has(recommendation.externalId)) return;

        setAddingIds(prev => new Set(prev).add(recommendation.externalId));

        try {
            await addSeries({
                title: recommendation.title,
                type: recommendation.type,
                status: recommendation.type === 'anime' ? 'watching' : 'reading',
                lastProgress: '',
                notes: '',
                externalId: recommendation.externalId,
                thumbnailUrl: recommendation.thumbnailUrl,
                alternateTitles: [],
                rating: 0
            });

            showToast(`${recommendation.title} added to your library!`, 'success');

            // Remove from recommendations
            setRecommendations(prev =>
                prev.filter(r => r.externalId !== recommendation.externalId)
            );
        } catch (error) {
            if (error.message?.includes('409')) {
                showToast(`${recommendation.title} is already in your library`, 'warning');
            } else {
                showToast('Failed to add series. Please try again.', 'error');
            }
        } finally {
            setAddingIds(prev => {
                const next = new Set(prev);
                next.delete(recommendation.externalId);
                return next;
            });
        }
    };

    // Don't show for unauthenticated users
    if (!session?.user) {
        return null;
    }

    // Show skeleton loading state
    if (loading) {
        return (
            <section className="py-12 px-6 bg-gray-50/50 dark:bg-zinc-900/30">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-6 h-6 skeleton rounded" />
                        <div className="h-8 w-56 skeleton rounded" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                        <SkeletonList count={5} variant="grid" />
                    </div>
                </div>
            </section>
        );
    }

    // Show friendly error state
    if (error) {
        return (
            <section className="py-12 px-6 bg-gray-50/50 dark:bg-zinc-900/30">
                <div className="max-w-7xl mx-auto text-center py-8 text-gray-500">
                    <p>Recommendations temporarily unavailable. Try again later.</p>
                </div>
            </section>
        );
    }

    // No recommendations yet
    if (recommendations.length === 0) {
        return (
            <section className="py-12 px-6 bg-gray-50/50 dark:bg-zinc-900/30">
                <div className="max-w-7xl mx-auto text-center py-8">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-400 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <p className="text-gray-500 mb-1">No recommendations yet</p>
                    <p className="text-sm text-gray-400">Rate more series to get personalized picks!</p>
                </div>
            </section>
        );
    }

    return (
        <section className="py-12 px-6 bg-gray-50/50 dark:bg-zinc-900/30">
            <div className="max-w-7xl mx-auto">
                <div className="flex items-center gap-3 mb-6">
                    <svg className="w-6 h-6 text-blade-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                    </svg>
                    <h2 className="Heading-lg text-2xl text-foreground">Recommended for You</h2>
                </div>

                {/* Grid layout - compact cards */}
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {recommendations.map((item) => (
                        <div
                            key={item.externalId}
                            className="group relative rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-blade-orange transition-all duration-200"
                        >
                            {/* Thumbnail - manga cover aspect ratio */}
                            <div className="aspect-[2/3] bg-gray-200 dark:bg-zinc-800 overflow-hidden relative">
                                {item.thumbnailUrl ? (
                                    <img
                                        src={item.thumbnailUrl}
                                        alt={item.title}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}

                                {/* Hover overlay with button */}
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                                    <button
                                        onClick={() => handleAddToLibrary(item)}
                                        disabled={addingIds.has(item.externalId)}
                                        className="w-full py-2 bg-blade-orange text-white text-xs font-bold uppercase tracking-wider hover:bg-blade-orange/90 transition-colors disabled:opacity-50 rounded"
                                    >
                                        {addingIds.has(item.externalId) ? '...' : '+ Add'}
                                    </button>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="p-3">
                                <h3 className="font-semibold text-sm text-foreground mb-1 line-clamp-2 leading-tight">
                                    {item.title}
                                </h3>

                                {/* Reason tag - compact */}
                                <span className="inline-block text-[10px] text-blade-orange font-medium">
                                    {item.reason}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
