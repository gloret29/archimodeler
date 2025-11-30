import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { NotificationType, NotificationSeverity } from '@prisma/client';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}

    @Get()
    @ApiOperation({ summary: 'Get user notifications', description: 'Retrieve all notifications for the authenticated user' })
    @ApiQuery({ name: 'unreadOnly', required: false, type: Boolean, description: 'Filter to show only unread notifications' })
    @ApiResponse({ status: 200, description: 'Notifications retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUserNotifications(@Request() req: any, @Query('unreadOnly') unreadOnly?: string) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            const unread = unreadOnly === 'true';
            return await this.notificationsService.getUserNotifications(userId, unread);
        } catch (error) {
            console.error('Error getting user notifications:', error);
            throw new HttpException(
                'Failed to get user notifications',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count', description: 'Get the count of unread notifications for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUnreadCount(@Request() req: any) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            const count = await this.notificationsService.getUnreadCount(userId);
            return { count };
        } catch (error) {
            console.error('Error getting unread count:', error);
            throw new HttpException(
                'Failed to get unread count',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put(':id/read')
    @ApiOperation({ summary: 'Mark notification as read', description: 'Mark a specific notification as read' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'Notification marked as read' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async markAsRead(@Request() req: any, @Param('id') id: string) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }

    @Put('read-all')
    @ApiOperation({ summary: 'Mark all notifications as read', description: 'Mark all notifications as read for the authenticated user' })
    @ApiResponse({ status: 200, description: 'All notifications marked as read' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async markAllAsRead(@Request() req: any) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete notification', description: 'Delete a specific notification' })
    @ApiParam({ name: 'id', description: 'Notification ID' })
    @ApiResponse({ status: 200, description: 'Notification deleted successfully' })
    @ApiResponse({ status: 404, description: 'Notification not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteNotification(@Request() req: any, @Param('id') id: string) {
        return this.notificationsService.deleteNotification(id, req.user.userId);
    }

    @Delete('read/all')
    @ApiOperation({ summary: 'Delete all read notifications', description: 'Delete all read notifications for the authenticated user' })
    @ApiResponse({ status: 200, description: 'All read notifications deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async deleteAllRead(@Request() req: any) {
        return this.notificationsService.deleteAllRead(req.user.userId);
    }

    @Post('broadcast')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Broadcast notification to all users', description: 'Send a notification to all users in the platform (Admin only)' })
    @ApiResponse({ status: 201, description: 'Notification broadcasted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
    async broadcastNotification(
        @Request() req: any,
        @Body() body: {
            title: string;
            message: string;
            severity?: NotificationSeverity;
            metadata?: any;
        }
    ) {
        try {
            if (!body.title || !body.message) {
                throw new HttpException(
                    'Title and message are required',
                    HttpStatus.BAD_REQUEST
                );
            }

            const result = await this.notificationsService.broadcastNotification({
                type: NotificationType.SYSTEM_ALERT,
                severity: body.severity || NotificationSeverity.INFO,
                title: body.title.trim(),
                message: body.message.trim(),
                metadata: body.metadata || {},
            });

            return result;
        } catch (error) {
            console.error('Error broadcasting notification:', error);
            if (error instanceof HttpException) {
                throw error;
            }
            throw new HttpException(
                error.message || 'Failed to broadcast notification',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

