import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Request, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { CommentsService } from './comments.service';
import type { CreateCommentThreadDto, CreateCommentDto, ResolveThreadDto } from './comments.service';
import { AuthGuard } from '@nestjs/passport';
import { CommentTargetType } from '@prisma/client';

/**
 * Controller pour la gestion des commentaires et annotations.
 * 
 * Expose les endpoints REST pour créer, lire, modifier et supprimer des commentaires.
 * Tous les endpoints nécessitent une authentification JWT.
 * 
 * @class CommentsController
 * @example
 * // Créer un thread
 * POST /comments/threads
 * Body: { targetType: 'ELEMENT', targetId: 'elem-123', initialComment: '...' }
 */
@ApiTags('Comments')
@Controller('comments')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class CommentsController {
    constructor(private readonly commentsService: CommentsService) {}

    @Post('threads')
    @ApiOperation({ summary: 'Create a new comment thread', description: 'Create a new comment thread with an initial comment' })
    @ApiResponse({ status: 201, description: 'Thread created successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async createThread(@Request() req: any, @Body() dto: CreateCommentThreadDto) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.createThread(userId, dto);
        } catch (error) {
            console.error('Error creating thread:', error);
            throw new HttpException(
                error.message || 'Failed to create thread',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('threads')
    @ApiOperation({ summary: 'Get comment threads', description: 'Get all comment threads for a specific target' })
    @ApiQuery({ name: 'targetType', required: true, enum: CommentTargetType, description: 'Type of target (ELEMENT, RELATIONSHIP, VIEW)' })
    @ApiQuery({ name: 'targetId', required: true, type: String, description: 'ID of the target' })
    @ApiResponse({ status: 200, description: 'Threads retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getThreads(
        @Request() req: any,
        @Query('targetType') targetType: CommentTargetType,
        @Query('targetId') targetId: string
    ) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.getThreads(targetType, targetId);
        } catch (error) {
            console.error('Error getting threads:', error);
            throw new HttpException(
                'Failed to get threads',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Get('threads/:threadId')
    @ApiOperation({ summary: 'Get a single thread', description: 'Get a comment thread by ID' })
    @ApiParam({ name: 'threadId', type: String, description: 'Thread ID' })
    @ApiResponse({ status: 200, description: 'Thread retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Thread not found' })
    async getThread(@Request() req: any, @Param('threadId') threadId: string) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.getThread(threadId);
        } catch (error) {
            console.error('Error getting thread:', error);
            throw new HttpException(
                error.message || 'Failed to get thread',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Post('threads/:threadId/comments')
    @ApiOperation({ summary: 'Add a comment to a thread', description: 'Add a new comment to an existing thread' })
    @ApiParam({ name: 'threadId', type: String, description: 'Thread ID' })
    @ApiResponse({ status: 201, description: 'Comment added successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Thread not found' })
    async addComment(
        @Request() req: any,
        @Param('threadId') threadId: string,
        @Body() dto: CreateCommentDto
    ) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.addComment(userId, threadId, dto);
        } catch (error) {
            console.error('Error adding comment:', error);
            throw new HttpException(
                error.message || 'Failed to add comment',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put('comments/:commentId')
    @ApiOperation({ summary: 'Update a comment', description: 'Update an existing comment' })
    @ApiParam({ name: 'commentId', type: String, description: 'Comment ID' })
    @ApiResponse({ status: 200, description: 'Comment updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - You can only edit your own comments' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    async updateComment(
        @Request() req: any,
        @Param('commentId') commentId: string,
        @Body('content') content: string
    ) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.updateComment(userId, commentId, content);
        } catch (error) {
            console.error('Error updating comment:', error);
            throw new HttpException(
                error.message || 'Failed to update comment',
                error.message?.includes('Unauthorized') ? HttpStatus.FORBIDDEN : HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Delete('comments/:commentId')
    @ApiOperation({ summary: 'Delete a comment', description: 'Soft delete a comment' })
    @ApiParam({ name: 'commentId', type: String, description: 'Comment ID' })
    @ApiResponse({ status: 200, description: 'Comment deleted successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - You can only delete your own comments' })
    @ApiResponse({ status: 404, description: 'Comment not found' })
    async deleteComment(@Request() req: any, @Param('commentId') commentId: string) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.deleteComment(userId, commentId);
        } catch (error) {
            console.error('Error deleting comment:', error);
            throw new HttpException(
                error.message || 'Failed to delete comment',
                error.message?.includes('Unauthorized') ? HttpStatus.FORBIDDEN : HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }

    @Put('threads/:threadId/resolve')
    @ApiOperation({ summary: 'Resolve or unresolve a thread', description: 'Mark a comment thread as resolved or unresolved' })
    @ApiParam({ name: 'threadId', type: String, description: 'Thread ID' })
    @ApiResponse({ status: 200, description: 'Thread resolution status updated successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 404, description: 'Thread not found' })
    async resolveThread(
        @Request() req: any,
        @Param('threadId') threadId: string,
        @Body() dto: ResolveThreadDto
    ) {
        const userId = req.user?.userId;
        if (!userId) {
            throw new HttpException('User ID not found in request', HttpStatus.UNAUTHORIZED);
        }
        try {
            return await this.commentsService.resolveThread(userId, threadId, dto);
        } catch (error) {
            console.error('Error resolving thread:', error);
            throw new HttpException(
                error.message || 'Failed to resolve thread',
                HttpStatus.INTERNAL_SERVER_ERROR
            );
        }
    }
}

