"use client";

import { useState } from "react";

export default function StarRating({ value = 0, onChange, readOnly = false, size = "md" }) {
    const [hoverValue, setHoverValue] = useState(0);

    const stars = [1, 2, 3, 4, 5];
    const sizeClasses = size === "sm" ? "w-4 h-4" : "w-6 h-6";

    // Handle click for halves? 
    // For simplicity V1: Just full stars or maybe pure 1-5 step 0.5 with input range
    // Let's do clickable stars (full for now, or half logic if demanding)
    // PRD says supports halves.
    // Complexity for custom half-star click is high for vanilla.
    // Let's use a standard trick: 10 hidden radio buttons or pure calculation.

    // Simple Approach: Render 5 stars. Click left/right half.

    function handleMouseMove(e, starIndex) {
        if (readOnly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        setHoverValue(starIndex - (isHalf ? 0.5 : 0));
    }

    function handleClick(e, starIndex) {
        if (readOnly) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const isHalf = x < rect.width / 2;
        onChange(starIndex - (isHalf ? 0.5 : 0));
    }

    return (
        <div className="flex items-center gap-1" onMouseLeave={() => setHoverValue(0)}>
            {stars.map((star) => (
                <div
                    key={star}
                    className={`relative cursor-pointer ${sizeClasses}`}
                    onMouseMove={(e) => handleMouseMove(e, star)}
                    onClick={(e) => handleClick(e, star)}
                >
                    {/* Background Star (Gray) */}
                    <svg className={`absolute inset-0 text-gray-300 dark:text-gray-700 w-full h-full`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>

                    {/* Foreground Star (Color) - Masked for half/full */}
                    <div
                        className={`absolute inset-0 overflow-hidden text-yellow-400`}
                        style={{
                            width: ((hoverValue || value) >= star) ? "100%" :
                                ((hoverValue || value) >= star - 0.5) ? "50%" : "0%"
                        }}
                    >
                        <svg className="w-full h-full" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                        </svg>
                    </div>
                </div>
            ))}
            {!readOnly && (
                <span className="ml-2 text-sm font-medium text-gray-500 w-8">
                    {(hoverValue || value).toFixed(1)}
                </span>
            )}
        </div>
    );
}
