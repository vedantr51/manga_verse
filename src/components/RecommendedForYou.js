"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSeries } from "@/lib/store";
import { SkeletonList } from "./SkeletonCard";

const STORAGE_KEY = 'mangaverse_recs_v2';
const DISMISSED_KEY = 'mangaverse_dismissed';

export default function RecommendedForYou() {
    const { data: session } = useSession();
    const { addSeries, showToast } = useSeries();
    const [recommendations, setRecommendations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [addingIds, setAddingIds] = useState(new Set());
    const [addedIds, setAddedIds] = useState(new Set());
    const [dismissingIds, setDismissingIds] = useState(new Set());
    const [tier, setTier] = useState(null);
    const [message, setMessage] = useState('');
    // Per-type loading states (not shared)

    const [loadingMoreType, setLoadingMoreType] = useState({});
    const [page, setPage] = useState(0);

    // Get dismissed IDs from localStorage
    const getDismissedIds = useCallback(() => {
        if (typeof window === 'undefined') return [];
        try {
            return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
        } catch {
            return [];
        }
    }, []);

    // Save dismissed IDs to localStorage
    const saveDismissedIds = useCallback((ids) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
    }, []);

    // Save recommendations to localStorage
    const saveRecommendations = useCallback((recs, tierVal, pageVal) => {
        if (typeof window === 'undefined') return;
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
            recommendations: recs,
            tier: tierVal,
            page: pageVal,
            timestamp: Date.now()
        }));
    }, []);

    // Load recommendations from localStorage
    const loadFromStorage = useCallback(() => {
        if (typeof window === 'undefined') return null;
        try {
            const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
            if (stored && stored.recommendations?.length > 0) {
                return stored;
            }
        } catch { }
        return null;
    }, []);

    // Fetch a single replacement recommendation
    const fetchSingleReplacement = async (excludeIds) => {
        try {
            const dismissed = getDismissedIds();
            const allExclude = [...new Set([...excludeIds, ...dismissed])];
            const response = await fetch(`/api/recommendations/for-you?single=true&exclude=${allExclude.join(',')}`);
            if (!response.ok) return null;
            const data = await response.json();
            return data.recommendations?.[0] || null;
        } catch {
            return null;
        }
    };

    // Fetch initial recommendations from API
    const fetchRecommendations = async (append = false, pageNum = 0, forceRefresh = false) => {
        try {
            setLoading(true);

            const dismissed = getDismissedIds();
            const excludeParam = dismissed.length > 0 ? `&exclude=${dismissed.join(',')}` : '';
            const response = await fetch(`/api/recommendations/for-you?page=${pageNum}${excludeParam}`);
            if (!response.ok) {
                throw new Error('Failed to fetch recommendations');
            }
            const data = await response.json();
            const newRecs = data.recommendations || [];

            if (append) {
                setRecommendations(prev => {
                    const existingIds = new Set(prev.map(r => r.externalId));
                    const filtered = newRecs.filter(r => !existingIds.has(r.externalId));
                    const combined = [...prev, ...filtered];
                    saveRecommendations(combined, data.tier || tier, pageNum);
                    return combined;
                });
            } else {
                setRecommendations(newRecs);
                saveRecommendations(newRecs, data.tier, pageNum);
            }

            setTier(data.tier || 'established');
            setMessage(data.message || '');
            setPage(pageNum);
        } catch (err) {
            console.error('Error fetching recommendations:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Initial load - check localStorage first
    useEffect(() => {
        if (!session?.user) {
            setLoading(false);
            return;
        }

        const stored = loadFromStorage();
        if (stored) {
            setRecommendations(stored.recommendations);
            setTier(stored.tier);
            setPage(stored.page || 0);
            setLoading(false);
        } else {
            fetchRecommendations(false, 0);
        }
    }, [session]);



    const handleLoadMore = () => {
        if (loadingMore) return;
        fetchRecommendations(true, page + 1);
    };

    // Load more recommendations for a specific type (adds 5 more)
    const handleLoadMoreForType = async (typeKey) => {
        if (loadingMoreType[typeKey]) return;
        setLoadingMoreType(prev => ({ ...prev, [typeKey]: true }));

        try {
            const dismissed = getDismissedIds();
            const currentTypeItems = recommendations.filter(r => r.type === typeKey);
            const currentIds = recommendations.map(r => r.externalId);
            const allExclude = [...new Set([...dismissed, ...currentIds])];
            const excludeParam = allExclude.length > 0 ? `&exclude=${allExclude.join(',')}` : '';

            // Calculate page based on how many items we already have for this type
            const nextPage = Math.floor(currentTypeItems.length / 5) + 1;

            const response = await fetch(`/api/recommendations/for-you?type=${typeKey}&limit=5&page=${nextPage}${excludeParam}`);
            if (!response.ok) throw new Error('Failed to fetch');

            const data = await response.json();
            const newRecs = data.recommendations || [];
            console.log(`See More ${typeKey}: fetched ${newRecs.length} items from page ${nextPage}`);

            if (newRecs.length > 0) {
                setRecommendations(prev => {
                    const combined = [...prev, ...newRecs];
                    saveRecommendations(combined, tier, page);
                    return combined;
                });
            }
        } catch (err) {
            console.error('Error loading more:', err);
        } finally {
            setLoadingMoreType(prev => ({ ...prev, [typeKey]: false }));
        }
    };



    const handleAddToLibrary = async (recommendation) => {
        if (addingIds.has(recommendation.externalId) || addedIds.has(recommendation.externalId)) return;

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
            setAddedIds(prev => new Set(prev).add(recommendation.externalId));

        } catch (error) {
            if (error.message?.includes('409')) {
                showToast(`${recommendation.title} is already in your library`, 'warning');
                // Mark as added so user sees it's done
                setAddedIds(prev => new Set(prev).add(recommendation.externalId));
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

    // Handle "Not Interested" - permanently hide recommendation
    const handleDismiss = async (recommendation) => {
        if (dismissingIds.has(recommendation.externalId)) return;

        setDismissingIds(prev => new Set(prev).add(recommendation.externalId));

        try {
            // Add to dismissed list (never show again)
            const dismissed = getDismissedIds();
            dismissed.push(recommendation.externalId);
            saveDismissedIds(dismissed);

            // Fetch replacement before removing
            const currentIds = recommendations.map(r => r.externalId);
            const replacement = await fetchSingleReplacement([...currentIds, recommendation.externalId]);

            // Replace dismissed item with new one
            setRecommendations(prev => {
                const updated = prev.filter(r => r.externalId !== recommendation.externalId);
                if (replacement) {
                    updated.push(replacement);
                }
                saveRecommendations(updated, tier, page);
                return updated;
            });

            showToast('Removed from recommendations', 'info');
        } finally {
            setDismissingIds(prev => {
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

    // Helper to detect if something is likely a manhwa based on title/keywords
    // Many Korean webtoons are classified as "manga" by MAL/Jikan
    const isManhwa = (item) => {
        if (item.type === 'manhwa') return true;
        if (item.reason?.toLowerCase().includes('manhwa')) return true;

        // Common Korean webtoon keywords in titles
        const manhwaKeywords = [
            'omniscient reader', 'solo leveling', 'tower of god', 'noblesse',
            'god of high school', 'lookism', 'true beauty', 'sweet home',
            'the beginning after the end', 'eleceed', 'nano machine',
            'unordinary', 'remarried empress', 'the world after the fall',
            'return of the mount hua sect', 'sss-class suicide hunter',
            'villain to kill', 'overgeared', 'tomb raider king'
        ];

        const titleLower = item.title?.toLowerCase() || '';
        return manhwaKeywords.some(keyword => titleLower.includes(keyword));
    };

    // Group recommendations by type
    const animeRecs = recommendations.filter(r => r.type === 'anime');
    const mangaRecs = recommendations.filter(r => r.type === 'manga' && !isManhwa(r));
    const manhwaRecs = recommendations.filter(r => r.type === 'manhwa' || isManhwa(r));

    // Render a single recommendation card
    const renderCard = (item) => (
        <div
            key={item.externalId}
            className="flex-shrink-0 w-36 md:w-44 group relative rounded-lg overflow-hidden bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 hover:border-blade-orange/50 transition-all duration-200 snap-start hover:scale-[1.02] hover:shadow-lg hover:-translate-y-0.5"
        >


            {/* Thumbnail */}
            <div className="aspect-[2/3] bg-gray-200 dark:bg-zinc-800 overflow-hidden relative">
                {item.thumbnailUrl ? (
                    <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        <svg className="w-12 h-12 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>
                )}

                {/* Hover overlay with Add button */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col justify-end p-3">
                    <button
                        onClick={() => handleAddToLibrary(item)}
                        disabled={addingIds.has(item.externalId) || addedIds.has(item.externalId)}
                        className={`w-full py-2 text-white text-xs font-bold uppercase tracking-wider transition-colors disabled:opacity-50 rounded shadow-md transform ${addedIds.has(item.externalId)
                                ? 'bg-green-600 hover:bg-green-600 cursor-default'
                                : 'bg-blade-orange hover:bg-blade-orange/90 active:scale-95'
                            }`}
                    >
                        {addingIds.has(item.externalId) ? '...' : addedIds.has(item.externalId) ? 'Added' : '+ Add'}
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="p-2">
                <h3 className="font-semibold text-xs text-foreground mb-0.5 line-clamp-2 leading-tight group-hover:text-blade-orange transition-colors">
                    {item.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                    <span className="inline-block text-[9px] text-blade-orange font-medium">
                        {item.reason}
                    </span>

                    {/* Metadata Badges */}
                    <div className="flex items-center gap-1.5 opacity-80">
                        {/* Type/Count Badge or Status Fallback */}
                        {(item.episodes || item.totalEpisodes) ? (
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap bg-gray-100 dark:bg-zinc-800 px-1 rounded">
                                {item.episodes || item.totalEpisodes} eps
                            </span>
                        ) : (item.status?.toLowerCase().includes('airing')) && (
                            <span className="text-[9px] text-blue-500/80 font-medium whitespace-nowrap bg-blue-500/10 px-1 rounded">
                                Airing
                            </span>
                        )}

                        {(item.chapters || item.totalChapters) ? (
                            <span className="text-[9px] text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap bg-gray-100 dark:bg-zinc-800 px-1 rounded">
                                {item.chapters || item.totalChapters} ch
                            </span>
                        ) : (item.status?.toLowerCase().includes('publishing') || item.status?.toLowerCase().includes('releasing')) && (
                            <span className="text-[9px] text-blue-500/80 font-medium whitespace-nowrap bg-blue-500/10 px-1 rounded">
                                Publishing
                            </span>
                        )}

                        {/* Finished Status Badge */}
                        {(item.status?.toLowerCase().includes('finished')) && (
                            <span className="text-[9px] text-white font-medium whitespace-nowrap bg-green-500/80 px-1 rounded">
                                Finished
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    // Contextual subtitles mapping
    const getSubtitle = (type) => {
        switch (type) {
            case 'anime': return 'Top airing & trending this season';
            case 'manga': return 'Most popular publishing titles';
            case 'manhwa': return 'Trending webtoons & comics';
            default: return 'Trending now';
        }
    };

    // Render a type row with enhanced scroll UX
    const renderTypeRow = (title, items, typeKey) => {
        if (items.length === 0) return null;

        return (
            <div className="mb-12">
                {/* Row header with contextual label */}
                <div className="flex flex-col mb-4 px-1">
                    <h3 className="text-xl font-bold text-foreground tracking-tight">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {getSubtitle(typeKey)}
                    </p>
                </div>

                {/* Scroll Wrapper for Gradients */}
                <div className="relative group/scroll -mx-6 px-6">
                    {/* Left Gradient Fade */}
                    <div className="absolute left-0 top-0 bottom-4 w-12 bg-gradient-to-r from-gray-50 dark:from-[#151517] to-transparent z-10 pointer-events-none opacity-0 group-hover/scroll:opacity-100 transition-opacity duration-300" />

                    {/* Horizontal scroll container */}
                    <div className="flex gap-4 overflow-x-auto pb-8 pt-2 -mt-2 scroll-smooth snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
                        {items.map(renderCard)}

                        {/* Right padding spacer for snapping */}
                        <div className="w-2 flex-shrink-0" />
                    </div>

                    {/* Right Gradient Fade */}
                    <div className="absolute right-0 top-0 bottom-4 w-24 bg-gradient-to-l from-gray-50 dark:from-[#151517] to-transparent z-10 pointer-events-none" />
                </div>
            </div>
        );
    };

    return (
        <section className="py-12 px-6 bg-gray-50/50 dark:bg-zinc-900/30">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-blade-orange" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <div>
                            <h2 className="Heading-lg text-2xl text-foreground">
                                {tier === 'new_user' ? 'Trending Now' : 'Recommended for You'}
                            </h2>
                            {message && tier !== 'established' && (
                                <p className="text-sm text-gray-500 mt-0.5">{message}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Type-based rows */}
                {renderTypeRow('Anime', animeRecs, 'anime')}
                {renderTypeRow('Manga', mangaRecs, 'manga')}
                {renderTypeRow('Manhwa', manhwaRecs, 'manhwa')}

                {/* Fallback if no grouped recommendations */}
                {animeRecs.length === 0 && mangaRecs.length === 0 && manhwaRecs.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No recommendations available right now.</p>
                    </div>
                )}
            </div>
        </section>
    );
}
