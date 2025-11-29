'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

// Shared state for tracking unread messages per user
const unreadMessagesRef = { current: new Map<string, number>() };
const listeners = new Set<() => void>();

// Notify all listeners of changes
function notifyListeners() {
    listeners.forEach(listener => listener());
}

export function useUnreadMessages() {
    const [updateTrigger, setUpdateTrigger] = useState(0);

    useEffect(() => {
        const listener = () => {
            setUpdateTrigger(prev => prev + 1);
        };
        listeners.add(listener);
        return () => {
            listeners.delete(listener);
        };
    }, []);

    const incrementUnread = useCallback((userId: string) => {
        const current = unreadMessagesRef.current.get(userId) || 0;
        unreadMessagesRef.current.set(userId, current + 1);
        notifyListeners();
        console.log('Incremented unread for', userId, 'Total:', current + 1);
    }, []);

    const clearUnread = useCallback((userId: string) => {
        unreadMessagesRef.current.delete(userId);
        notifyListeners();
        console.log('Cleared unread for', userId);
    }, []);

    const getUnreadCount = useCallback((userId: string) => {
        return unreadMessagesRef.current.get(userId) || 0;
    }, []);

    const hasUnread = useCallback((userId: string) => {
        return (unreadMessagesRef.current.get(userId) || 0) > 0;
    }, []);

    const getAllUnreadCount = useCallback(() => {
        let total = 0;
        unreadMessagesRef.current.forEach((count) => {
            total += count;
        });
        return total;
    }, []);

    // Use updateTrigger to ensure component re-renders when unread count changes
    // This is a dummy read to trigger re-renders
    void updateTrigger;

    return { 
        incrementUnread, 
        clearUnread, 
        getUnreadCount, 
        hasUnread,
        getAllUnreadCount,
        unreadMessagesRef 
    };
}

