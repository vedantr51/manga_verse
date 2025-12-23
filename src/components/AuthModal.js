"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

export default function AuthModal({ isOpen, onClose }) {
    const [mode, setMode] = useState("signin"); // signin or signup
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

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
                    body: JSON.stringify({ email, password, name }),
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
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
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

    return (
        <div
            className="fixed inset-0 z-[999] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={onClose}
            onKeyDown={handleKeyDown}
            style={{ minHeight: '100vh', minWidth: '100vw' }}
        >
            <div
                className="relative w-full max-w-md bg-[#1a1a1a] light:bg-white border border-blade-silver/20 light:border-gray-200 rounded p-6 shadow-2xl"
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
                                className="w-full p-3 bg-transparent border-b-2 border-gray-600 light:border-gray-300 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150"
                                placeholder="Your name"
                            />
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full p-3 bg-transparent border-b-2 border-gray-600 light:border-gray-300 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-xs font-bold mb-2 text-gray-500 uppercase tracking-wider">
                            Password
                        </label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                            className="w-full p-3 bg-transparent border-b-2 border-gray-600 light:border-gray-300 text-foreground focus:outline-none focus:border-blade-green transition-colors duration-150"
                            placeholder="••••••••"
                        />
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
        </div>
    );
}
