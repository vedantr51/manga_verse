"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import AuthModal from "./AuthModal";
import { useSeries } from "@/lib/store";

export default function AuthButton() {
    const { data: session, status } = useSession();
    const [showModal, setShowModal] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const { isSyncing, syncError, lastSyncedAt } = useSeries();

    // Loading state
    if (status === "loading") {
        return (
            <div className="w-8 h-8 rounded-full bg-gray-200 light:bg-gray-300 animate-pulse" />
        );
    }

    // Format last synced time
    const formatSyncTime = (timestamp) => {
        if (!timestamp) return "Never";
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return "Just now";
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        return date.toLocaleDateString();
    };

    // Signed in
    if (session?.user) {
        return (
            <div className="relative">
                <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="flex items-center gap-2 px-3 py-2 border border-blade-green/30 text-blade-green hover:bg-blade-green/10 transition-all duration-150"
                    style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className="text-sm font-semibold max-w-[100px] truncate">
                        {session.user.name || session.user.email?.split("@")[0]}
                    </span>
                </button>

                {/* Dropdown */}
                {showDropdown && (
                    <>
                        <div
                            className="fixed inset-0 z-40"
                            onClick={() => setShowDropdown(false)}
                        />
                        <div className="absolute right-0 mt-2 w-56 py-2 bg-black light:bg-white border border-blade-silver/20 light:border-gray-200 shadow-xl z-50 rounded">
                            {/* User Info */}
                            <div className="px-4 py-2 border-b border-blade-silver/20 light:border-gray-200">
                                <p className="text-xs text-gray-500 uppercase tracking-wider">Signed in as</p>
                                <p className="text-sm text-foreground font-semibold truncate">
                                    {session.user.email}
                                </p>
                            </div>

                            {/* Sync Status */}
                            <div className="px-4 py-3 border-b border-blade-silver/20 light:border-gray-200">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-500 uppercase tracking-wider">Sync Status</span>
                                    {syncError ? (
                                        <span className="text-xs text-red-400 flex items-center gap-1">
                                            <span>⚠️</span> Error
                                        </span>
                                    ) : isSyncing ? (
                                        <span className="text-xs text-blade-orange flex items-center gap-1">
                                            <span className="animate-spin">🔄</span> Syncing
                                        </span>
                                    ) : (
                                        <span className="text-xs text-blade-green flex items-center gap-1">
                                            <span>☁️</span> Synced
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Last sync: {formatSyncTime(lastSyncedAt)}
                                </p>
                            </div>

                            {/* Sign Out */}
                            <button
                                onClick={() => signOut()}
                                className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-500/10 transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        </div>
                    </>
                )}
            </div>
        );
    }

    // Not signed in
    return (
        <>
            <button
                onClick={() => setShowModal(true)}
                className="flex items-center gap-2 px-4 py-2 border border-blade-green/30 text-blade-green hover:bg-blade-green/10 transition-all duration-150 text-sm font-semibold uppercase tracking-wider"
                style={{ clipPath: 'polygon(6px 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%, 0 6px)' }}
            >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
            </button>

            <AuthModal isOpen={showModal} onClose={() => setShowModal(false)} />
        </>
    );
}
