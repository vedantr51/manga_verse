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

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.length < 3) {
                setSuggestions([]);
                return;
            }

            // Don't search if we just selected an item (heuristic: precise match with existing suggestion code path handles this usually, but here we just check if open)
            if (!isOpen && query === initialValue) return;

            setIsLoading(true);
            try {
                const res = await fetch(`/api/title-search?q=${encodeURIComponent(query)}&type=${type}`);
                if (res.ok) {
                    const data = await res.json();
                    setSuggestions(data.results || []);
                    setIsOpen(true);
                    setSelectedIndex(-1);
                }
            } catch (error) {
                console.error("Search failed:", error);
            } finally {
                setIsLoading(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [query, type, isOpen]); // removed initialValue from dep to prevent loop, logic inside handles it

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
            if (selectedIndex >= 0 && suggestions[selectedIndex]) {
                handleSelect(suggestions[selectedIndex]);
            } else {
                // If no suggestion selected, but user pressed enter, maybe treat as manual entry if we allowed it
                // For now, we just close if no selection
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

                    {/* Manual Entry Fallback */}
                    {!isLoading && query.length > 0 && (
                        <div
                            onClick={handleManualEntry}
                            className={`p-3 border-t border-gray-200 dark:border-zinc-700 cursor-pointer 
                                ${selectedIndex === suggestions.length ? 'bg-blade-green/10' : 'hover:bg-gray-50 dark:hover:bg-zinc-800'}`}
                        >
                            <p className="text-sm text-gray-500 italic">
                                Use "<span className="font-bold not-italic text-foreground">{query}</span>" (no canonical match)
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
