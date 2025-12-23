"use client";

import { useState } from "react";
import { useSeries } from "@/lib/store";

export default function SeriesForm() {
    const { addSeries } = useSeries();
    const [formData, setFormData] = useState({
        title: "",
        type: "manga",
        status: "reading",
        lastProgress: "",
        notes: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formData.title) return;

        addSeries(formData);
        setFormData({
            title: "",
            type: "manga",
            status: "reading",
            lastProgress: "",
            notes: "",
        });
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                {/* Title Input */}
                <div className="md:col-span-2 input-group">
                    <input
                        type="text"
                        required
                        className="input-field"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        placeholder=" "
                        id="title"
                    />
                    <label htmlFor="title" className="input-label">Title</label>
                    <div className="input-underline" />
                </div>

                {/* Type Select */}
                <div>
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">Type</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 bg-transparent border-b-2 border-black/10 light:border-gray-200 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150 appearance-none cursor-pointer"
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        >
                            <option value="manga" className="bg-background">Manga</option>
                            <option value="manhwa" className="bg-background">Manhwa</option>
                            <option value="anime" className="bg-background">Anime</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>
                </div>

                {/* Status Select */}
                <div>
                    <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">Status</label>
                    <div className="relative">
                        <select
                            className="w-full p-3 bg-transparent border-b-2 border-black/10 light:border-gray-200 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150 appearance-none cursor-pointer"
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        >
                            <option value="reading" className="bg-background">Reading</option>
                            <option value="completed" className="bg-background">Completed</option>
                            <option value="on-hold" className="bg-background">On Hold</option>
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
                        onChange={(e) => setFormData({ ...formData, lastProgress: e.target.value })}
                        placeholder=" "
                        id="progress"
                    />
                    <label htmlFor="progress" className="input-label">Last Chapter/Episode</label>
                    <div className="input-underline" />
                </div>

                {/* Notes Textarea */}
                <div className="md:col-span-2 input-group">
                    <textarea
                        className="input-field resize-none"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
        </form>
    );
}
