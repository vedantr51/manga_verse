"use client";

import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";

import { createPortal } from "react-dom";

export default function AuthModal({ isOpen, onClose }) {
    const [mode, setMode] = useState("signin"); // signin or signup
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        return () => setMounted(false);
    }, []);

    if (!isOpen || !mounted) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        try {
            if (mode === "signup") {
                // Register first
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password, name }),
                });

                const data = await res.json();

                if (!res.ok) {
                    setError(data.error || "Registration failed");
                    setLoading(false);
                    return;
                }
            }

            // Sign in
            const result = await signIn("credentials", {
                username,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid username or password");
                setLoading(false);
                return;
            }

            // Success - close modal and refresh
            onClose();
            window.location.reload();
        } catch (err) {
            setError("Something went wrong");
            setLoading(false);
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape") {
            onClose();
        }
    };

    return createPortal(
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            style={{ minHeight: '100vh', minWidth: '100vw' }}
        >
            <div
                className="relative w-full max-w-md bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-blade-silver/20 rounded p-6 shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Modal accent line */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blade-green to-blade-orange rounded-t" />

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-gray-400 hover:text-foreground transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                {/* Header */}
                <div className="mb-6 mt-2">
                    <h3 className="Heading-lg text-xl text-foreground">
                        {mode === "signin" ? "Welcome Back" : "Join MangaVerse"}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                        {mode === "signin"
                            ? "Sign in to sync your library across devices"
                            : "Create an account to save your progress"}
                    </p>
                </div>

                {/* Error message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 text-red-500 text-sm rounded">
                        {error}
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit}>
                    {mode === "signup" && (
                        <div className="mb-4">
                            <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                                Name (optional)
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full p-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150"
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                            Username
                        </label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            minLength={3}
                            className="w-full p-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150"
                            placeholder="your_username"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                minLength={6}
                                className="w-full p-3 bg-transparent border-b-2 border-gray-300 dark:border-gray-600 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150 pr-10"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-3 text-gray-400 hover:text-blade-green transition-colors"
                            >
                                {showPassword ? (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blade-green text-black font-bold text-sm uppercase tracking-wider hover:shadow-lg hover:shadow-blade-green/30 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{ clipPath: 'polygon(8px 0, 100% 0, 100% calc(100% - 8px), calc(100% - 8px) 100%, 0 100%, 0 8px)' }}
                    >
                        {loading ? "Please wait..." : mode === "signin" ? "Sign In" : "Create Account"}
                    </button>
                </form>

                {/* Toggle mode */}
                <div className="mt-6 text-center">
                    <span className="text-gray-500 text-sm">
                        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                        onClick={() => {
                            setMode(mode === "signin" ? "signup" : "signin");
                            setError("");
                        }}
                        className="text-blade-green text-sm font-semibold hover:underline"
                    >
                        {mode === "signin" ? "Sign Up" : "Sign In"}
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
}
