'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { User } from '@/lib/types/collaboration';
import { useQuery, useMutation, useSubscription } from '@apollo/client/react';
import { CHAT_HISTORY, SEND_CHAT_MESSAGE, CHAT_MESSAGE_ADDED, ChatMessage } from '@/lib/graphql/chat';
import { useOpenChats } from '@/hooks/useOpenChats';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';

interface Message {
    id: string;
    from: string;
    to: string;
    message: string;
    timestamp: Date;
}

interface UserChatProps {
    currentUser: User;
    targetUser: User;
    isOpen: boolean;
    onClose: () => void;
}

export function UserChatGraphQL({ currentUser, targetUser, isOpen, onClose }: UserChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Register/unregister chat for notifications
    const { registerOpenChat, unregisterOpenChat } = useOpenChats();
    const { clearUnread } = useUnreadMessages();

    // Register chat as open when dialog opens and clear unread messages
    useEffect(() => {
        if (isOpen) {
            registerOpenChat(targetUser.id);
            clearUnread(targetUser.id);
        } else {
            unregisterOpenChat(targetUser.id);
        }
        return () => {
            unregisterOpenChat(targetUser.id);
        };
    }, [isOpen, targetUser.id, registerOpenChat, unregisterOpenChat, clearUnread]);

    // Load chat history with GraphQL
    const { data: historyData, loading: historyLoading } = useQuery<{ chatHistory: ChatMessage[] }>(CHAT_HISTORY, {
        variables: { fromId: currentUser.id, toId: targetUser.id },
        skip: !isOpen || !currentUser.id || !targetUser.id,
        fetchPolicy: 'cache-and-network',
    });

    // Send message mutation
    const [sendMessageMutation] = useMutation(SEND_CHAT_MESSAGE, {
        refetchQueries: [{ query: CHAT_HISTORY, variables: { targetUserId: targetUser.id } }],
    });

    // Subscribe to new messages
    const { data: newMessageData } = useSubscription<{ chatMessageAdded: ChatMessage }>(CHAT_MESSAGE_ADDED, {
        variables: { targetUserId: targetUser.id },
        skip: !isOpen,
    });

    // Update messages from history
    useEffect(() => {
        if (historyData?.chatHistory) {
            const formattedMessages: Message[] = historyData.chatHistory.map((msg: ChatMessage) => ({
                id: msg.id,
                from: msg.from,
                to: msg.to,
                message: msg.message,
                timestamp: new Date(msg.timestamp),
            }));
            setMessages(formattedMessages);
            setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
            }, 100);
        }
    }, [historyData]);

    // Handle new message from subscription
    useEffect(() => {
        if (newMessageData?.chatMessageAdded) {
            const newMsg = newMessageData.chatMessageAdded;
            setMessages((prev) => {
                // Check if message already exists (avoid duplicates)
                const exists = prev.some(m => m.id === newMsg.id);
                if (exists) return prev;
                
                return [...prev, {
                    id: newMsg.id,
                    from: newMsg.from,
                    to: newMsg.to,
                    message: newMsg.message,
                    timestamp: new Date(newMsg.timestamp),
                }];
            });
        }
    }, [newMessageData]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async () => {
        if (!input.trim()) return;

        const messageText = input.trim();
        setInput('');

        try {
            await sendMessageMutation({
                variables: {
                    to: targetUser.id,
                    message: messageText,
                },
            });
        } catch (error) {
            console.error('Failed to send message:', error);
            // Restore input on error
            setInput(messageText);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] h-[600px] flex flex-col p-0">
                <DialogHeader className="px-4 pt-4 pb-2 border-b">
                    <div className="flex items-center gap-2">
                        <div
                            className="h-3 w-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: targetUser.color }}
                        />
                        <DialogTitle className="text-lg">
                            Chat with {targetUser.name}
                        </DialogTitle>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
                    <div className="space-y-4 py-4">
                        {historyLoading ? (
                            <div className="text-center text-muted-foreground py-8">
                                Loading messages...
                            </div>
                        ) : messages.length === 0 ? (
                            <div className="text-center text-muted-foreground py-8">
                                No messages yet. Start a conversation!
                            </div>
                        ) : (
                            messages.map((msg) => {
                                const isFromCurrentUser = msg.from === currentUser.id;
                                return (
                                    <div
                                        key={msg.id}
                                        className={`flex ${isFromCurrentUser ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div
                                            className={`max-w-[75%] rounded-lg px-3 py-2 ${
                                                isFromCurrentUser
                                                    ? 'bg-primary text-primary-foreground'
                                                    : 'bg-muted'
                                            }`}
                                        >
                                            <p className="text-sm whitespace-pre-wrap break-words">
                                                {msg.message}
                                            </p>
                                            <p
                                                className={`text-xs mt-1 ${
                                                    isFromCurrentUser
                                                        ? 'text-primary-foreground/70'
                                                        : 'text-muted-foreground'
                                                }`}
                                            >
                                                {msg.timestamp.toLocaleTimeString([], {
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                </ScrollArea>

                <div className="px-4 pb-4 border-t pt-2">
                    <div className="flex gap-2">
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Type a message..."
                            className="flex-1"
                        />
                        <Button onClick={handleSend} disabled={!input.trim()}>
                            <Send className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

