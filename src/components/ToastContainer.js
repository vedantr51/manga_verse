"use client";

import { createPortal } from "react-dom";
import { useEffect, useState, useMemo } from "react";
import Toast from "./Toast";

export default function ToastContainer({ toasts, removeToast }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Create stable dismiss handlers for each toast
    const toastsWithHandlers = useMemo(() => {
        return toasts.map((toast) => ({
            ...toast,
            onDismiss: () => removeToast(toast.id),
        }));
    }, [toasts, removeToast]);

    if (!mounted) return null;

    return createPortal(
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
            {toastsWithHandlers.map((toast) => (
                <div key={toast.id} className="pointer-events-auto">
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        duration={toast.duration}
                        onDismiss={toast.onDismiss}
                    />
                </div>
            ))}
        </div>,
        document.body
    );
}
