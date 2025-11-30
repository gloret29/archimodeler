import { Injectable, Logger, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CommentTargetType, NotificationType, NotificationSeverity } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { CollaborationGateway } from '../collaboration/collaboration.gateway';

export interface CreateCommentThreadDto {
    targetType: CommentTargetType;
    targetId: string;
    positionX?: number;
    positionY?: number;
    initialComment: string;
}

export interface CreateCommentDto {
    content: string;
    parentId?: string;
    mentions?: string[]; // Array of user IDs
}

export interface ResolveThreadDto {
    resolved: boolean;
}

@Injectable()
export class CommentsService {
    private readonly logger = new Logger(CommentsService.name);

    constructor(
        private prisma: PrismaService,
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => CollaborationGateway))
        private collaborationGateway?: CollaborationGateway,
    ) {}

    /**
     * Create a new comment thread with an initial comment
     */
    async createThread(userId: string, dto: CreateCommentThreadDto) {
        // Extract mentions from the initial comment
        const mentions = await this.extractMentions(dto.initialComment);

        const thread = await this.prisma.commentThread.create({
            data: {
                targetType: dto.targetType,
                targetId: dto.targetId,
                positionX: dto.positionX,
                positionY: dto.positionY,
                comments: {
                    create: {
                        content: dto.initialComment,
                        authorId: userId,
                        mentions: {
                            create: mentions.map(mentionedUserId => ({
                                mentionedUserId,
                            })),
                        },
                    },
                },
            },
            include: {
                comments: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        mentions: {
                            include: {
                                mentionedUser: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
            },
        });

        // Send notifications to mentioned users
        const [targetName, authorName] = await Promise.all([
            this.getTargetName(dto.targetType, dto.targetId),
            this.getAuthorName(userId),
        ]);
        
        const commentPreview = dto.initialComment.length > 100 
            ? dto.initialComment.substring(0, 100) + '...' 
            : dto.initialComment;

        for (const mentionedUserId of mentions) {
            if (mentionedUserId !== userId) {
                await this.notificationsService.createNotification({
                    userId: mentionedUserId,
                    type: NotificationType.COMMENT_MENTION,
                    severity: NotificationSeverity.INFO,
                    title: `${authorName} mentioned you in a comment`,
                    message: `${authorName} mentioned you in a comment on "${targetName}": "${commentPreview}"`,
                    metadata: {
                        threadId: thread.id,
                        targetType: dto.targetType,
                        targetId: dto.targetId,
                        targetName,
                        authorId: userId,
                        authorName,
                        commentPreview: dto.initialComment,
                    },
                });
            }
        }

        // Emit via WebSocket if available
        if (this.collaborationGateway) {
            this.collaborationGateway.emitCommentCreated(thread);
        }

        return thread;
    }

    /**
     * Get all threads for a specific target (element, relationship, or view)
     */
    async getThreads(targetType: CommentTargetType, targetId: string) {
        return await this.prisma.commentThread.findMany({
            where: {
                targetType,
                targetId,
            },
            include: {
                comments: {
                    where: {
                        deletedAt: null,
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        mentions: {
                            include: {
                                mentionedUser: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        replies: {
                            where: {
                                deletedAt: null,
                            },
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                resolvedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
    }

    /**
     * Get a single thread by ID
     */
    async getThread(threadId: string) {
        return await this.prisma.commentThread.findUnique({
            where: { id: threadId },
            include: {
                comments: {
                    where: {
                        deletedAt: null,
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                        mentions: {
                            include: {
                                mentionedUser: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                        replies: {
                            where: {
                                deletedAt: null,
                            },
                            include: {
                                author: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                    },
                                },
                            },
                            orderBy: {
                                createdAt: 'asc',
                            },
                        },
                    },
                    orderBy: {
                        createdAt: 'asc',
                    },
                },
                resolvedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });
    }

    /**
     * Add a comment to an existing thread
     */
    async addComment(userId: string, threadId: string, dto: CreateCommentDto) {
        const thread = await this.prisma.commentThread.findUnique({
            where: { id: threadId },
            include: {
                comments: {
                    select: {
                        authorId: true,
                    },
                },
            },
        });

        if (!thread) {
            throw new Error('Thread not found');
        }

        // Extract mentions from the comment
        const mentions = dto.mentions || await this.extractMentions(dto.content);

        const comment = await this.prisma.comment.create({
            data: {
                content: dto.content,
                threadId,
                authorId: userId,
                parentId: dto.parentId,
                mentions: {
                    create: mentions.map(mentionedUserId => ({
                        mentionedUserId,
                    })),
                },
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                mentions: {
                    include: {
                        mentionedUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                parent: {
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        // Send notifications
        // Get context for notifications
        const [targetName, authorName] = await Promise.all([
            this.getTargetName(thread.targetType, thread.targetId),
            this.getAuthorName(userId),
        ]);
        
        const commentPreview = dto.content.length > 100 
            ? dto.content.substring(0, 100) + '...' 
            : dto.content;

        // Notify mentioned users
        for (const mentionedUserId of mentions) {
            if (mentionedUserId !== userId) {
                await this.notificationsService.createNotification({
                    userId: mentionedUserId,
                    type: NotificationType.COMMENT_MENTION,
                    severity: NotificationSeverity.INFO,
                    title: `${authorName} mentioned you in a comment`,
                    message: `${authorName} mentioned you in a comment on "${targetName}": "${commentPreview}"`,
                    metadata: {
                        threadId,
                        commentId: comment.id,
                        targetType: thread.targetType,
                        targetId: thread.targetId,
                        targetName,
                        authorId: userId,
                        authorName,
                        commentPreview: dto.content,
                    },
                });
            }
        }

        // Notify parent comment author if this is a reply
        if (dto.parentId && comment.parent) {
            const parentAuthorId = comment.parent.authorId;
            if (parentAuthorId !== userId) {
                await this.notificationsService.createNotification({
                    userId: parentAuthorId,
                    type: NotificationType.COMMENT_REPLY,
                    severity: NotificationSeverity.INFO,
                    title: 'New reply to your comment',
                    message: `Someone replied to your comment`,
                    metadata: {
                        threadId,
                        commentId: comment.id,
                        parentCommentId: dto.parentId,
                        targetType: thread.targetType,
                        targetId: thread.targetId,
                        authorId: userId,
                    },
                });
            }
        }

        // Notify all other participants in the thread (except the author and already notified users)
        const participantIds = new Set(
            thread.comments
                .map(c => c.authorId)
                .filter(id => id !== userId && !mentions.includes(id))
        );
        
        if (dto.parentId && comment.parent) {
            participantIds.delete(comment.parent.authorId); // Already notified above
        }

        for (const participantId of participantIds) {
            await this.notificationsService.createNotification({
                userId: participantId,
                type: NotificationType.COMMENT_REPLY,
                severity: NotificationSeverity.INFO,
                title: 'New comment in thread',
                message: `A new comment was added to a thread you're following`,
                metadata: {
                    threadId,
                    commentId: comment.id,
                    targetType: thread.targetType,
                    targetId: thread.targetId,
                    authorId: userId,
                },
            });
        }

        // Emit via WebSocket if available
        if (this.collaborationGateway) {
            this.collaborationGateway.emitCommentAdded(threadId, comment);
        }

        return comment;
    }

    /**
     * Update a comment
     */
    async updateComment(userId: string, commentId: string, content: string) {
        // Verify ownership
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new Error('Unauthorized: You can only edit your own comments');
        }

        // Extract new mentions
        const newMentions = await this.extractMentions(content);
        const oldMentions = await this.prisma.commentMention.findMany({
            where: { commentId },
            select: { mentionedUserId: true },
        });
        const oldMentionIds = oldMentions.map(m => m.mentionedUserId);

        // Remove old mentions
        await this.prisma.commentMention.deleteMany({
            where: { commentId },
        });

        // Add new mentions
        await this.prisma.commentMention.createMany({
            data: newMentions.map(mentionedUserId => ({
                commentId,
                mentionedUserId,
            })),
        });

        // Get thread for context
        const thread = await this.prisma.commentThread.findUnique({
            where: { id: comment.threadId },
            select: {
                targetType: true,
                targetId: true,
            },
        });

        if (thread) {
            // Get context for notifications
            const [targetName, authorName] = await Promise.all([
                this.getTargetName(thread.targetType, thread.targetId),
                this.getAuthorName(userId),
            ]);
            
            const commentPreview = content.length > 100 
                ? content.substring(0, 100) + '...' 
                : content;

            // Notify newly mentioned users
            for (const mentionedUserId of newMentions) {
                if (!oldMentionIds.includes(mentionedUserId) && mentionedUserId !== userId) {
                    await this.notificationsService.createNotification({
                        userId: mentionedUserId,
                        type: NotificationType.COMMENT_MENTION,
                        severity: NotificationSeverity.INFO,
                        title: `${authorName} mentioned you in a comment`,
                        message: `${authorName} mentioned you in a comment on "${targetName}": "${commentPreview}"`,
                        metadata: {
                            commentId,
                            threadId: comment.threadId,
                            targetType: thread.targetType,
                            targetId: thread.targetId,
                            targetName,
                            authorId: userId,
                            authorName,
                            commentPreview: content,
                        },
                    });
                }
            }
        }

        return await this.prisma.comment.update({
            where: { id: commentId },
            data: {
                content,
                updatedAt: new Date(),
            },
            include: {
                author: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
                mentions: {
                    include: {
                        mentionedUser: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });
    }

    /**
     * Delete a comment (soft delete)
     */
    async deleteComment(userId: string, commentId: string) {
        const comment = await this.prisma.comment.findUnique({
            where: { id: commentId },
        });

        if (!comment) {
            throw new Error('Comment not found');
        }

        if (comment.authorId !== userId) {
            throw new Error('Unauthorized: You can only delete your own comments');
        }

        return await this.prisma.comment.update({
            where: { id: commentId },
            data: {
                deletedAt: new Date(),
            },
        });
    }

    /**
     * Resolve or unresolve a thread
     */
    async resolveThread(userId: string, threadId: string, dto: ResolveThreadDto) {
        const thread = await this.prisma.commentThread.findUnique({
            where: { id: threadId },
            include: {
                comments: {
                    select: {
                        authorId: true,
                    },
                },
            },
        });

        if (!thread) {
            throw new Error('Thread not found');
        }

        const updatedThread = await this.prisma.commentThread.update({
            where: { id: threadId },
            data: {
                resolved: dto.resolved,
                resolvedAt: dto.resolved ? new Date() : null,
                resolvedById: dto.resolved ? userId : null,
            },
            include: {
                comments: {
                    where: {
                        deletedAt: null,
                    },
                    include: {
                        author: {
                            select: {
                                id: true,
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
                resolvedBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        // Notify all participants when thread is resolved
        if (dto.resolved) {
            const participantIds = new Set(thread.comments.map(c => c.authorId));
            participantIds.delete(userId); // Don't notify the resolver

            for (const participantId of participantIds) {
                await this.notificationsService.createNotification({
                    userId: participantId,
                    type: NotificationType.COMMENT_RESOLVED,
                    severity: NotificationSeverity.SUCCESS,
                    title: 'Comment thread resolved',
                    message: `A comment thread you participated in has been marked as resolved`,
                    metadata: {
                        threadId,
                        targetType: thread.targetType,
                        targetId: thread.targetId,
                        resolvedById: userId,
                    },
                });
            }
        }

        // Emit via WebSocket if available
        if (this.collaborationGateway) {
            this.collaborationGateway.emitThreadResolved(threadId, dto.resolved);
        }

        return updatedThread;
    }

    /**
     * Extract user mentions from text (@username or @email)
     * Returns array of user IDs
     */
    private async extractMentions(text: string): Promise<string[]> {
        // Match @username or @email patterns
        const mentionPattern = /@(\w+@?\w*\.?\w*)/g;
        const matches = text.matchAll(mentionPattern);
        const mentions: string[] = [];

        for (const match of matches) {
            const identifier = match[1];
            // Try to find user by email or name
            const user = await this.prisma.user.findFirst({
                where: {
                    OR: [
                        { email: identifier },
                        { name: identifier },
                    ],
                },
                select: { id: true },
            });

            if (user) {
                mentions.push(user.id);
            }
        }

        return [...new Set(mentions)]; // Remove duplicates
    }
}

