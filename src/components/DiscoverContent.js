"use client";

import { useState } from 'react';
import { MOCK_SERIES, MOODS, GENRES } from '@/lib/mockData';
import RecommendedForYou from './RecommendedForYou';

export default function DiscoverContent() {
    const [selectedMood, setSelectedMood] = useState(null);
    const [selectedGenres, setSelectedGenres] = useState([]);
    const [statusFilter, setStatusFilter] = useState('all');
    const [recommendations, setRecommendations] = useState([]);
    const [hasSearched, setHasSearched] = useState(false);

    const toggleGenre = (genre) => {
        setSelectedGenres(prev =>
            prev.includes(genre)
                ? prev.filter(g => g !== genre)
                : [...prev, genre]
        );
    };

    const findRecommendations = () => {
        setHasSearched(true);
        let results = MOCK_SERIES;

        if (selectedMood) {
            results = results.filter(series => series.moods.includes(selectedMood));
        }

        if (selectedGenres.length > 0) {
            results = results.filter(series =>
                series.genres.some(g => selectedGenres.includes(g))
            );
        }

        if (statusFilter !== 'all') {
            results = results.filter(series => series.status === statusFilter);
        }

        setRecommendations(results);
    };

    return (
        <>
            {/* Personalized Recommendations */}
            <RecommendedForYou />

            <div className="max-w-4xl mx-auto px-6 py-8">
                <h1 className="Heading-lg text-3xl mb-8 text-foreground">Discover Your Next Obsession</h1>

                {/* Filters Section */}
                <div className="panel-form p-8 mb-12 relative overflow-hidden">
                    {/* Mood Selector with Glow Chips */}
                    <div className="mb-8 relative z-10">
                        <label className="block text-sm font-bold mb-4 uppercase tracking-wide text-gray-500 light:text-gray-500">Pick a Mood</label>
                        <div className="flex flex-wrap gap-3">
                            {MOODS.map((mood) => (
                                <button
                                    key={mood.id}
                                    onClick={() => setSelectedMood(selectedMood === mood.id ? null : mood.id)}
                                    className={`mood-chip ${selectedMood === mood.id ? 'active' : ''}`}
                                >
                                    <span className="text-lg">{mood.emoji}</span>
                                    <span className="font-medium text-sm">{mood.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Genre Selector with Angled Tags */}
                    <div className="mb-8 relative z-10">
                        <label className="block text-sm font-bold mb-4 uppercase tracking-wide text-gray-500 light:text-gray-500">Select Genres</label>
                        <div className="flex flex-wrap gap-2">
                            {GENRES.map((genre) => (
                                <button
                                    key={genre}
                                    onClick={() => toggleGenre(genre)}
                                    className={`genre-tag ${selectedGenres.includes(genre) ? 'active' : ''}`}
                                >
                                    {genre}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Status Toggle */}
                    <div className="mb-8 relative z-10">
                        <label className="block text-sm font-bold mb-4 uppercase tracking-wide text-gray-500 light:text-gray-500">Status</label>
                        <div className="inline-flex rounded border border-black/10 light:border-gray-200 bg-black/20 light:bg-gray-100 p-1">
                            {['all', 'completed', 'ongoing'].map((status) => (
                                <button
                                    key={status}
                                    onClick={() => setStatusFilter(status)}
                                    className={`px-5 py-2 text-sm capitalize transition-all duration-150
                                    ${statusFilter === status
                                            ? 'bg-blade-green text-black font-bold shadow-sm'
                                            : 'text-gray-500 hover:text-foreground'
                                        }`}
                                    style={{ clipPath: 'polygon(4px 0, 100% 0, calc(100% - 4px) 100%, 0 100%)' }}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* CTA - Find Your Next Arc */}
                    <button
                        onClick={findRecommendations}
                        className="w-full cta-gradient text-lg"
                    >
                        Find Your Next Arc
                    </button>
                </div>

                {/* Results Section */}
                {hasSearched && (
                    <div className="animate-fade-in space-y-6">
                        <h2 className="Heading-lg text-2xl text-foreground">Recommended Series ({recommendations.length})</h2>

                        {recommendations.length === 0 ? (
                            <div className="text-center py-16 section-card border-dashed">
                                <p className="text-gray-500 text-lg">No matches found in this timeline.</p>
                                <p className="text-gray-400 text-sm mt-2">Try relaxing your filters to widen the search.</p>
                            </div>
                        ) : (
                            <div className="grid gap-5">
                                {recommendations.map((series) => (
                                    <div
                                        key={series.id}
                                        className="rec-card group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <h3 className="font-bold text-xl text-foreground group-hover:text-blade-green transition-colors duration-150">{series.title}</h3>
                                            <span className="text-xs font-bold px-3 py-1 bg-black/5 light:bg-gray-100 border border-black/10 light:border-gray-200 uppercase text-gray-500 tracking-wider">
                                                {series.type}
                                            </span>
                                        </div>

                                        <div className="flex flex-wrap gap-2 mb-4">
                                            {series.moods.map(mood => (
                                                <span key={mood} className="text-xs text-blade-green font-semibold px-2 py-1 bg-blade-green/10 rounded">#{mood}</span>
                                            ))}
                                            <span className="text-gray-400">|</span>
                                            {series.genres.slice(0, 3).map(genre => (
                                                <span key={genre} className="text-xs text-gray-500 capitalize px-2 py-1 border border-black/5 light:border-gray-200 rounded">{genre}</span>
                                            ))}
                                        </div>

                                        <p className="text-gray-600 light:text-gray-600 text-sm mb-4 leading-relaxed">
                                            {series.description}
                                        </p>

                                        {/* Why Section - Highlighted */}
                                        <div className="rec-why">
                                            <span className="font-bold text-blade-green mr-2">Why:</span>
                                            <span className="text-gray-600 light:text-gray-700">{series.reason}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}
