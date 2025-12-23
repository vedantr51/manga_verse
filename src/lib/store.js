"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";

const SeriesContext = createContext();

export function SeriesProvider({ children }) {
    const { data: session, status } = useSession();
    const [series, setSeries] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);

    const isAuthenticated = status === "authenticated" && session?.user?.id;

    // Fetch series from API
    const fetchFromAPI = useCallback(async () => {
        try {
            const res = await fetch("/api/series");
            if (res.ok) {
                const data = await res.json();
                return data;
            }
            return null;
        } catch (error) {
            console.error("Failed to fetch from API:", error);
            return null;
        }
    }, []);

    // Sync localStorage data to DB
    const syncToAPI = useCallback(async (localData) => {
        if (!localData || localData.length === 0) return;

        try {
            setIsSyncing(true);
            const res = await fetch("/api/series", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(localData),
            });
            if (res.ok) {
                // Clear localStorage after successful sync
                localStorage.removeItem("mangaverse_series");
                console.log("Local data synced to database");
            }
        } catch (error) {
            console.error("Failed to sync to API:", error);
        } finally {
            setIsSyncing(false);
        }
    }, []);

    // Load data on mount or auth change
    useEffect(() => {
        const loadData = async () => {
            if (status === "loading") return;

            if (isAuthenticated) {
                // User is logged in - fetch from DB
                const apiData = await fetchFromAPI();

                if (apiData !== null) {
                    // Check if there's localStorage data to sync
                    const localData = localStorage.getItem("mangaverse_series");
                    if (localData) {
                        try {
                            const parsed = JSON.parse(localData);
                            if (parsed.length > 0) {
                                // Sync local data to API
                                await syncToAPI(parsed);
                                // Refetch after sync
                                const updatedData = await fetchFromAPI();
                                setSeries(updatedData || []);
                            } else {
                                setSeries(apiData);
                            }
                        } catch (e) {
                            setSeries(apiData);
                        }
                    } else {
                        setSeries(apiData);
                    }
                } else {
                    // API failed, fall back to localStorage
                    const saved = localStorage.getItem("mangaverse_series");
                    if (saved) {
                        try {
                            setSeries(JSON.parse(saved));
                        } catch (e) {
                            console.error("Failed to parse series data", e);
                        }
                    }
                }
            } else {
                // Not logged in - use localStorage
                const saved = localStorage.getItem("mangaverse_series");
                if (saved) {
                    try {
                        setSeries(JSON.parse(saved));
                    } catch (e) {
                        console.error("Failed to parse series data", e);
                    }
                }
            }
            setIsLoaded(true);
        };

        loadData();
    }, [status, isAuthenticated, fetchFromAPI, syncToAPI]);

    // Save to localStorage whenever series changes (fallback for offline)
    useEffect(() => {
        if (isLoaded && !isAuthenticated) {
            localStorage.setItem("mangaverse_series", JSON.stringify(series));
        }
    }, [series, isLoaded, isAuthenticated]);

    const addSeries = async (newSeries) => {
        const seriesWithId = { ...newSeries, id: Date.now().toString() };

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
        setSeries((prev) => [...prev, seriesWithId]);
    };

    const updateSeries = async (id, updatedFields) => {
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
            prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
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

    return (
        <SeriesContext.Provider value={{
            series,
            addSeries,
            updateSeries,
            deleteSeries,
            isAuthenticated,
            isSyncing,
            isLoaded
        }}>
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
