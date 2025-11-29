import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { AuthGuard } from '@nestjs/passport';
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
        const unread = unreadOnly === 'true';
        return this.notificationsService.getUserNotifications(req.user.userId, unread);
    }

    @Get('unread-count')
    @ApiOperation({ summary: 'Get unread notification count', description: 'Get the count of unread notifications for the authenticated user' })
    @ApiResponse({ status: 200, description: 'Unread count retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getUnreadCount(@Request() req: any) {
        const count = await this.notificationsService.getUnreadCount(req.user.userId);
        return { count };
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
}

