'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/api/config';

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

export function useNotifications(userId?: string) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!userId) return;

        // Connect to WebSocket
        const newSocket = io(API_CONFIG.wsUrl, API_CONFIG.getSocketIOOptions());

        newSocket.on('connect', () => {
            console.log('Notifications WebSocket connected');
        });

        // Listen for notifications
        newSocket.on(`notification:${userId}`, (notification: Notification) => {
            setNotifications(prev => [notification, ...prev]);
            setUnreadCount(prev => prev + 1);
        });

        setSocket(newSocket);

        return () => {
            newSocket.close();
        };
    }, [userId]);

    return { socket, notifications, unreadCount, setNotifications, setUnreadCount };
}

