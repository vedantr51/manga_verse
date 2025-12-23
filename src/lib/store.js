"use client";

import { createContext, useContext, useState, useEffect } from "react";

const SeriesContext = createContext();

export function SeriesProvider({ children }) {
    const [series, setSeries] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem("mangaverse_series");
        if (saved) {
            try {
                setSeries(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse series data", e);
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to localStorage whenever series changes
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem("mangaverse_series", JSON.stringify(series));
        }
    }, [series, isLoaded]);

    const addSeries = (newSeries) => {
        setSeries((prev) => [...prev, { ...newSeries, id: Date.now().toString() }]);
    };

    const updateSeries = (id, updatedFields) => {
        setSeries((prev) =>
            prev.map((item) => (item.id === id ? { ...item, ...updatedFields } : item))
        );
    };

    const deleteSeries = (id) => {
        setSeries((prev) => prev.filter((item) => item.id !== id));
    };

    return (
        <SeriesContext.Provider value={{ series, addSeries, updateSeries, deleteSeries }}>
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
