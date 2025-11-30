"use client";

import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import { AlertDialog } from '@/components/common/AlertDialog';
import { MessageDialog } from '@/components/common/MessageDialog';
import { PromptDialog } from '@/components/common/PromptDialog';

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

interface DialogContextType {
    alert: (options: AlertOptions) => Promise<void>;
    confirm: (options: ConfirmOptions) => Promise<boolean>;
    prompt: (options: PromptOptions) => Promise<string | null>;
}

const DialogContext = createContext<DialogContextType | undefined>(undefined);

export function DialogProvider({ children }: { children: ReactNode }) {
    const alertResolveRef = useRef<(() => void) | null>(null);
    const confirmResolveRef = useRef<((value: boolean) => void) | null>(null);
    const promptResolveRef = useRef<((value: string | null) => void) | null>(null);
    
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
    
    const alert = useCallback((options: AlertOptions): Promise<void> => {
        return new Promise((resolve) => {
            alertResolveRef.current = resolve;
            setAlertState({
                ...options,
                open: true,
            });
        });
    }, []);
    
    const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
        return new Promise((resolve) => {
            confirmResolveRef.current = resolve;
            setConfirmState({
                ...options,
                open: true,
                onConfirm: () => {
                    if (confirmResolveRef.current) {
                        confirmResolveRef.current(true);
                        confirmResolveRef.current = null;
                    }
                    setConfirmState(prev => ({ ...prev, open: false, onConfirm: null }));
                },
            });
        });
    }, []);
    
    const prompt = useCallback((options: PromptOptions): Promise<string | null> => {
        return new Promise((resolve) => {
            promptResolveRef.current = resolve;
            setPromptState({
                ...options,
                open: true,
                onConfirm: (value: string) => {
                    if (promptResolveRef.current) {
                        promptResolveRef.current(value);
                        promptResolveRef.current = null;
                    }
                    setPromptState(prev => ({ ...prev, open: false, onConfirm: null }));
                },
            });
        });
    }, []);
    
    const handleAlertClose = (open: boolean) => {
        if (!open) {
            if (alertResolveRef.current) {
                alertResolveRef.current();
                alertResolveRef.current = null;
            }
        }
        setAlertState(prev => ({ ...prev, open }));
    };
    
    const handleConfirmClose = (open: boolean) => {
        if (!open) {
            if (confirmResolveRef.current) {
                confirmResolveRef.current(false);
                confirmResolveRef.current = null;
            }
            setConfirmState(prev => ({ ...prev, open: false, onConfirm: null }));
        }
    };
    
    const handlePromptClose = (open: boolean) => {
        if (!open) {
            if (promptResolveRef.current) {
                promptResolveRef.current(null);
                promptResolveRef.current = null;
            }
            setPromptState(prev => ({ ...prev, open: false, onConfirm: null }));
        }
    };
    
    return (
        <DialogContext.Provider value={{ alert, confirm, prompt }}>
            {children}
            <MessageDialog
                open={alertState.open}
                onOpenChange={handleAlertClose}
                title={alertState.title}
                message={alertState.message}
                type={alertState.type}
            />
            <AlertDialog
                open={confirmState.open}
                onOpenChange={handleConfirmClose}
                title={confirmState.title}
                description={confirmState.description}
                confirmText={confirmState.confirmText}
                cancelText={confirmState.cancelText}
                onConfirm={confirmState.onConfirm || (() => {})}
                variant={confirmState.variant}
            />
            <PromptDialog
                open={promptState.open}
                onOpenChange={handlePromptClose}
                title={promptState.title}
                description={promptState.description}
                label={promptState.label}
                placeholder={promptState.placeholder}
                defaultValue={promptState.defaultValue}
                confirmText={promptState.confirmText}
                cancelText={promptState.cancelText}
                onConfirm={promptState.onConfirm || (() => {})}
                required={promptState.required}
            />
        </DialogContext.Provider>
    );
}

export function useDialog() {
    const context = useContext(DialogContext);
    if (context === undefined) {
        throw new Error('useDialog must be used within a DialogProvider');
    }
    return context;
}

