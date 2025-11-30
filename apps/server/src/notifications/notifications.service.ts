import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationSeverity } from '@prisma/client';
import { CollaborationGateway } from '../collaboration/collaboration.gateway';

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
        @Inject(forwardRef(() => CollaborationGateway))
        private collaborationGateway?: CollaborationGateway,
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
        
        // Emit notification via WebSocket if gateway is available
        if (this.collaborationGateway) {
            this.collaborationGateway.emitNotification(data.userId, notification);
        }
        
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

            // Emit notification via WebSocket to all users
            if (this.collaborationGateway) {
                notifications.forEach(notification => {
                    try {
                        this.collaborationGateway!.emitNotification(notification.userId, notification);
                    } catch (error) {
                        this.logger.error(`Failed to emit notification to user ${notification.userId}:`, error);
                    }
                });
            } else {
                this.logger.warn('CollaborationGateway not available, notifications not sent via WebSocket');
            }

            this.logger.log(`Broadcast notification sent to ${notifications.length} users`);
            return { count: notifications.length, notifications };
        } catch (error) {
            this.logger.error('Error in broadcastNotification:', error);
            throw error;
        }
    }
}

