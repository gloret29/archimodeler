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
import { useChatContext } from '@/contexts/ChatContext';
import { useNotificationsGraphQL } from '@/hooks/useNotificationsGraphQL';

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
    const [isOpen, setIsOpen] = useState(false);
    const [isBlinking, setIsBlinking] = useState(false);
    const locale = useLocale();
    const { openChat } = useChatContext();

    // Get current user ID
    const [userId, setUserId] = useState<string | null>(null);
    
    useEffect(() => {
        const getCurrentUserId = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (!token) {
                    return null;
                }
                const userData = await api.get<{ id: string }>('/users/me');
                return userData?.id || null;
            } catch (error) {
                console.error('Failed to get current user ID:', error);
                return null;
            }
        };
        
        getCurrentUserId().then(id => setUserId(id || null));
    }, []);

    // Use GraphQL hook for notifications
    const { notifications, unreadCount, setNotifications, setUnreadCount } = useNotificationsGraphQL(userId || undefined);

    // Handle blinking animation for new notifications
    useEffect(() => {
        if (notifications.length > 0) {
            const latestNotification = notifications[0];
            if (latestNotification && !latestNotification.read && latestNotification.type === 'SYSTEM_ALERT') {
                setIsBlinking(true);
                setTimeout(() => setIsBlinking(false), 10000);
            }
        }
    }, [notifications]);

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

