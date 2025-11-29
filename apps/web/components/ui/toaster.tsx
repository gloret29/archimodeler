"use client"

import { Toast, ToastViewport } from "@/components/ui/toast-simple"
import { useToast } from "@/components/ui/use-toast-simple"

export function Toaster() {
    const { toasts } = useToast()

    return (
        <ToastViewport>
            {toasts.map((toast) => (
                <Toast key={toast.id} {...toast} />
            ))}
        </ToastViewport>
    )
}
