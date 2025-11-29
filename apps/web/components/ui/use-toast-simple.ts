"use client"

import * as React from "react"
import { Toast, ToastViewport } from "@/components/ui/toast-simple"

type ToastProps = {
    id: string
    title?: React.ReactNode
    description?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    duration?: number
}

const TOAST_LIMIT = 1
const TOAST_REMOVE_DELAY = 1000000

type ToasterToast = ToastProps

let count = 0

function genId() {
    count = (count + 1) % Number.MAX_SAFE_INTEGER
    return count.toString()
}

const listeners: Array<(state: State) => void> = []

interface State {
    toasts: ToasterToast[]
}

let memoryState: State = { toasts: [] }

function dispatch(action: { type: "ADD_TOAST" | "REMOVE_TOAST"; toast?: ToasterToast; toastId?: string }) {
    switch (action.type) {
        case "ADD_TOAST":
            if (action.toast) {
                memoryState = {
                    toasts: [action.toast, ...memoryState.toasts].slice(0, TOAST_LIMIT),
                }
            }
            break
        case "REMOVE_TOAST":
            if (action.toastId) {
                memoryState = {
                    toasts: memoryState.toasts.filter((t) => t.id !== action.toastId),
                }
            } else {
                memoryState = { toasts: [] }
            }
            break
    }
    listeners.forEach((listener) => {
        listener(memoryState)
    })
}

type Toast = Omit<ToasterToast, "id">

function toast({ ...props }: Toast) {
    const id = genId()

    const toastData: ToasterToast = {
        ...props,
        id,
        open: true,
        onOpenChange: (open) => {
            if (!open) {
                setTimeout(() => {
                    dispatch({ type: "REMOVE_TOAST", toastId: id })
                }, TOAST_REMOVE_DELAY)
            }
        },
    }

    dispatch({
        type: "ADD_TOAST",
        toast: toastData,
    })

    return {
        id: id,
        dismiss: () => {
            dispatch({ type: "REMOVE_TOAST", toastId: id })
        },
    }
}

function useToast() {
    const [state, setState] = React.useState<State>(memoryState)

    React.useEffect(() => {
        listeners.push(setState)
        return () => {
            const index = listeners.indexOf(setState)
            if (index > -1) {
                listeners.splice(index, 1)
            }
        }
    }, [state])

    return {
        ...state,
        toast,
        dismiss: (toastId?: string) => dispatch({ type: "REMOVE_TOAST", toastId }),
    }
}

export { useToast, toast }

