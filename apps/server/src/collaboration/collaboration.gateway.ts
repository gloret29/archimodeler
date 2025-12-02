import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    OnGatewayConnection,
    OnGatewayDisconnect,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';
import { UsersService } from '../users/users.service';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType, NotificationSeverity } from '@prisma/client';

interface User {
    id: string;
    name: string;
    color: string;
}

interface CursorPosition {
    x: number;
    y: number;
}

interface ViewSession {
    viewId: string;
    users: Map<string, User>;
    cursors: Map<string, CursorPosition>;
}

@WebSocketGateway({
    cors: {
        origin: '*',
    },
    namespace: '/collaboration', // Namespace avec slash initial (requis par Socket.io)
    // Note: Le path '/socket.io/' est configuré au niveau de l'adapter (SocketIOAdapter)
    // Socket.io construira automatiquement le chemin: /collaboration/socket.io/
})
export class CollaborationGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CollaborationGateway.name);
    private viewSessions: Map<string, ViewSession> = new Map();
    private notificationRooms: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds

    constructor(
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService,
        private prisma: PrismaService,
    ) {
        // Log pour vérifier que le gateway est initialisé
        this.logger.log('CollaborationGateway initialized with namespace: collaboration');
    }

    handleConnection(client: Socket) {
        this.logger.log(`Client connected to collaboration namespace: ${client.id}`);
    }

    @SubscribeMessage('join-notifications')
    handleJoinNotifications(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string },
    ) {
        const { userId } = data;
        if (!userId) {
            this.logger.warn('join-notifications called without userId');
            return;
        }

        // Create room for user notifications
        const room = `notifications:${userId}`;
        client.join(room);
        
        // Track which sockets are listening for this user's notifications
        if (!this.notificationRooms.has(userId)) {
            this.notificationRooms.set(userId, new Set());
        }
        this.notificationRooms.get(userId)!.add(client.id);
        
        this.logger.log(`Client ${client.id} joined notification room for user ${userId}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected from collaboration namespace: ${client.id}`);
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove user from all view sessions
        this.viewSessions.forEach((session, viewId) => {
            if (session.users.has(client.id)) {
                session.users.delete(client.id);
                session.cursors.delete(client.id);

                // Filter out users with invalid names before sending
                const validUsers = Array.from(session.users.values()).filter(u => 
                    u.name && 
                    u.name.trim() !== '' && 
                    u.name !== 'User' && 
                    !u.name.startsWith('User ') &&
                    u.id &&
                    u.id !== '' &&
                    !u.id.startsWith('User ')
                );

                // Notify other users in the view
                this.server.to(viewId).emit('user-left', {
                    userId: client.id,
                    users: validUsers,
                });

                // Clean up empty sessions
                if (session.users.size === 0) {
                    this.viewSessions.delete(viewId);
                }
            }
        });

        // Remove client from notification rooms
        this.notificationRooms.forEach((socketIds, userId) => {
            socketIds.delete(client.id);
            if (socketIds.size === 0) {
                this.notificationRooms.delete(userId);
            }
        });
    }

    @SubscribeMessage('join-view')
    async handleJoinView(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; user: User },
    ) {
        const { viewId, user } = data;

        // Enrich user with name from database if missing or empty
        let enrichedUser = { ...user };
        if (!enrichedUser.name || enrichedUser.name.trim() === '' || enrichedUser.name === 'User' || enrichedUser.name.startsWith('User ')) {
            // Only try to fetch if the ID looks like a valid UUID or database ID
            if (user.id && user.id.length > 10 && !user.id.startsWith('User ')) {
                try {
                    const dbUser = await this.usersService.findById(user.id);
                    if (dbUser) {
                        enrichedUser.name = dbUser.name || dbUser.email || 'User';
                    } else {
                        // User not found in database, reject the connection
                        this.logger.warn(`User ${user.id} not found in database, rejecting join`);
                        client.emit('error', { message: 'User not found' });
                        return;
                    }
                } catch (error) {
                    this.logger.warn(`Failed to fetch user ${user.id} from database: ${error}`);
                    client.emit('error', { message: 'Failed to verify user' });
                    return;
                }
            } else {
                // Invalid user ID, reject the connection
                this.logger.warn(`Invalid user ID ${user.id}, rejecting join`);
                client.emit('error', { message: 'Invalid user ID' });
                return;
            }
        }
        
        // Final check: reject if name is still invalid
        if (!enrichedUser.name || enrichedUser.name.trim() === '' || enrichedUser.name === 'User' || enrichedUser.name.startsWith('User ')) {
            this.logger.warn(`User ${user.id} has invalid name "${enrichedUser.name}", rejecting join`);
            client.emit('error', { message: 'Invalid user name' });
            return;
        }

        // Leave previous rooms
        const rooms = Array.from(client.rooms);
        rooms.forEach((room) => {
            if (room !== client.id) {
                client.leave(room);
            }
        });

        // Join new room
        client.join(viewId);

        // Initialize session if it doesn't exist
        if (!this.viewSessions.has(viewId)) {
            this.viewSessions.set(viewId, {
                viewId,
                users: new Map(),
                cursors: new Map(),
            });
        }

        const session = this.viewSessions.get(viewId);
        if (!session) {
            this.logger.error(`Session not found for view ${viewId}`);
            return;
        }

        session.users.set(client.id, enrichedUser);

        // Enrich all users in the session with names from database
        const enrichedUsersMap = new Map<string, User>();
        for (const [clientId, u] of session.users.entries()) {
            let enriched = u;
            if (!u.name || u.name.trim() === '' || u.name === 'User' || u.name.startsWith('User ')) {
                try {
                    // Only try to fetch if the ID looks like a valid UUID or database ID
                    if (u.id && u.id.length > 10 && !u.id.startsWith('User ')) {
                        const dbUser = await this.usersService.findById(u.id);
                        if (dbUser) {
                            enriched = { ...u, name: dbUser.name || dbUser.email || 'User' };
                            session.users.set(clientId, enriched);
                        } else {
                            // User not found in database, remove from session
                            this.logger.warn(`User ${u.id} not found in database, removing from session`);
                            session.users.delete(clientId);
                            continue;
                        }
                    } else {
                        // Invalid user ID, remove from session
                        this.logger.warn(`Invalid user ID ${u.id}, removing from session`);
                        session.users.delete(clientId);
                        continue;
                    }
                } catch (error) {
                    this.logger.warn(`Failed to fetch user ${u.id} from database: ${error}`);
                    // Remove user if we can't fetch it
                    session.users.delete(clientId);
                    continue;
                }
            }
            // Only add users with valid names (not generic "User" or "User XXX")
            if (enriched.name && enriched.name.trim() !== '' && enriched.name !== 'User' && !enriched.name.startsWith('User ')) {
                enrichedUsersMap.set(clientId, enriched);
            }
        }

        const enrichedUsers = Array.from(enrichedUsersMap.values());

        // Notify all users in the view
        this.server.to(viewId).emit('user-joined', {
            userId: client.id,
            user: enrichedUser,
            users: enrichedUsers,
        });

        // Convert cursors from socket ID to user ID mapping
        const cursorsByUserId: Record<string, CursorPosition> = {};
        for (const [socketId, cursor] of session.cursors.entries()) {
            const user = session.users.get(socketId);
            if (user) {
                cursorsByUserId[user.id] = cursor;
            }
        }

        // Create socket ID to user ID mapping
        const socketIdToUserId: Record<string, string> = {};
        for (const [socketId, user] of session.users.entries()) {
            socketIdToUserId[socketId] = user.id;
        }

        // Send current session state to the joining user
        client.emit('session-state', {
            users: enrichedUsers,
            cursors: cursorsByUserId,
            socketIdToUserId,
        });

        this.logger.log(`User ${enrichedUser.name} joined view ${viewId}`);
    }

    @SubscribeMessage('leave-view')
    handleLeaveView(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string },
    ) {
        const { viewId } = data;
        const session = this.viewSessions.get(viewId);

        if (session) {
            session.users.delete(client.id);
            session.cursors.delete(client.id);

            client.leave(viewId);

            // Filter out users with invalid names before sending
            const validUsers = Array.from(session.users.values()).filter(u => 
                u.name && 
                u.name.trim() !== '' && 
                u.name !== 'User' && 
                !u.name.startsWith('User ') &&
                u.id &&
                u.id !== '' &&
                !u.id.startsWith('User ')
            );

            this.server.to(viewId).emit('user-left', {
                userId: client.id,
                users: validUsers,
            });

            // Clean up empty sessions
            if (session.users.size === 0) {
                this.viewSessions.delete(viewId);
            }
        }
    }

    @SubscribeMessage('cursor-move')
    handleCursorMove(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; position: CursorPosition },
    ) {
        const { viewId, position } = data;
        const session = this.viewSessions.get(viewId);

        if (session) {
            session.cursors.set(client.id, position);
            
            // Get user ID for this socket
            const user = session.users.get(client.id);
            if (!user) {
                this.logger.warn(`User not found in session for client ${client.id}`);
                return; // User not found in session
            }

            // Broadcast to all other users in the view with user ID
            client.to(viewId).emit('cursor-update', {
                userId: user.id, // Send user ID instead of socket ID
                position,
            });
        }
    }

    @SubscribeMessage('node-update')
    handleNodeUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; node: any },
    ) {
        const { viewId, node } = data;
        const session = this.viewSessions.get(viewId);

        if (!session) {
            this.logger.warn(`View session not found for ${viewId}`);
            return;
        }

        // Get user ID for this socket
        const user = session.users.get(client.id);
        if (!user) {
            this.logger.warn(`User not found in session for client ${client.id}`);
            return;
        }

        // Ensure client is in the view room
        if (!client.rooms.has(viewId)) {
            client.join(viewId);
        }

        // Broadcast to all users in the view (including sender for consistency)
        // Client will filter out its own messages using user ID
        this.server.to(viewId).emit('node-changed', {
            userId: user.id, // Send user ID instead of socket ID
            node,
        });
    }

    @SubscribeMessage('edge-update')
    handleEdgeUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; edge: any },
    ) {
        const { viewId, edge } = data;
        const session = this.viewSessions.get(viewId);

        if (!session) {
            this.logger.warn(`View session not found for ${viewId}`);
            return;
        }

        // Get user ID for this socket
        const user = session.users.get(client.id);
        if (!user) {
            this.logger.warn(`User not found in session for client ${client.id}`);
            return;
        }

        // Broadcast to all users in the view (including sender for consistency)
        // Client will filter out its own messages using user ID
        this.server.to(viewId).emit('edge-changed', {
            userId: user.id, // Send user ID instead of socket ID
            edge,
        });
    }

    @SubscribeMessage('node-delete')
    handleNodeDelete(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; nodeId: string },
    ) {
        const { viewId, nodeId } = data;
        const session = this.viewSessions.get(viewId);

        if (!session) {
            this.logger.warn(`View session not found for ${viewId}`);
            return;
        }

        // Get user ID for this socket
        const user = session.users.get(client.id);
        if (!user) {
            this.logger.warn(`User not found in session for client ${client.id}`);
            return;
        }

        // Broadcast to all users in the view (including sender for consistency)
        // Client will filter out its own messages using user ID
        this.server.to(viewId).emit('node-deleted', {
            userId: user.id, // Send user ID instead of socket ID
            nodeId,
        });
    }

    @SubscribeMessage('edge-delete')
    handleEdgeDelete(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; edgeId: string },
    ) {
        const { viewId, edgeId } = data;
        const session = this.viewSessions.get(viewId);

        if (!session) {
            this.logger.warn(`View session not found for ${viewId}`);
            return;
        }

        // Get user ID for this socket
        const user = session.users.get(client.id);
        if (!user) {
            this.logger.warn(`User not found in session for client ${client.id}`);
            return;
        }

        // Broadcast to all users in the view (including sender for consistency)
        // Client will filter out its own messages using user ID
        this.server.to(viewId).emit('edge-deleted', {
            userId: user.id, // Send user ID instead of socket ID
            edgeId,
        });
    }

    @SubscribeMessage('selection-change')
    handleSelectionChange(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; selectedNodes: string[] },
    ) {
        const { viewId, selectedNodes } = data;

        // Broadcast to all other users in the view
        client.to(viewId).emit('selection-changed', {
            userId: client.id,
            selectedNodes,
        });
    }

    @SubscribeMessage('join-chat')
    handleJoinChat(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { userId: string; targetUserId: string },
    ) {
        // Join a chat room (bidirectional: userId-targetUserId and targetUserId-userId)
        const room1 = `chat:${data.userId}:${data.targetUserId}`;
        const room2 = `chat:${data.targetUserId}:${data.userId}`;
        client.join([room1, room2]);
        this.logger.log(`User ${data.userId} joined chat rooms: ${room1}, ${room2}`);
        
        // Verify rooms were joined
        const rooms = Array.from(client.rooms);
        this.logger.log(`Client ${client.id} is now in rooms: ${rooms.join(', ')}`);
    }

    @SubscribeMessage('chat-message')
    async handleChatMessage(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { from: string; to: string; message: string; timestamp: string; senderName?: string },
    ) {
        // Send message to both chat rooms (bidirectional)
        const room1 = `chat:${data.from}:${data.to}`;
        const room2 = `chat:${data.to}:${data.from}`;
        
        // Try to get sender name from active sessions if not provided
        let senderName = data.senderName;
        if (!senderName) {
            // Look for the user in any active view session
            for (const session of this.viewSessions.values()) {
                const user = Array.from(session.users.values()).find(u => u.id === data.from);
                if (user) {
                    senderName = user.name;
                    break;
                }
            }
        }
        
        const messageData = {
            ...data,
            senderName: senderName || 'User',
        };
        
        // Save message to database
        let savedMessageId: string | undefined;
        try {
            const savedMessage = await this.prisma.chatMessage.create({
                data: {
                    fromId: data.from,
                    toId: data.to,
                    message: data.message,
                },
            });
            savedMessageId = savedMessage.id;
            this.logger.log(`Chat message saved to database: ${data.from} -> ${data.to} (ID: ${savedMessageId})`);
        } catch (error) {
            this.logger.error(`Failed to save chat message to database: ${error}`);
            // Continue even if save fails
        }
        
        // Include database ID in message data if available
        const messageDataWithId = {
            ...messageData,
            messageId: savedMessageId || data.timestamp,
        };
        
        // Broadcast to all clients in both rooms using server.to() to ensure all clients receive it
        // Exclude sender by using client.to() for the sender's room, but include in target's room
        this.server.to(room1).emit('chat-message', messageDataWithId);
        this.server.to(room2).emit('chat-message', messageDataWithId);
        
        // Create notification for the recipient
        try {
            await this.notificationsService.createNotification({
                userId: data.to,
                type: NotificationType.CHAT_MESSAGE,
                severity: NotificationSeverity.INFO,
                title: `Nouveau message de ${senderName || 'User'}`,
                message: data.message.length > 100 ? data.message.substring(0, 100) + '...' : data.message,
                metadata: {
                    from: data.from,
                    fromName: senderName || 'User',
                    messageId: data.timestamp,
                    fullMessage: data.message,
                },
            });
            this.logger.log(`Notification created for user ${data.to} for chat message from ${data.from}`);
        } catch (error) {
            this.logger.error(`Failed to create notification for chat message: ${error}`);
            // Don't fail the message sending if notification creation fails
        }
        
        this.logger.log(`Chat message from ${data.from} to ${data.to} - rooms: ${room1}, ${room2}`);
    }

    @SubscribeMessage('view-saved')
    handleViewSaved(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; savedBy: { id: string; name: string } },
    ) {
        const { viewId, savedBy } = data;
        const session = this.viewSessions.get(viewId);

        if (!session) {
            this.logger.warn(`View session not found for ${viewId}`);
            return;
        }

        // Get user ID for this socket
        const user = session.users.get(client.id);
        if (!user) {
            this.logger.warn(`User not found in session for client ${client.id}`);
            return;
        }

        // Broadcast to all users in the view that the view was saved
        this.server.to(viewId).emit('view-saved', {
            viewId,
            savedBy: savedBy || { id: user.id, name: user.name },
        });
    }

    // Method to emit notifications to specific users
    emitNotification(userId: string, notification: any) {
        // Send to user-specific notification room
        const room = `notifications:${userId}`;
        this.server.to(room).emit(`notification:${userId}`, notification);
        this.logger.log(`Notification emitted to room ${room} for user ${userId}`);
    }

    // Methods for comment events
    emitCommentCreated(thread: any) {
        // Emit to all users viewing the target (element, relationship, or view)
        const targetRoom = `${thread.targetType.toLowerCase()}:${thread.targetId}`;
        this.server.to(targetRoom).emit('comment-thread-created', thread);
        this.logger.log(`Comment thread created event emitted for ${thread.targetType}:${thread.targetId}`);
    }

    emitCommentAdded(threadId: string, comment: any) {
        // Emit to all users viewing the target
        // We need to get the thread to know the target
        this.server.emit('comment-added', { threadId, comment });
        this.logger.log(`Comment added event emitted for thread ${threadId}`);
    }

    emitThreadResolved(threadId: string, resolved: boolean) {
        this.server.emit('thread-resolved', { threadId, resolved });
        this.logger.log(`Thread resolved event emitted for thread ${threadId}: ${resolved}`);
    }
}
