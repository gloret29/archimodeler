'use client';

import { useRef, useCallback, useState, useEffect } from 'react';

// Shared state for tracking senders of messages (to display in conversations list)
const chatSendersRef = { current: new Map<string, { id: string; name: string; color: string; lastMessage?: string; lastMessageTime?: Date }>() };
const listeners = new Set<() => void>();

// Notify all listeners of changes
function notifyListeners() {
    listeners.forEach(listener => listener());
}

export function useChatSenders() {
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

    const addSender = useCallback((sender: { id: string; name: string; color: string; lastMessage?: string; lastMessageTime?: Date }) => {
        chatSendersRef.current.set(sender.id, {
            ...chatSendersRef.current.get(sender.id),
            ...sender,
        });
        notifyListeners();
    }, []);

    const getSender = useCallback((userId: string) => {
        return chatSendersRef.current.get(userId);
    }, []);

    const getAllSenders = useCallback(() => {
        return Array.from(chatSendersRef.current.values());
    }, []);

    // Use updateTrigger to ensure component re-renders when senders change
    // This is a dummy read to trigger re-renders
    void updateTrigger;

    return { addSender, getSender, getAllSenders, chatSendersRef };
}

