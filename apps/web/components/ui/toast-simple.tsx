"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface ToastProps {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    duration?: number
}

export function Toast({ id, title, description, open, onOpenChange, duration = 5000 }: ToastProps) {
    const [isOpen, setIsOpen] = React.useState(open ?? true)

    React.useEffect(() => {
        if (open !== undefined) {
            setIsOpen(open)
        }
    }, [open])

    React.useEffect(() => {
        if (isOpen && duration > 0) {
            const timer = setTimeout(() => {
                setIsOpen(false)
                onOpenChange?.(false)
            }, duration)
            return () => clearTimeout(timer)
        }
    }, [isOpen, duration, onOpenChange])

    if (!isOpen) return null

    return (
        <div
            className={cn(
                "group pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border bg-background p-6 pr-8 shadow-lg transition-all",
                "animate-in slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full"
            )}
        >
            <div className="grid gap-1 flex-1">
                {title && <div className="text-sm font-semibold">{title}</div>}
                {description && <div className="text-sm opacity-90">{description}</div>}
            </div>
            <button
                onClick={() => {
                    setIsOpen(false)
                    onOpenChange?.(false)
                }}
                className="absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100"
            >
                <X className="h-4 w-4" />
            </button>
        </div>
    )
}

export function ToastViewport({ children }: { children?: React.ReactNode }) {
    return (
        <div className="fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px] pointer-events-none">
            {children}
        </div>
    )
}

