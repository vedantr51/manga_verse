"use client";

import { useState, useEffect, useRef } from "react";

export default function TitleAutocomplete({ type = "anime", onSelect, initialValue = "" }) {
    const [query, setQuery] = useState(initialValue);
    const [suggestions, setSuggestions] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const wrapperRef = useRef(null);
    const inputRef = useRef(null);

    // Sync query with initialValue (for form resets)
    useEffect(() => {
        setQuery(initialValue);
    }, [initialValue]);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }

            // Don't search if we just selected an item
            if (!isOpen && query === initialValue) return;

            setIsLoading(true);
            try {
                const res = await fetch(`/api/title-search?q=${encodeURIComponent(query)}&type=${type}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.results || []);
                    setIsOpen(true);
                    // Default to first option for smoother UX
                    setSelectedIndex(0);
                }
            } catch (error) {
                console.error("Search failed:", error);
                setSuggestions([]); // Clear suggestions so manual entry is the only clear option
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query, type]); // removed isOpen/initialValue deps as they caused focus issues

    // Handle outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleKeyDown = (e) => {
        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (isOpen && selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSelect(suggestions[selectedIndex]);
            } else if (isOpen && query.length > 0) {
                // If open but no valid suggestion selected (or list empty), allow manual?
                // For standardization, we prefer they click the manual option explicitly if no suggestion matches.
                // But good UX might be: if no suggestions at all, Manual Entry is unique option.
                // If suggestions exist, we want them to pick one.
                setIsOpen(false);
            }
        } else if (e.key === "Escape") {
            setIsOpen(false);
        }
    };

    const handleSelect = (item) => {
        setQuery(item.title);
        onSelect({
            title: item.title,
            externalId: item.externalId,
            thumbnailUrl: item.thumbnailUrl,
            alternateTitles: item.alternateTitles,
            type: item.type
        });
        setIsOpen(false);
    };

    const handleManualEntry = () => {
        // Allow using raw text
        onSelect({
            title: query,
            externalId: null,
            thumbnailUrl: null,
            alternateTitles: [],
            type: type
        });
        setIsOpen(false);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="input-group">
                <input
                    ref={inputRef}
                    type="text"
                    required
                    className="input-field"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => query.length >= 3 && setIsOpen(true)}
                    onKeyDown={handleKeyDown}
                    placeholder=" "
                    id="title-search"
                    autoComplete="off"
                />
                <label htmlFor="title-search" className="input-label">Title (Search {type})</label>
                <div className="input-underline" />

                {isLoading && (
                    <div className="absolute right-2 top-3">
                        <div className="animate-spin h-5 w-5 border-2 border-blade-green rounded-full border-t-transparent"></div>
                    </div>
                )}
            </div>

            {isOpen && (suggestions.length > 0 || query.length >= 3) && (
                <div className="absolute z-50 w-full mt-1 bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-md shadow-xl max-h-80 overflow-y-auto">
                    {suggestions.map((item, index) => (
                        <div
                            key={item.externalId}
                            onClick={() => handleSelect(item)}
                            className={`p-3 flex gap-3 cursor-pointer transition-colors border-b border-gray-100 dark:border-zinc-800 last:border-0
                                ${index === selectedIndex ? 'bg-blade-green/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                        >
                            {/* Thumbnail */}
                            <div className="w-10 h-14 flex-shrink-0 bg-gray-200 rounded overflow-hidden">
                                {item.thumbnailUrl ? (
                                    <img src={item.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">N/A</div>
                                )}
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-foreground truncate">{item.title}</h4>
                                {item.alternateTitles?.[0] && (
                                    <p className="text-xs text-gray-500 truncate">{item.alternateTitles[0]}</p>
                                )}
                                <div className="flex gap-2 mt-1">
                                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 bg-gray-100 dark:bg-zinc-800 text-gray-600 rounded">
                                        {item.type}
                                    </span>
                                    {item.year && (
                                        <span className="text-[10px] text-gray-400 py-0.5">{item.year}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Manual Entry Fallback - Explicit "Create New" style */}
                    {!isLoading && query.length > 0 && (
                        <div
                            onClick={handleManualEntry}
                            className={`p-3 border-t border-gray-200 dark:border-zinc-700 cursor-pointer group
                                ${selectedIndex === suggestions.length ? 'bg-blade-green/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 flex items-center justify-center bg-gray-100 dark:bg-zinc-800 rounded text-gray-400 group-hover:text-blade-green transition-colors">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-foreground">Create "<span className="italic">{query}</span>"</p>
                                    <p className="text-xs text-gray-500">Not in database? Add as custom entry.</p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
