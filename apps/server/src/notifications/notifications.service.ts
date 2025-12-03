import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationSeverity } from '@prisma/client';
import { GraphQLPubSub } from '../graphql/pubsub';

export interface CreateNotificationDto {
    userId: string;
    type: NotificationType;
    severity?: NotificationSeverity;
    title: string;
    message: string;
    metadata?: any;
}

@Injectable()
export class NotificationsService {
    private readonly logger = new Logger(NotificationsService.name);

    constructor(
        private prisma: PrismaService,
        private pubSub: GraphQLPubSub,
    ) {}

    async createNotification(data: CreateNotificationDto) {
        const notification = await this.prisma.notification.create({
            data: {
                userId: data.userId,
                type: data.type,
                severity: data.severity || NotificationSeverity.INFO,
                title: data.title,
                message: data.message,
                metadata: data.metadata || {},
            },
        });

        this.logger.log(`Notification created: ${notification.id} for user ${data.userId}`);
        
        // Emit notification via GraphQL PubSub
        await this.pubSub.publish('notification-added', {
            notificationAdded: {
                userId: data.userId,
                notification: {
                    id: notification.id,
                    type: notification.type,
                    severity: notification.severity,
                    title: notification.title,
                    message: notification.message,
                    read: notification.read,
                    createdAt: notification.createdAt.toISOString(),
                    metadata: notification.metadata,
                },
            },
        });
        
        return notification;
    }

    async getUserNotifications(userId: string, unreadOnly: boolean = false) {
        if (!userId) {
            this.logger.error('getUserNotifications called with null/undefined userId');
            return [];
        }
        try {
            const where: any = { userId };
            if (unreadOnly) {
                where.read = false;
            }

            return await this.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: 100, // Limit to last 100 notifications
            });
        } catch (error) {
            this.logger.error(`Error fetching notifications for user ${userId}:`, error);
            throw error;
        }
    }

    async getUnreadCount(userId: string): Promise<number> {
        if (!userId) {
            this.logger.error('getUnreadCount called with null/undefined userId');
            return 0;
        }
        try {
            return await this.prisma.notification.count({
                where: {
                    userId,
                    read: false,
                },
            });
        } catch (error) {
            this.logger.error(`Error counting unread notifications for user ${userId}:`, error);
            throw error;
        }
    }

    async markAsRead(notificationId: string, userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                id: notificationId,
                userId, // Ensure user can only mark their own notifications as read
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
    }

    async markAllAsRead(userId: string) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                read: false,
            },
            data: {
                read: true,
                readAt: new Date(),
            },
        });
    }

    async deleteNotification(notificationId: string, userId: string) {
        return this.prisma.notification.deleteMany({
            where: {
                id: notificationId,
                userId, // Ensure user can only delete their own notifications
            },
        });
    }

    async deleteAllRead(userId: string) {
        return this.prisma.notification.deleteMany({
            where: {
                userId,
                read: true,
            },
        });
    }

    /**
     * Send a notification to all users in the platform
     * Used for system-wide announcements
     */
    async broadcastNotification(data: {
        type: NotificationType;
        severity?: NotificationSeverity;
        title: string;
        message: string;
        metadata?: any;
    }) {
        try {
            // Get all users
            const users = await this.prisma.user.findMany({
                select: { id: true },
            });

            if (users.length === 0) {
                this.logger.warn('No users found in database for broadcast');
                return { count: 0, notifications: [] };
            }

            this.logger.log(`Broadcasting notification to ${users.length} users`);

            // Create notification for each user
            const notifications = await Promise.all(
                users.map(async (user) => {
                    try {
                        return await this.prisma.notification.create({
                            data: {
                                userId: user.id,
                                type: data.type,
                                severity: data.severity || NotificationSeverity.INFO,
                                title: data.title,
                                message: data.message,
                                metadata: data.metadata || {},
                            },
                        });
                    } catch (error) {
                        this.logger.error(`Failed to create notification for user ${user.id}:`, error);
                        throw error;
                    }
                })
            );

            // Emit notifications via GraphQL PubSub
            for (const notification of notifications) {
                try {
                    await this.pubSub.publish('notification-added', {
                        notificationAdded: {
                            userId: notification.userId,
                            notification,
                        },
                    });
                } catch (error) {
                    this.logger.error(`Failed to emit notification to user ${notification.userId}:`, error);
                }
            }

            this.logger.log(`Broadcast notification sent to ${notifications.length} users`);
            return { count: notifications.length, notifications };
        } catch (error) {
            this.logger.error('Error in broadcastNotification:', error);
            throw error;
        }
    }
}

