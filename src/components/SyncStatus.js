"use client";

import { useSession } from "next-auth/react";
import { useSeries } from "@/lib/store";

/**
 * SyncStatus - Shows current sync state
 * ☁️ Synced | 🔄 Syncing | 💾 Local | ⚠️ Error
 */
export default function SyncStatus() {
    const { status } = useSession();
    const { isSyncing, isLoaded, syncError } = useSeries();

    if (status === "loading" || !isLoaded) {
        return (
            <span className="text-xs text-gray-400 flex items-center gap-1">
                <span className="animate-pulse">●</span>
                Loading...
            </span>
        );
    }

    if (syncError) {
        return (
            <span className="text-xs text-red-400 flex items-center gap-1" title={syncError}>
                <span>⚠️</span>
                Sync error
            </span>
        );
    }

    if (isSyncing) {
        return (
            <span className="text-xs text-blade-orange flex items-center gap-1">
                <span className="animate-spin">🔄</span>
                Syncing...
            </span>
        );
    }

    if (status === "authenticated") {
        return (
            <span className="text-xs text-blade-green flex items-center gap-1">
                <span>☁️</span>
                Synced
            </span>
        );
    }

    return (
        <span className="text-xs text-gray-500 flex items-center gap-1">
            <span>💾</span>
            Local only
        </span>
    );
}
