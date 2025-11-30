'use client';

import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useToast } from '@/components/ui/use-toast-simple';
import { User } from './useCollaboration';
import { useOpenChats } from './useOpenChats';
import { useUnreadMessages } from './useUnreadMessages';
import { useChatSenders } from './useChatSenders';
import { API_CONFIG } from '@/lib/api/config';

interface UseChatNotificationsOptions {
    currentUser: User | null;
    enabled: boolean;
    activeUsers?: User[];
}

export function useChatNotifications({ currentUser, enabled, activeUsers = [] }: UseChatNotificationsOptions) {
    const { toast } = useToast();
    const socketRef = useRef<Socket | null>(null);
    const { openChatsRef } = useOpenChats(); // Use shared state for open chats
    const { incrementUnread } = useUnreadMessages(); // Track unread messages
    const { addSender } = useChatSenders(); // Track message senders

    useEffect(() => {
        if (!enabled || !currentUser) return;

        // Connect to WebSocket for chat notifications
        const socket = io(API_CONFIG.wsUrl, {
            transports: ['websocket'],
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('Chat notifications WebSocket connected');
        });

        // Listen for incoming chat messages
        socket.on('chat-message', (data: { 
            from: string; 
            to: string; 
            message: string; 
            timestamp: string;
            senderName?: string;
        }) => {
            // Always read the current value of openChatsRef.current (not captured at listener creation time)
            const isChatOpen = openChatsRef.current.has(data.from);
            console.log('Chat notification received:', data, 'Current user:', currentUser.id, 'Open chats:', Array.from(openChatsRef.current), 'Is chat open:', isChatOpen);
            
            // Only process if message is for current user
            if (data.to === currentUser.id) {
                // Try to get sender info from activeUsers
                const sender = activeUsers.find(u => u.id === data.from);
                const senderName = data.senderName || sender?.name || 'User';
                const senderColor = sender?.color || '#4ECDC4';
                
                // Store sender information for conversations list
                addSender({
                    id: data.from,
                    name: senderName,
                    color: senderColor,
                    lastMessage: data.message,
                    lastMessageTime: new Date(data.timestamp),
                });
                
                // Always increment unread count when a message is received
                incrementUnread(data.from);
                
                // Show toast notification only if chat is not open
                if (!isChatOpen) {
                    console.log('Showing toast notification for message from', senderName);
                    toast({
                        title: `New message from ${senderName}`,
                        description: data.message,
                        duration: 5000,
                    });
                } else {
                    console.log('Notification not shown - chat is open');
                }
            } else {
                console.log('Message not for current user');
            }
        });

        return () => {
            socket.disconnect();
        };
    }, [enabled, currentUser, toast, activeUsers]);
}

