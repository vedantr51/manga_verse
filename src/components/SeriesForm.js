"use client";

import { useState } from "react";
import { useSeries } from "@/lib/store";

import TitleAutocomplete from "./TitleAutocomplete";
import StarRating from "./StarRating";

export default function SeriesForm() {
    const { addSeries, showToast } = useSeries();
    const [formData, setFormData] = useState({
        title: "",
        type: "manga",
        status: "reading",
        lastProgress: "",
        notes: "",
        externalId: null,
        thumbnailUrl: null,
        alternateTitles: [],
        rating: 0,
    });

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.title) return;

        try {
            console.log("Form data before addSeries:", formData);
            await addSeries(formData);
            showToast(`${formData.title} added to your library!`, "success");
            setFormData({
                title: "",
                type: "manga",
                status: "reading",
                lastProgress: "",
                notes: "",
                externalId: null,
                thumbnailUrl: null,
                alternateTitles: [],
                rating: 0,
            });
        } catch (error) {
            // Check if it's a duplicate error (409)
            if (error.message?.includes("409")) {
                showToast(`${formData.title} is already in your library`, "warning");
            } else {
                showToast("Failed to add series. Please try again.", "error");
            }
        }
    };

    return (
        <form onSubmit={handleSubmit} className="panel-form p-8 mb-12 relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blade-green to-blade-orange opacity-60" />

            <h2 className="Heading-lg text-2xl mb-6 text-foreground flex items-center gap-3">
                <svg className="w-6 h-6 text-blade-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Progress Log Panel
            </h2>

            {/* Type Select - FIRST FIELD */}
            <div className="mb-8">
                <label className="block text-sm font-bold mb-3 text-foreground uppercase tracking-wider">
                    What are you tracking?
                </label>
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { value: "manga", label: "Manga", icon: "📖" },
                        { value: "manhwa", label: "Manhwa", icon: "📚" },
                        { value: "anime", label: "Anime", icon: "📺" }
                    ].map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                setFormData((prev) => ({
                                    ...prev,
                                    type: option.value,
                                    status: option.value === "anime" ? "watching" : "reading"
                                }));
                            }}
                            className={`
                                p-4 rounded-lg border-2 transition-all duration-200
                                ${formData.type === option.value
                                    ? 'border-blade-green bg-blade-green/10 scale-105'
                                    : 'border-gray-300 hover:border-blade-green/50 hover:bg-gray-50'
                                }
                            `}
                        >
                            <div className="text-3xl mb-2">{option.icon}</div>
                            <div className="font-bold text-sm uppercase tracking-wide">{option.label}</div>
                        </button>
                    ))}
                </div>
            </div>

            {/* Show rest of form only after type is selected */}
            {formData.type && (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        {/* Title Input - Autocomplete */}
                        <div className="md:col-span-2">
                            <TitleAutocomplete
                                type={formData.type}
                                initialValue={formData.title}
                                onSelect={(item) => {
                                    const newType = item.type || formData.type;
                                    setFormData((prev) => ({
                                        ...prev,
                                        title: item.title,
                                        externalId: item.externalId,
                                        thumbnailUrl: item.thumbnailUrl,
                                        alternateTitles: item.alternateTitles,
                                        type: newType,
                                        status: newType === "anime" ? "watching" : "reading",
                                    }));
                                }}
                            />
                        </div>

                        {/* Status Select */}
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">Status</label>
                            <div className="relative">
                                <select
                                    className="w-full p-3 bg-transparent border-b-2 border-black/10 light:border-gray-200 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150 appearance-none cursor-pointer"
                                    value={formData.status}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, status: e.target.value }))}
                                >
                                    {formData.type === "anime" ? (
                                        <>
                                            <option value="watching" className="bg-background">Watching</option>
                                            <option value="completed" className="bg-background">Completed</option>
                                            <option value="on-hold" className="bg-background">On Hold</option>
                                        </>
                                    ) : (
                                        <>
                                            <option value="reading" className="bg-background">Reading</option>
                                            <option value="completed" className="bg-background">Completed</option>
                                            <option value="on-hold" className="bg-background">On Hold</option>
                                        </>
                                    )}
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

                        {/* Last Progress Input */}
                        <div className="input-group">
                            <input
                                type="text"
                                className="input-field"
                                value={formData.lastProgress}
                                onChange={(e) => setFormData((prev) => ({ ...prev, lastProgress: e.target.value }))}
                                placeholder=" "
                                id="progress"
                            />
                            <label htmlFor="progress" className="input-label">Last Chapter/Episode</label>
                            <div className="input-underline" />
                        </div>

                        {/* Rating Input */}
                        <div>
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">Your Rating</label>
                            <div className="pt-2">
                                <StarRating
                                    value={formData.rating}
                                    onChange={(val) => {
                                        console.log("StarRating onChange called with:", val);
                                        setFormData((prev) => {
                                            console.log("Previous state rating:", prev.rating);
                                            return { ...prev, rating: val };
                                        });
                                    }}
                                    size="lg"
                                />
                            </div>
                        </div>

                        {/* Notes Textarea */}
                        <div className="md:col-span-2 input-group">
                            <textarea
                                className="input-field resize-none"
                                value={formData.notes}
                                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                                placeholder=" "
                                rows={2}
                                id="notes"
                            />
                            <label htmlFor="notes" className="input-label">Notes (Optional)</label>
                            <div className="input-underline" />
                        </div>
                    </div>

                    {/* Submit Button - Lock Progress */}
                    <button
                        type="submit"
                        className="w-full blade-button text-base tracking-wider flex items-center justify-center gap-2"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                        Lock Progress
                    </button>
                </>
            )}
        </form>
    );
}
