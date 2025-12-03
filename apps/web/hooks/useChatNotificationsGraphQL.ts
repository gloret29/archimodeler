'use client';

import { useEffect } from 'react';
import { useSubscription } from '@apollo/client/react';
import { useToast } from '@/components/ui/use-toast-simple';
import { User } from '@/lib/types/collaboration';
import { useOpenChats } from './useOpenChats';
import { useUnreadMessages } from './useUnreadMessages';
import { useChatSenders } from './useChatSenders';
import { CHAT_MESSAGE_ADDED, ChatMessage } from '@/lib/graphql/chat';

interface UseChatNotificationsOptions {
    currentUser: User | null;
    enabled: boolean;
    activeUsers?: User[];
}

export function useChatNotificationsGraphQL({ currentUser, enabled, activeUsers = [] }: UseChatNotificationsOptions) {
    const { toast } = useToast();
    const { openChatsRef } = useOpenChats();
    const { incrementUnread } = useUnreadMessages();
    const { addSender } = useChatSenders();

    // Subscribe to all chat messages (filtered by current user on the server)
    const { data: chatMessageData } = useSubscription<{ chatMessageAdded: ChatMessage }>(
        CHAT_MESSAGE_ADDED,
        {
            skip: !enabled || !currentUser,
        }
    );

    useEffect(() => {
        if (!chatMessageData?.chatMessageAdded || !currentUser) return;

        const data = chatMessageData.chatMessageAdded;
        
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
            
            // Check if chat is open
            const isChatOpen = openChatsRef.current.has(data.from);
            
            // Show toast notification only if chat is not open
            if (!isChatOpen) {
                toast({
                    title: `New message from ${senderName}`,
                    description: data.message,
                    duration: 5000,
                });
            }
        }
    }, [chatMessageData, currentUser, activeUsers, toast, addSender, incrementUnread, openChatsRef]);
}

