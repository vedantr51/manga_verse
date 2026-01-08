"use client";

import { useState } from "react";

export const ARC_RATINGS = [
    { value: 1, label: "Filler Arc 😴", color: "bg-gray-400", text: "text-gray-500" },
    { value: 2, label: "Weak Arc", color: "bg-orange-300", text: "text-orange-400" },
    { value: 3, label: "Decent Arc", color: "bg-blue-400", text: "text-blue-500" },
    { value: 4, label: "Peak Arc 🔥", color: "bg-red-500", text: "text-red-500" },
    { value: 5, label: "Legendary Arc 👑", color: "bg-purple-500", text: "text-purple-600" },
];

export default function ArcRating({ value = 0, onChange, readOnly = false, size = "md" }) {
    const [hoverValue, setHoverValue] = useState(0);

    const displayValue = hoverValue || value;
    const currentRating = ARC_RATINGS.find(r => Math.ceil(displayValue) === r.value) || { label: "Unrated", color: "bg-gray-200" };

    function handleInteraction(val) {
        if (!readOnly && onChange) {
            onChange(val);
        }
    }

    return (
        <div className="flex flex-col gap-2">
            {/* Label Display */}
            {!readOnly && (
                <div className="flex justify-between items-end h-6">
                    <span className={`text-sm font-bold transition-all duration-200 ${displayValue > 0 ? "text-foreground" : "text-gray-400"}`}>
                        {displayValue > 0 ? currentRating.label : "Rate this arc"}
                    </span>
                    <span className="text-xs font-mono text-gray-400">{displayValue > 0 ? displayValue.toFixed(1) : "-.-"}</span>
                </div>
            )}

            {/* Interactive Bar */}
            <div className="flex gap-1" onMouseLeave={() => setHoverValue(0)}>
                {ARC_RATINGS.map((rating) => {
                    const isActive = displayValue >= rating.value;
                    const isHovered = hoverValue >= rating.value;

                    return (
                        <button
                            key={rating.value}
                            type="button"
                            onClick={() => handleInteraction(rating.value)}
                            onMouseEnter={() => !readOnly && setHoverValue(rating.value)}
                            disabled={readOnly}
                            className={`
                                relative flex-1 h-2 rounded-full transition-all duration-200
                                ${readOnly ? "cursor-default" : "cursor-pointer hover:h-3"}
                                ${isActive ? (rating.value === 5 ? "bg-gradient-to-r from-purple-500 to-pink-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]" : rating.color) : "bg-gray-200 dark:bg-zinc-800"}
                            `}
                        />
                    );
                })}
            </div>

            {/* ReadOnly Compact Label */}
            {readOnly && value > 0 && (
                <div className="flex items-center gap-2 mt-1">
                    <span className={`w-2 h-2 rounded-full ${currentRating.color}`}></span>
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{currentRating.label}</span>
                </div>
            )}
        </div>
    );
}
