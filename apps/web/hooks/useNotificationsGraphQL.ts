'use client';

/**
 * Hook pour gérer les notifications avec GraphQL.
 * Remplace le hook useNotifications basé sur WebSockets.
 */

import { useState, useEffect } from 'react';
import { useQuery, useSubscription } from '@apollo/client/react';
import { NOTIFICATIONS, UNREAD_NOTIFICATION_COUNT, NOTIFICATION_ADDED, Notification } from '@/lib/graphql/notifications';

export function useNotificationsGraphQL(userId?: string) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  const { data: notificationsData, refetch: refetchNotifications } = useQuery<{ notifications: Notification[] }>(NOTIFICATIONS, {
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Fetch unread count
  const { data: unreadCountData, refetch: refetchUnreadCount } = useQuery<{ unreadNotificationCount: number }>(UNREAD_NOTIFICATION_COUNT, {
    skip: !userId,
    fetchPolicy: 'cache-and-network',
  });

  // Subscribe to new notifications
  const { data: newNotificationData } = useSubscription<{ notificationAdded: Notification }>(NOTIFICATION_ADDED, {
    skip: !userId,
  });

  // Update notifications from query
  useEffect(() => {
    if (notificationsData?.notifications) {
      setNotifications(notificationsData.notifications);
    }
  }, [notificationsData]);

  // Update unread count from query
  useEffect(() => {
    if (unreadCountData?.unreadNotificationCount !== undefined) {
      setUnreadCount(unreadCountData.unreadNotificationCount);
    }
  }, [unreadCountData]);

  // Handle new notification from subscription
  useEffect(() => {
    if (newNotificationData?.notificationAdded) {
      const newNotification = newNotificationData.notificationAdded;
      setNotifications((prev) => [newNotification, ...prev]);
      setUnreadCount((prev) => prev + 1);
    }
  }, [newNotificationData]);

  return {
    notifications,
    unreadCount,
    setNotifications,
    setUnreadCount,
    refetchNotifications,
    refetchUnreadCount,
  };
}

