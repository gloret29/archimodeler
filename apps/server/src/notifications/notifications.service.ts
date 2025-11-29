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
        const where: any = { userId };
        if (unreadOnly) {
            where.read = false;
        }

        return this.prisma.notification.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take: 100, // Limit to last 100 notifications
        });
    }

    async getUnreadCount(userId: string): Promise<number> {
        return this.prisma.notification.count({
            where: {
                userId,
                read: false,
            },
        });
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
}

