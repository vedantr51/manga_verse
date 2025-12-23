"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const SeriesContext = createContext();

const STORAGE_KEY = "mangaverse_series";
const LAST_SYNC_KEY = "mangaverse_last_sync";

export function SeriesProvider({ children }) {
    const { data: session, status } = useSession();
    const [series, setSeries] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [syncError, setSyncError] = useState(null);
    const [lastSyncedAt, setLastSyncedAt] = useState(null);

    const isAuthenticated = status === "authenticated" && session?.user?.id;

    // Get local data with timestamps
    const getLocalData = useCallback(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error("Failed to parse local data:", e);
        }
        return [];
    }, []);

    // Save to localStorage with updatedAt timestamp
    const saveLocalData = useCallback((data) => {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (e) {
            console.error("Failed to save local data:", e);
        }
    }, []);

    // Sync with cloud using the new /api/sync endpoint
    const syncWithCloud = useCallback(async (localData) => {
        try {
            setIsSyncing(true);
            setSyncError(null);

            const res = await fetch("/api/sync", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: localData,
                    lastSyncedAt,
                }),
            });

            if (!res.ok) {
                throw new Error("Sync failed");
            }

            const { merged, syncedAt } = await res.json();

            // Clear local storage after successful sync
            localStorage.removeItem(STORAGE_KEY);
            localStorage.setItem(LAST_SYNC_KEY, syncedAt);

            setLastSyncedAt(syncedAt);
            setSeries(merged.map(({ syncAction, ...item }) => item));

            console.log(`Synced ${merged.length} items at ${syncedAt}`);
            return merged;
        } catch (error) {
            console.error("Sync failed:", error);
            setSyncError(error.message);
            return null;
        } finally {
            setIsSyncing(false);
        }
    }, [lastSyncedAt]);

    // Fetch from API (for authenticated users)
    const fetchFromAPI = useCallback(async () => {
        try {
            const res = await fetch("/api/series");
            if (res.ok) {
                return await res.json();
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch from API:", error);
            return null;
        }
    }, []);

    // Load data on mount or auth change
    useEffect(() => {
        const loadData = async () => {
            if (status === "loading") return;

            const savedLastSync = localStorage.getItem(LAST_SYNC_KEY);
            if (savedLastSync) {
                setLastSyncedAt(savedLastSync);
            }

            if (isAuthenticated) {
                const localData = getLocalData();

                if (localData.length > 0) {
                    // Has local data - sync it with cloud
                    const merged = await syncWithCloud(localData);
                    if (!merged) {
                        // Sync failed - use local as fallback
                        setSeries(localData);
                    }
                } else {
                    // No local data - fetch from cloud
                    const apiData = await fetchFromAPI();
                    if (apiData) {
                        setSeries(apiData);
                        // Mark as synced since we loaded from cloud
                        const now = new Date().toISOString();
                        setLastSyncedAt(now);
                        localStorage.setItem(LAST_SYNC_KEY, now);
                    }
                }
            } else {
                // Not logged in - use localStorage
                setSeries(getLocalData());
            }

            setIsLoaded(true);
        };

        loadData();
    }, [status, isAuthenticated, getLocalData, syncWithCloud, fetchFromAPI]);

    // Save to localStorage when series changes (for non-authenticated users)
    useEffect(() => {
        if (isLoaded && !isAuthenticated && series.length > 0) {
            const dataWithTimestamps = series.map((item) => ({
                ...item,
                updatedAt: item.updatedAt || new Date().toISOString(),
            }));
            saveLocalData(dataWithTimestamps);
        }
    }, [series, isLoaded, isAuthenticated, saveLocalData]);

    const addSeries = async (newSeries) => {
        const now = new Date().toISOString();
        const seriesWithMeta = {
            ...newSeries,
            id: Date.now().toString(),
            createdAt: now,
            updatedAt: now,
        };

        if (isAuthenticated) {
            try {
                const res = await fetch("/api/series", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(newSeries),
                });
                if (res.ok) {
                    const created = await res.json();
                    setSeries((prev) => [created, ...prev]);
                    return;
                }
            } catch (error) {
                console.error("Failed to add series to API:", error);
            }
        }

        // Fallback to local state
        setSeries((prev) => [seriesWithMeta, ...prev]);
    };

    const updateSeries = async (id, updatedFields) => {
        const now = new Date().toISOString();

        if (isAuthenticated) {
            try {
                const res = await fetch(`/api/series/${id}`, {
                    method: "PUT",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(updatedFields),
                });
                if (res.ok) {
                    const updated = await res.json();
                    setSeries((prev) =>
                        prev.map((item) => (item.id === id ? updated : item))
                    );
                    return;
                }
            } catch (error) {
                console.error("Failed to update series in API:", error);
            }
        }

        // Fallback to local state
        setSeries((prev) =>
            prev.map((item) =>
                item.id === id ? { ...item, ...updatedFields, updatedAt: now } : item
            )
        );
    };

    const deleteSeries = async (id) => {
        if (isAuthenticated) {
            try {
                const res = await fetch(`/api/series/${id}`, {
                    method: "DELETE",
                });
                if (res.ok) {
                    setSeries((prev) => prev.filter((item) => item.id !== id));
                    return;
                }
            } catch (error) {
                console.error("Failed to delete series from API:", error);
            }
        }

        // Fallback to local state
        setSeries((prev) => prev.filter((item) => item.id !== id));
    };

    // Manual sync trigger
    const triggerSync = async () => {
        if (!isAuthenticated) return;
        const localData = getLocalData();
        await syncWithCloud(localData);
    };

    return (
        <SeriesContext.Provider
            value={{
                series,
                addSeries,
                updateSeries,
                deleteSeries,
                isAuthenticated,
                isSyncing,
                isLoaded,
                syncError,
                lastSyncedAt,
                triggerSync,
            }}
        >
            {children}
        </SeriesContext.Provider>
    );
}

export function useSeries() {
    const context = useContext(SeriesContext);
    if (!context) {
        throw new Error("useSeries must be used within a SeriesProvider");
    }
    return context;
}
