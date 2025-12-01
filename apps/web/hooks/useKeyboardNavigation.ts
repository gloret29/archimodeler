'use client';

import { useEffect, useCallback } from 'react';

interface KeyboardNavigationOptions {
    /**
     * Raccourci clavier (ex: 'ctrl+k', 'alt+n')
     */
    shortcut: string;
    /**
     * Callback appelé quand le raccourci est pressé
     */
    handler: (e: KeyboardEvent) => void;
    /**
     * Si true, empêche le comportement par défaut
     */
    preventDefault?: boolean;
    /**
     * Si true, arrête la propagation de l'événement
     */
    stopPropagation?: boolean;
}

/**
 * Hook pour gérer la navigation au clavier
 */
export function useKeyboardNavigation(options: KeyboardNavigationOptions) {
    const { shortcut, handler, preventDefault = true, stopPropagation = false } = options;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const keys = shortcut.toLowerCase().split('+').map(k => k.trim());
            const modifiers = {
                ctrl: keys.includes('ctrl') || keys.includes('cmd'),
                alt: keys.includes('alt'),
                shift: keys.includes('shift'),
                meta: keys.includes('meta') || keys.includes('cmd'),
            };
            const key = keys[keys.length - 1];

            if (!key || !e.key) {
                return;
            }

            const matchesModifiers =
                e.ctrlKey === modifiers.ctrl &&
                e.altKey === modifiers.alt &&
                e.shiftKey === modifiers.shift &&
                (e.metaKey === modifiers.meta || (modifiers.ctrl && (e.metaKey || e.ctrlKey)));

            const matchesKey = e.key.toLowerCase() === key.toLowerCase();

            if (matchesModifiers && matchesKey) {
                if (preventDefault) {
                    e.preventDefault();
                }
                if (stopPropagation) {
                    e.stopPropagation();
                }
                handler(e);
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcut, handler, preventDefault, stopPropagation]);
}

/**
 * Hook pour gérer la navigation au clavier avec plusieurs raccourcis
 */
export function useKeyboardShortcuts(shortcuts: KeyboardNavigationOptions[]) {
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            for (const { shortcut, handler, preventDefault = true, stopPropagation = false } of shortcuts) {
                const keys = shortcut.toLowerCase().split('+').map(k => k.trim());
                const modifiers = {
                    ctrl: keys.includes('ctrl') || keys.includes('cmd'),
                    alt: keys.includes('alt'),
                    shift: keys.includes('shift'),
                    meta: keys.includes('meta') || keys.includes('cmd'),
                };
                const key = keys[keys.length - 1];

                if (!key || !e.key) {
                    continue;
                }

                const matchesModifiers =
                    e.ctrlKey === modifiers.ctrl &&
                    e.altKey === modifiers.alt &&
                    e.shiftKey === modifiers.shift &&
                    (e.metaKey === modifiers.meta || (modifiers.ctrl && (e.metaKey || e.ctrlKey)));

                const matchesKey = e.key.toLowerCase() === key.toLowerCase();

                if (matchesModifiers && matchesKey) {
                    if (preventDefault) {
                        e.preventDefault();
                    }
                    if (stopPropagation) {
                        e.stopPropagation();
                    }
                    handler(e);
                    break; // Ne traiter qu'un seul raccourci à la fois
                }
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [shortcuts]);
}

/**
 * Hook pour gérer la navigation au clavier dans une liste (flèches haut/bas, Enter, Escape)
 */
export function useListKeyboardNavigation<T>(
    items: T[],
    onSelect: (item: T, index: number) => void,
    onEscape?: () => void
) {
    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent, selectedIndex: number) => {
            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    if (selectedIndex < items.length - 1) {
                        const nextItem = items[selectedIndex + 1];
                        if (nextItem !== undefined) {
                            onSelect(nextItem, selectedIndex + 1);
                        }
                    }
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    if (selectedIndex > 0) {
                        const prevItem = items[selectedIndex - 1];
                        if (prevItem !== undefined) {
                            onSelect(prevItem, selectedIndex - 1);
                        }
                    }
                    break;
                case 'Enter':
                case ' ':
                    e.preventDefault();
                    if (selectedIndex >= 0 && selectedIndex < items.length) {
                        const currentItem = items[selectedIndex];
                        if (currentItem !== undefined) {
                            onSelect(currentItem, selectedIndex);
                        }
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    onEscape?.();
                    break;
                case 'Home':
                    e.preventDefault();
                    if (items.length > 0) {
                        const firstItem = items[0];
                        if (firstItem !== undefined) {
                            onSelect(firstItem, 0);
                        }
                    }
                    break;
                case 'End':
                    e.preventDefault();
                    if (items.length > 0) {
                        const lastItem = items[items.length - 1];
                        if (lastItem !== undefined) {
                            onSelect(lastItem, items.length - 1);
                        }
                    }
                    break;
            }
        },
        [items, onSelect, onEscape]
    );

    return { handleKeyDown };
}

