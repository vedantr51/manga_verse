"use client";

import { useEffect } from "react";

export default function Toast({ message, type = "success", onDismiss, duration = 3000 }) {
    useEffect(() => {
        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                onDismiss();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onDismiss]);

    const icons = {
        success: "✓",
        error: "✕",
        warning: "⚠",
    };

    const styles = {
        success: "bg-green-500/90 text-white border-green-600",
        error: "bg-red-500/90 text-white border-red-600",
        warning: "bg-orange-500/90 text-white border-orange-600",
    };

    return (
        <div
            className={`
                flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4
                ${styles[type]}
                animate-slide-in backdrop-blur-sm
                min-w-[300px] max-w-[500px]
            `}
        >
            <span className="text-xl font-bold">{icons[type]}</span>
            <p className="flex-1 font-medium">{message}</p>
            <button
                onClick={onDismiss}
                className="text-white/80 hover:text-white transition-colors ml-2"
                aria-label="Dismiss"
            >
                ✕
            </button>
        </div>
    );
}
