"use client";

/**
 * Reusable skeleton card for loading states
 * Supports horizontal (continue watching) and vertical (library/recommendations) layouts
 */
export default function SkeletonCard({ variant = "vertical" }) {
    if (variant === "horizontal") {
        return (
            <div className="w-64 flex-shrink-0 bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="w-full h-80 skeleton" />
                <div className="p-4 space-y-3">
                    <div className="h-5 skeleton rounded w-3/4" />
                    <div className="h-4 skeleton rounded w-1/2" />
                    <div className="h-10 skeleton rounded" />
                </div>
            </div>
        );
    }

    // Grid variant for recommendations
    if (variant === "grid") {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
                <div className="w-full h-64 skeleton" />
                <div className="p-4 space-y-3">
                    <div className="h-4 skeleton rounded w-full" />
                    <div className="h-5 skeleton rounded w-3/4" />
                    <div className="flex gap-1">
                        <div className="h-5 skeleton rounded w-16" />
                        <div className="h-5 skeleton rounded w-16" />
                    </div>
                    <div className="h-10 skeleton rounded" />
                </div>
            </div>
        );
    }

    // Default vertical card
    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg border border-gray-200 dark:border-zinc-800 overflow-hidden">
            <div className="flex gap-4 p-4">
                <div className="w-16 h-24 skeleton rounded flex-shrink-0" />
                <div className="flex-grow space-y-2">
                    <div className="h-5 skeleton rounded w-3/4" />
                    <div className="flex gap-2">
                        <div className="h-5 skeleton rounded w-16" />
                        <div className="h-5 skeleton rounded w-16" />
                    </div>
                    <div className="h-4 skeleton rounded w-1/2" />
                </div>
            </div>
        </div>
    );
}

/**
 * Multiple skeleton cards for list loading states
 */
export function SkeletonList({ count = 3, variant = "vertical" }) {
    return (
        <>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonCard key={i} variant={variant} />
            ))}
        </>
    );
}
