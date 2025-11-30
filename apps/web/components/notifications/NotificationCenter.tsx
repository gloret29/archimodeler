'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, Check, CheckCheck, Trash2, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/api/config';
import { useChatContext } from '@/contexts/ChatContext';

interface Notification {
    id: string;
    type: string;
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
    title: string;
    message: string;
    read: boolean;
    createdAt: string;
    metadata?: any;
}

const severityColors = {
    INFO: 'bg-blue-500',
    WARNING: 'bg-yellow-500',
    ERROR: 'bg-red-500',
    SUCCESS: 'bg-green-500',
};

const severityIcons = {
    INFO: 'ℹ️',
    WARNING: '⚠️',
    ERROR: '❌',
    SUCCESS: '✅',
};

export function NotificationCenter() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isBlinking, setIsBlinking] = useState(false);
    const locale = useLocale();
    const socketRef = useRef<Socket | null>(null);
    const userIdRef = useRef<string | null>(null);
    const { openChat } = useChatContext();

    const fetchNotifications = async () => {
        try {
            // Vérifier si l'utilisateur est connecté avant de faire l'appel
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token) {
                setNotifications([]);
                return;
            }

            const data = await api.get('/notifications');
            // Update notifications, preserving any real-time notifications that might not be in the API response yet
            setNotifications(prev => {
                const newNotifications = data || [];
                // Merge with existing notifications, avoiding duplicates
                const existingIds = new Set(newNotifications.map((n: Notification) => n.id));
                const additionalNotifications = prev.filter(n => !existingIds.has(n.id));
                return [...newNotifications, ...additionalNotifications].sort((a, b) => 
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            });
        } catch (error: any) {
            // Ne logger que si ce n'est pas une erreur d'authentification attendue (401 ou 500 si userId manquant)
            if (error.status !== 401 && error.status !== 500) {
                console.error('Failed to fetch notifications:', error);
            }
            // Don't clear notifications on error, keep existing ones
        }
    };

    const fetchUnreadCount = async () => {
        try {
            // Vérifier si l'utilisateur est connecté avant de faire l'appel
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token) {
                setUnreadCount(0);
                return;
            }

            const data = await api.get('/notifications/unread-count');
            setUnreadCount(data.count || 0);
        } catch (error: any) {
            // Ne logger que si ce n'est pas une erreur d'authentification attendue (401 ou 500 si userId manquant)
            if (error.status !== 401 && error.status !== 500) {
                console.error('Failed to fetch unread count:', error);
            }
            setUnreadCount(0);
        }
    };

    // Get current user ID from API
    useEffect(() => {
        const getCurrentUserId = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (!token) {
                    return null;
                }
                const userData = await api.get('/users/me');
                return userData?.id || null;
            } catch (error) {
                console.error('Failed to get current user ID:', error);
                return null;
            }
        };

        const setupWebSocket = async () => {
            const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
            if (!token) {
                setNotifications([]);
                setUnreadCount(0);
                return;
            }

            // Get user ID
            const userId = await getCurrentUserId();
            if (!userId) {
                return;
            }
            userIdRef.current = userId;

            // Fetch initial notifications
            fetchNotifications();
            fetchUnreadCount();

            // Connect to WebSocket for real-time notifications
            const socket = io(API_CONFIG.wsUrl, {
                transports: ['websocket'],
                reconnection: true,
                reconnectionDelay: 1000,
                reconnectionAttempts: 5,
            });

            socket.on('connect', () => {
                console.log('Notification WebSocket connected');
                // Join user-specific notification room
                socket.emit('join-notifications', { userId });
            });

            // Listen for real-time notifications
            socket.on(`notification:${userId}`, (notification: Notification) => {
                console.log('Received real-time notification:', notification);
                // Add notification to the list
                setNotifications(prev => {
                    // Check if notification already exists (avoid duplicates)
                    const exists = prev.some(n => n.id === notification.id);
                    if (exists) {
                        return prev;
                    }
                    // Add new notification at the beginning
                    return [notification, ...prev];
                });
                // Update unread count
                if (!notification.read) {
                    setUnreadCount(prev => prev + 1);
                    // Trigger blinking animation for system alerts
                    if (notification.type === 'SYSTEM_ALERT') {
                        setIsBlinking(true);
                        // Stop blinking after 10 seconds
                        setTimeout(() => setIsBlinking(false), 10000);
                    }
                }
                // Refresh notifications to ensure consistency (but don't duplicate)
                setTimeout(() => {
                    fetchNotifications();
                    fetchUnreadCount();
                }, 500);
            });

            socket.on('disconnect', () => {
                console.log('Notification WebSocket disconnected');
            });

            socket.on('connect_error', (error) => {
                console.error('Notification WebSocket connection error:', error);
            });

            socketRef.current = socket;

            // Poll for updates every 30 seconds as backup
            const interval = setInterval(() => {
                const currentToken = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (currentToken) {
                    fetchNotifications();
                    fetchUnreadCount();
                }
            }, 30000);

            return () => {
                clearInterval(interval);
                if (socket) {
                    socket.disconnect();
                }
            };
        };

        const cleanup = setupWebSocket();

        return () => {
            cleanup.then(cleanupFn => {
                if (cleanupFn) cleanupFn();
            });
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    const markAsRead = async (id: string) => {
        try {
            await api.put(`/notifications/${id}/read`, {});
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await api.put('/notifications/read-all', {});
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    };

    const deleteNotification = async (id: string) => {
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n.id !== id));
            // Update unread count if it was unread
            const notification = notifications.find(n => n.id === id);
            if (notification && !notification.read) {
                setUnreadCount(prev => Math.max(0, prev - 1));
            }
        } catch (error) {
            console.error('Failed to delete notification:', error);
        }
    };

    const deleteAllRead = async () => {
        try {
            await api.delete('/notifications/read/all');
            setNotifications(prev => prev.filter(n => !n.read));
        } catch (error) {
            console.error('Failed to delete all read:', error);
        }
    };

    const handleOpenChat = (notification: Notification) => {
        if (notification.type === 'CHAT_MESSAGE' && notification.metadata) {
            const { from, fromName } = notification.metadata;
            if (from) {
                // Generate a color for the user if not provided
                const colors = ['#4ECDC4', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3', '#A8E6CF'];
                const colorIndex = from.charCodeAt(0) % colors.length;
                const userColor = colors[colorIndex];
                
                openChat(from, fromName || 'User', userColor);
                // Close the notification popover
                setIsOpen(false);
            }
        }
    };


    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className={`h-5 w-5 ${isBlinking ? 'animate-pulse' : ''}`} />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-96 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex gap-2">
                        {unreadCount > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={markAllAsRead}
                                className="h-8 text-xs"
                            >
                                <CheckCheck className="h-3 w-3 mr-1" />
                                Mark all read
                            </Button>
                        )}
                        {notifications.some(n => n.read) && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={deleteAllRead}
                                className="h-8 text-xs"
                            >
                                <Trash2 className="h-3 w-3 mr-1" />
                                Clear read
                            </Button>
                        )}
                    </div>
                </div>
                <ScrollArea className="h-[400px]">
                    {notifications.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            No notifications
                        </div>
                    ) : (
                        <div className="divide-y">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={cn(
                                        "p-4 hover:bg-accent transition-colors",
                                        !notification.read && "bg-accent/50"
                                    )}
                                >
                                    <div className="flex items-start gap-3">
                                        <div className={cn(
                                            "w-2 h-2 rounded-full mt-2 flex-shrink-0",
                                            severityColors[notification.severity]
                                        )} />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="flex-1">
                                                    <p className="font-medium text-sm">
                                                        {notification.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {notification.message}
                                                    </p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {new Date(notification.createdAt).toLocaleString(locale === 'fr' ? 'fr-FR' : 'en-US', {
                                                            day: 'numeric',
                                                            month: 'short',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}
                                                    </p>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0">
                                                    {notification.type === 'CHAT_MESSAGE' && notification.metadata?.from && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => handleOpenChat(notification)}
                                                            title="Ouvrir le chat"
                                                        >
                                                            <MessageCircle className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    {!notification.read && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6"
                                                            onClick={() => markAsRead(notification.id)}
                                                        >
                                                            <Check className="h-3 w-3" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-6 w-6"
                                                        onClick={() => deleteNotification(notification.id)}
                                                    >
                                                        <X className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </PopoverContent>
        </Popover>
    );
}

