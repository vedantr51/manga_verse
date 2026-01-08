"use client";

import { useSeries } from "@/lib/store";
import ToastContainer from "./ToastContainer";

export default function ToastProvider() {
    const { toasts, removeToast } = useSeries();
    return <ToastContainer toasts={toasts} removeToast={removeToast} />;
}
