"use client";

import { useState, useCallback } from 'react';

interface AlertOptions {
    title: string;
    message: string;
    type?: 'info' | 'success' | 'error' | 'warning';
}

interface ConfirmOptions {
    title: string;
    description?: string;
    confirmText?: string;
    cancelText?: string;
    variant?: 'default' | 'destructive';
}

interface PromptOptions {
    title: string;
    description?: string;
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    confirmText?: string;
    cancelText?: string;
    required?: boolean;
}

export function useDialog() {
    const [alertState, setAlertState] = useState<{ open: boolean } & AlertOptions>({
        open: false,
        title: '',
        message: '',
        type: 'info',
    });
    
    const [confirmState, setConfirmState] = useState<{ open: boolean; onConfirm: (() => void) | null } & ConfirmOptions>({
        open: false,
        title: '',
        description: '',
        confirmText: undefined,
        cancelText: undefined,
        variant: 'default',
        onConfirm: null,
    });
    
    const [promptState, setPromptState] = useState<{ open: boolean; onConfirm: ((value: string) => void) | null } & PromptOptions>({
        open: false,
        title: '',
        description: '',
        label: undefined,
        placeholder: undefined,
        defaultValue: '',
        confirmText: undefined,
        cancelText: undefined,
        required: false,
        onConfirm: null,
    });
    
    const alert = useCallback((options: AlertOptions) => {
        return new Promise<void>((resolve) => {
            setAlertState({
                ...options,
                open: true,
            });
            // Store resolve in a way that can be accessed when dialog closes
            (setAlertState as any).__resolve = resolve;
        });
    }, []);
    
    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            setConfirmState({
                ...options,
                open: true,
                onConfirm: () => {
                    resolve(true);
                    setConfirmState(prev => ({ ...prev, open: false, onConfirm: null }));
                },
            });
            // Handle cancel
            const handleCancel = () => {
                resolve(false);
                setConfirmState(prev => ({ ...prev, open: false, onConfirm: null }));
            };
            (setConfirmState as any).__handleCancel = handleCancel;
        });
    }, []);
    
    const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            setPromptState({
                ...options,
                open: true,
                onConfirm: (value: string) => {
                    resolve(value);
                    setPromptState(prev => ({ ...prev, open: false, onConfirm: null }));
                },
            });
            // Handle cancel
            const handleCancel = () => {
                resolve(null);
                setPromptState(prev => ({ ...prev, open: false, onConfirm: null }));
            };
            (setPromptState as any).__handleCancel = handleCancel;
        });
    }, []);
    
    return {
        alert,
        confirm,
        prompt,
        alertState,
        confirmState,
        promptState,
        setAlertState,
        setConfirmState,
        setPromptState,
    };
}

