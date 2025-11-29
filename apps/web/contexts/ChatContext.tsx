'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { User } from '@/hooks/useCollaboration';

interface ChatContextType {
    openChat: (userId: string, userName?: string, userColor?: string) => void;
    closeChat: () => void;
    chatTarget: { id: string; name: string; color: string } | null;
    isChatOpen: boolean;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
    const [chatTarget, setChatTarget] = useState<{ id: string; name: string; color: string } | null>(null);
    const [isChatOpen, setIsChatOpen] = useState(false);

    const openChat = useCallback((userId: string, userName?: string, userColor?: string) => {
        setChatTarget({
            id: userId,
            name: userName || 'User',
            color: userColor || '#4ECDC4',
        });
        setIsChatOpen(true);
    }, []);

    const closeChat = useCallback(() => {
        setIsChatOpen(false);
        setChatTarget(null);
    }, []);

    return (
        <ChatContext.Provider value={{ openChat, closeChat, chatTarget, isChatOpen }}>
            {children}
        </ChatContext.Provider>
    );
}

export function useChatContext() {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChatContext must be used within ChatProvider');
    }
    return context;
}

