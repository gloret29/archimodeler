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
    namespace: 'collaboration',
})
export class CollaborationGateway
    implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    private readonly logger = new Logger(CollaborationGateway.name);
    private viewSessions: Map<string, ViewSession> = new Map();

    constructor(
        @Inject(forwardRef(() => NotificationsService))
        private notificationsService: NotificationsService,
        @Inject(forwardRef(() => UsersService))
        private usersService: UsersService,
    ) {}

    handleConnection(client: Socket) {
        this.logger.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        this.logger.log(`Client disconnected: ${client.id}`);

        // Remove user from all view sessions
        this.viewSessions.forEach((session, viewId) => {
            if (session.users.has(client.id)) {
                session.users.delete(client.id);
                session.cursors.delete(client.id);

                // Notify other users in the view
                this.server.to(viewId).emit('user-left', {
                    userId: client.id,
                    users: Array.from(session.users.values()),
                });

                // Clean up empty sessions
                if (session.users.size === 0) {
                    this.viewSessions.delete(viewId);
                }
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
        if (!enrichedUser.name || enrichedUser.name.trim() === '' || enrichedUser.name === 'User') {
            try {
                const dbUser = await this.usersService.findById(user.id);
                if (dbUser) {
                    enrichedUser.name = dbUser.name || dbUser.email || 'User';
                }
            } catch (error) {
                this.logger.warn(`Failed to fetch user ${user.id} from database: ${error}`);
            }
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
            if (!u.name || u.name.trim() === '' || u.name === 'User') {
                try {
                    const dbUser = await this.usersService.findById(u.id);
                    if (dbUser) {
                        enriched = { ...u, name: dbUser.name || dbUser.email || 'User' };
                        session.users.set(clientId, enriched);
                    }
                } catch (error) {
                    this.logger.warn(`Failed to fetch user ${u.id} from database: ${error}`);
                }
            }
            enrichedUsersMap.set(clientId, enriched);
        }

        const enrichedUsers = Array.from(enrichedUsersMap.values());

        // Notify all users in the view
        this.server.to(viewId).emit('user-joined', {
            userId: client.id,
            user: enrichedUser,
            users: enrichedUsers,
        });

        // Send current session state to the joining user
        client.emit('session-state', {
            users: enrichedUsers,
            cursors: Object.fromEntries(session.cursors),
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

            this.server.to(viewId).emit('user-left', {
                userId: client.id,
                users: Array.from(session.users.values()),
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

            // Broadcast to all other users in the view
            client.to(viewId).emit('cursor-update', {
                userId: client.id,
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

        // Broadcast to all other users in the view
        client.to(viewId).emit('node-changed', {
            userId: client.id,
            node,
        });
    }

    @SubscribeMessage('edge-update')
    handleEdgeUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; edge: any },
    ) {
        const { viewId, edge } = data;

        // Broadcast to all other users in the view
        client.to(viewId).emit('edge-changed', {
            userId: client.id,
            edge,
        });
    }

    @SubscribeMessage('node-delete')
    handleNodeDelete(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; nodeId: string },
    ) {
        const { viewId, nodeId } = data;

        // Broadcast to all other users in the view
        client.to(viewId).emit('node-deleted', {
            userId: client.id,
            nodeId,
        });
    }

    @SubscribeMessage('edge-delete')
    handleEdgeDelete(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; edgeId: string },
    ) {
        const { viewId, edgeId } = data;

        // Broadcast to all other users in the view
        client.to(viewId).emit('edge-deleted', {
            userId: client.id,
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
    handleChatMessage(
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
        
        // Broadcast to all clients in both rooms using server.to() to ensure all clients receive it
        // Exclude sender by using client.to() for the sender's room, but include in target's room
        this.server.to(room1).emit('chat-message', messageData);
        this.server.to(room2).emit('chat-message', messageData);
        
        this.logger.log(`Chat message from ${data.from} to ${data.to} - rooms: ${room1}, ${room2}`);
    }

    // Method to emit notifications to specific users
    emitNotification(userId: string, notification: any) {
        this.server.emit(`notification:${userId}`, notification);
    }
}
