'use client';

import { useRef, useCallback } from 'react';

// Shared state for tracking open chats across components
const openChatsRef = { current: new Set<string>() };

export function useOpenChats() {
    const registerOpenChat = useCallback((userId: string) => {
        openChatsRef.current.add(userId);
        console.log('Registered open chat:', userId, 'Open chats:', Array.from(openChatsRef.current));
    }, []);

    const unregisterOpenChat = useCallback((userId: string) => {
        openChatsRef.current.delete(userId);
        console.log('Unregistered open chat:', userId, 'Open chats:', Array.from(openChatsRef.current));
    }, []);

    const isChatOpen = useCallback((userId: string) => {
        return openChatsRef.current.has(userId);
    }, []);

    return { registerOpenChat, unregisterOpenChat, isChatOpen, openChatsRef };
}

