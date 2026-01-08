"use client";

import { useState, useMemo } from "react";
import { useSeries } from "@/lib/store";
import StarRating from "./StarRating";

export default function SeriesList() {
    const { series, deleteSeries, updateSeries, showToast, isLoaded } = useSeries();
    const [editingItem, setEditingItem] = useState(null);
    const [deletingItem, setDeletingItem] = useState(null);
    const [editValue, setEditValue] = useState("");
    const [editRating, setEditRating] = useState(0);
    const [searchQuery, setSearchQuery] = useState("");

    // Sorting and filtering state
    const [sortBy, setSortBy] = useState("recent"); // recent, rating, alphabetical
    const [filterStatus, setFilterStatus] = useState("all"); // all, reading, watching, completed, on-hold
    const [filterType, setFilterType] = useState("all"); // all, manga, manhwa, anime

    const openEditModal = (item) => {
        setEditingItem(item);
        setEditValue(item.lastProgress || "");
        setEditRating(item.rating || 0);
    };

    const closeEditModal = () => {
        setEditingItem(null);
        setEditValue("");
        setEditRating(0);
    };

    const handleSave = () => {
        if (editingItem) {
            updateSeries(editingItem.id, {
                lastProgress: editValue,
                rating: editRating
            });
            closeEditModal();
        }
    };

    const handleMarkUpToDate = () => {
        if (editingItem) {
            const newStatus = editingItem.type === "anime" ? "watching" : "reading";
            updateSeries(editingItem.id, { lastProgress: "Up to date", status: newStatus });
            closeEditModal();
        }
    };

    const handleMarkCompleted = () => {
        if (editingItem) {
            updateSeries(editingItem.id, { status: "completed" });
            closeEditModal();
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter") {
            handleSave();
        } else if (e.key === "Escape") {
            closeEditModal();
        }
    };

    // Delete confirmation handlers
    const openDeleteConfirm = (item) => {
        setDeletingItem(item);
    };

    const closeDeleteConfirm = () => {
        setDeletingItem(null);
    };

    const confirmDelete = () => {
        if (deletingItem) {
            deleteSeries(deletingItem.id);
            showToast?.(`${deletingItem.title} removed from library`, "success");
            closeDeleteConfirm();
        }
    };

    // Filter and sort series
    const processedSeries = useMemo(() => {
        let result = [...series];

        // Apply search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            result = result.filter((item) => {
                const matchesTitle = item.title.toLowerCase().includes(query);
                const matchesAlternate = item.alternateTitles?.some(
                    (alt) => alt.toLowerCase().includes(query)
                );
                return matchesTitle || matchesAlternate;
            });
        }

        // Apply status filter
        if (filterStatus !== "all") {
            result = result.filter((item) => item.status === filterStatus);
        }

        // Apply type filter
        if (filterType !== "all") {
            result = result.filter((item) => item.type === filterType);
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case "rating":
                    return (b.rating || 0) - (a.rating || 0);
                case "alphabetical":
                    return a.title.localeCompare(b.title);
                case "recent":
                default:
                    return new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
            }
        });

        return result;
    }, [series, searchQuery, filterStatus, filterType, sortBy]);

    // Show skeleton while loading
    if (!isLoaded) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div className="h-8 w-40 skeleton rounded" />
                    <div className="h-9 w-full max-w-xs skeleton rounded" />
                </div>
                <div className="flex gap-3 mb-4">
                    <div className="h-8 w-32 skeleton rounded" />
                    <div className="h-8 w-32 skeleton rounded" />
                    <div className="h-8 w-32 skeleton rounded" />
                </div>
                {/* Use reused SkeletonList component here, assuming we import it or define it */}
                {/* Since SkeletonList is exported from ./SkeletonCard, I need to import it. */}
                {/* Wait, I didn't verify if it's imported. I should check imports first or just add it. */}
                {/* It was NOT imported in the original file view. I must add the import too. */}
                <div className="space-y-4">
                    <div className="h-32 w-full skeleton rounded-lg" />
                    <div className="h-32 w-full skeleton rounded-lg" />
                    <div className="h-32 w-full skeleton rounded-lg" />
                </div>
            </div>
        );
    }

    if (series.length === 0) {
        return (
            <div className="text-center py-16 px-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-zinc-800 mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                <h3 className="Heading-lg text-lg text-foreground mb-2">No Series Added Yet</h3>
                <p className="text-gray-500 max-w-sm mx-auto">
                    Start tracking your manga and anime journey. Use the search bar above to add your first series!
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-4">
                {/* Header with search */}
                <div className="flex items-center justify-between gap-4 mb-4">
                    <h2 className="Heading-lg text-2xl text-foreground whitespace-nowrap">Your Library</h2>
                    <div className="relative max-w-xs w-full">
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search library..."
                            className="w-full pl-9 pr-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md text-sm focus:outline-none focus:border-blade-green"
                        />
                        <svg className="w-4 h-4 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                </div>

                {/* Sort and Filter Controls */}
                <div className="flex flex-wrap items-center gap-3 mb-4 text-sm">
                    {/* Sort */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Sort:</span>
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md text-sm focus:outline-none focus:border-blade-green cursor-pointer"
                        >
                            <option value="recent">Recent</option>
                            <option value="rating">Rating</option>
                            <option value="alphabetical">A-Z</option>
                        </select>
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Status:</span>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md text-sm focus:outline-none focus:border-blade-green cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="reading">Reading</option>
                            <option value="watching">Watching</option>
                            <option value="completed">Completed</option>
                            <option value="on-hold">On Hold</option>
                        </select>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-500 text-xs uppercase tracking-wider font-bold">Type:</span>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            className="px-3 py-1.5 bg-gray-50 dark:bg-zinc-800/50 border border-gray-200 dark:border-zinc-700 rounded-md text-sm focus:outline-none focus:border-blade-green cursor-pointer"
                        >
                            <option value="all">All</option>
                            <option value="manga">Manga</option>
                            <option value="manhwa">Manhwa</option>
                            <option value="anime">Anime</option>
                        </select>
                    </div>

                    {/* Results count */}
                    <span className="text-gray-400 text-xs ml-auto">
                        {processedSeries.length} of {series.length}
                    </span>
                </div>

                {/* No results after filter */}
                {processedSeries.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                        <p>No series match your filters</p>
                        <button
                            onClick={() => { setFilterStatus("all"); setFilterType("all"); setSearchQuery(""); }}
                            className="text-blade-green text-sm mt-2 hover:underline"
                        >
                            Clear filters
                        </button>
                    </div>
                )}

                {/* Series List */}
                <div className="max-h-[600px] overflow-y-auto pr-2 -mr-2 space-y-4 custom-scrollbar">
                    {processedSeries.map((item) => (
                        <div
                            key={item.id}
                            className="library-card group flex gap-4"
                        >
                            {/* Thumbnail */}
                            <div className="w-16 h-24 bg-gray-200 dark:bg-zinc-800 flex-shrink-0 rounded overflow-hidden">
                                {item.thumbnailUrl ? (
                                    <img src={item.thumbnailUrl} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                        <svg className="w-8 h-8 opacity-20" fill="currentColor" viewBox="0 0 24 24">
                                            <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                            </div>

                            <div className="flex-grow min-w-0">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h3 className="font-bold text-xl text-foreground group-hover:text-blade-green transition-colors duration-150 truncate max-w-full">{item.title}</h3>
                                    <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider
                                    ${item.type === 'anime'
                                            ? 'bg-purple-500/15 text-purple-600 light:text-purple-700 border border-purple-500/30'
                                            : item.type === 'manhwa'
                                                ? 'bg-blade-green/15 text-blade-green border border-blade-green/30'
                                                : 'bg-blade-orange/15 text-blade-orange border border-blade-orange/30'}`}
                                        style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                                    >
                                        {item.type}
                                    </span>
                                    <span className={`text-xs font-bold px-2.5 py-1 uppercase tracking-wider
                                    ${item.status === 'reading' || item.status === 'watching'
                                            ? 'bg-blue-500/15 text-blue-600 light:text-blue-700 border border-blue-500/30'
                                            : item.status === 'completed'
                                                ? 'bg-teal-500/15 text-teal-600 light:text-teal-700 border border-teal-500/30'
                                                : 'bg-gray-500/15 text-gray-500 border border-gray-500/30'}`}
                                        style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                                    >
                                        {item.status}
                                    </span>
                                </div>

                                <p className="text-sm text-gray-500 mb-2">
                                    Current: <span className="font-bold text-foreground text-lg ml-1">{item.lastProgress || "Not Started"}</span>
                                </p>

                                {item.notes && (
                                    <p className="text-sm text-gray-500 italic border-l-2 border-blade-green/50 pl-3 py-1 bg-blade-green/5 rounded-r w-fit pr-3 truncate">
                                        "{item.notes}"
                                    </p>
                                )}

                                {item.rating > 0 && (
                                    <div className="mt-2 flex items-center gap-1 bg-yellow-400/10 px-1.5 py-0.5 rounded text-yellow-600 dark:text-yellow-500 w-fit">
                                        <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                                        </svg>
                                        <span className="text-[10px] font-bold">{item.rating}</span>
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-col items-end gap-2 md:opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                                <button
                                    onClick={() => openEditModal(item)}
                                    className="text-xs px-4 py-2 border border-gray-300 light:border-gray-300 text-foreground hover:bg-blade-green/10 hover:border-blade-green transition-colors duration-150 w-24"
                                    style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                                >
                                    Update
                                </button>
                                <button
                                    onClick={() => openDeleteConfirm(item)}
                                    className="text-xs px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/30 hover:bg-red-500/20 transition-colors duration-150 w-24"
                                    style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Update Progress Modal */}
            {editingItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={closeEditModal}
                >
                    <div
                        className="update-modal relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blade-green to-blade-orange" />
                        <button
                            onClick={closeEditModal}
                            className="absolute top-3 right-3 text-gray-400 hover:text-foreground transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        <div className="mb-5 flex gap-4">
                            {editingItem.thumbnailUrl && (
                                <img src={editingItem.thumbnailUrl} alt="" className="w-12 h-16 object-cover rounded" />
                            )}
                            <div>
                                <h3 className="Heading-lg text-lg text-foreground line-clamp-2">{editingItem.title}</h3>
                                <p className="text-sm text-gray-500 mt-1">Updating progress...</p>
                            </div>
                        </div>

                        <div className="flex gap-2 mb-5">
                            <button
                                onClick={handleMarkUpToDate}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-blue-500/10 text-blue-600 light:text-blue-700 border border-blue-500/30 hover:bg-blue-500/20 transition-colors duration-150 text-xs font-bold uppercase tracking-wider"
                                style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                                Up to Date
                            </button>
                            <button
                                onClick={handleMarkCompleted}
                                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 bg-teal-500/10 text-teal-600 light:text-teal-700 border border-teal-500/30 hover:bg-teal-500/20 transition-colors duration-150 text-xs font-bold uppercase tracking-wider"
                                style={{ clipPath: 'polygon(6px 0, 100% 0, calc(100% - 6px) 100%, 0 100%)' }}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Completed
                            </button>
                        </div>

                        <div className="flex items-center gap-3 mb-5">
                            <div className="flex-1 h-px bg-gray-200 light:bg-gray-200" />
                            <span className="text-xs text-gray-400 uppercase tracking-wider">or set manually</span>
                            <div className="flex-1 h-px bg-gray-200 light:bg-gray-200" />
                        </div>

                        <div className="mb-5">
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                                Chapter / Episode
                            </label>
                            <input
                                type="text"
                                value={editValue}
                                onChange={(e) => setEditValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full p-3 bg-transparent border-b-2 border-gray-200 light:border-gray-300 text-foreground text-lg font-bold focus:outline-none focus:border-blade-green transition-colors duration-150"
                                placeholder="e.g. 1152"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                                Your Rating
                            </label>
                            <div className="pt-1">
                                <StarRating
                                    value={editRating}
                                    onChange={setEditRating}
                                    size="lg"
                                />
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={closeEditModal}
                                className="flex-1 py-2.5 border border-gray-300 light:border-gray-300 text-gray-500 hover:text-foreground hover:border-gray-400 transition-colors duration-150 text-sm font-semibold uppercase tracking-wider"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                className="flex-1 py-2.5 bg-blade-green text-black font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-blade-green/30 transition-all duration-150"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            >
                                Save
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deletingItem && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in"
                    onClick={closeDeleteConfirm}
                >
                    <div
                        className="update-modal relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />

                        <div className="mb-5 flex gap-4">
                            {deletingItem.thumbnailUrl && (
                                <img src={deletingItem.thumbnailUrl} alt="" className="w-12 h-16 object-cover rounded" />
                            )}
                            <div>
                                <h3 className="Heading-lg text-lg text-foreground line-clamp-2">{deletingItem.title}</h3>
                                <p className="text-sm text-red-500 mt-1 font-medium">Remove from library?</p>
                            </div>
                        </div>

                        <p className="text-gray-500 text-sm mb-6">
                            This will permanently remove <strong>{deletingItem.title}</strong> from your library. This action cannot be undone.
                        </p>

                        <div className="flex gap-3">
                            <button
                                onClick={closeDeleteConfirm}
                                className="flex-1 py-2.5 border border-gray-300 light:border-gray-300 text-gray-500 hover:text-foreground hover:border-gray-400 transition-colors duration-150 text-sm font-semibold uppercase tracking-wider"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDelete}
                                className="flex-1 py-2.5 bg-red-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-red-600 transition-all duration-150"
                                style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
