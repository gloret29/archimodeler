'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, Send, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { User } from '@/hooks/useCollaboration';
import { io, Socket } from 'socket.io-client';
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

export function UserChat({ currentUser, targetUser, isOpen, onClose }: UserChatProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [socket, setSocket] = useState<Socket | null>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    
    // Register/unregister chat for notifications
    const { registerOpenChat, unregisterOpenChat } = useOpenChats();
    const { clearUnread } = useUnreadMessages();

    // Register chat as open when dialog opens and clear unread messages
    useEffect(() => {
        if (isOpen) {
            registerOpenChat(targetUser.id);
            clearUnread(targetUser.id); // Clear unread messages when chat is opened
        } else {
            unregisterOpenChat(targetUser.id);
        }
        return () => {
            unregisterOpenChat(targetUser.id);
        };
    }, [isOpen, targetUser.id, registerOpenChat, unregisterOpenChat, clearUnread]);

    useEffect(() => {
        if (!isOpen) return;

        // Connect to WebSocket for chat
        const newSocket = io('http://localhost:3002/collaboration', {
            transports: ['websocket'],
        });

        newSocket.on('connect', () => {
            console.log('Chat WebSocket connected');
            // Join chat room - must be done after connection
            newSocket.emit('join-chat', {
                userId: currentUser.id,
                targetUserId: targetUser.id,
            });
            console.log(`Joined chat rooms for ${currentUser.id} <-> ${targetUser.id}`);
        });

        // Listen for incoming messages
        newSocket.on('chat-message', (data: { from: string; to: string; message: string; timestamp: string; messageId?: string }) => {
            console.log('Received chat message:', data);
            // Only add if it's a message for this chat (from or to current user)
            if ((data.from === currentUser.id && data.to === targetUser.id) ||
                (data.from === targetUser.id && data.to === currentUser.id)) {
                setMessages(prev => {
                    // Check if message already exists (avoid duplicates)
                    // Use messageId if provided, otherwise check by content and timestamp
                    const exists = data.messageId 
                        ? prev.some(m => m.id === data.messageId)
                        : prev.some(m => 
                            m.from === data.from && 
                            m.to === data.to && 
                            m.message === data.message &&
                            Math.abs(new Date(m.timestamp).getTime() - new Date(data.timestamp).getTime()) < 1000
                        );
                    if (exists) {
                        console.log('Message already exists, skipping');
                        return prev;
                    }
                    
                    console.log('Adding new message to chat');
                    return [...prev, {
                        id: data.messageId || `${Date.now()}-${Math.random()}`,
                        from: data.from,
                        to: data.to,
                        message: data.message,
                        timestamp: new Date(data.timestamp),
                    }];
                });
            } else {
                console.log('Message not for this chat, ignoring');
            }
        });

        setSocket(newSocket);

        return () => {
            newSocket.disconnect();
        };
    }, [isOpen, currentUser.id, targetUser.id]);

    // Scroll to bottom when new messages arrive
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !socket) return;

        const messageText = input.trim();
        const timestamp = new Date().toISOString();
        const messageId = `${currentUser.id}-${targetUser.id}-${Date.now()}-${messageText.substring(0, 10)}`;

        // Emit message via WebSocket
        console.log('Sending chat message:', {
            from: currentUser.id,
            to: targetUser.id,
            message: messageText,
        });
        socket.emit('chat-message', {
            from: currentUser.id,
            to: targetUser.id,
            message: messageText,
            timestamp: timestamp,
            messageId: messageId, // Include messageId to help with deduplication
            senderName: currentUser.name, // Include sender name for notifications
        });

        // Add to local state immediately for instant feedback
        const message: Message = {
            id: messageId,
            from: currentUser.id,
            to: targetUser.id,
            message: messageText,
            timestamp: new Date(timestamp),
        };
        
        setMessages(prev => [...prev, message]);
        setInput('');
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
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div
                                className="h-3 w-3 rounded-full flex-shrink-0"
                                style={{ backgroundColor: targetUser.color }}
                            />
                            <DialogTitle className="text-lg">
                                Chat with {targetUser.name}
                            </DialogTitle>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>
                
                <ScrollArea className="flex-1 px-4" ref={scrollAreaRef}>
                    <div className="space-y-4 py-4">
                        {messages.length === 0 ? (
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

