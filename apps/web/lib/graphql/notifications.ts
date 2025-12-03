import { gql } from '@apollo/client';

// Types
export interface Notification {
  id: string;
  type: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  metadata?: any;
}

// Queries
export const NOTIFICATIONS = gql`
  query Notifications {
    notifications {
      id
      type
      severity
      title
      message
      read
      createdAt
      metadata
    }
  }
`;

export const UNREAD_NOTIFICATION_COUNT = gql`
  query UnreadNotificationCount {
    unreadNotificationCount
  }
`;

// Subscriptions
export const NOTIFICATION_ADDED = gql`
  subscription NotificationAdded {
    notificationAdded {
      id
      type
      severity
      title
      message
      read
      createdAt
      metadata
    }
  }
`;




