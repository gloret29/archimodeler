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
import { Logger } from '@nestjs/common';

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
    handleJoinView(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { viewId: string; user: User },
    ) {
        const { viewId, user } = data;

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

        session.users.set(client.id, user);

        // Notify all users in the view
        const users = Array.from(session.users.values());
        this.server.to(viewId).emit('user-joined', {
            userId: client.id,
            user,
            users,
        });

        // Send current session state to the joining user
        client.emit('session-state', {
            users,
            cursors: Object.fromEntries(session.cursors),
        });

        this.logger.log(`User ${user.name} joined view ${viewId}`);
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
}
