"use client";

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export interface User {
    id: string;
    name: string;
    color: string;
}

export interface CursorPosition {
    x: number;
    y: number;
}

export interface CollaborationState {
    users: User[];
    cursors: Record<string, CursorPosition>;
    selections: Record<string, string[]>; // userId -> nodeIds
    isConnected: boolean;
}

interface UseCollaborationOptions {
    viewId: string;
    user: User;
    onNodeChanged?: (data: { userId: string; node: any }) => void;
    onEdgeChanged?: (data: { userId: string; edge: any }) => void;
    onNodeDeleted?: (data: { userId: string; nodeId: string }) => void;
    onEdgeDeleted?: (data: { userId: string; edgeId: string }) => void;
    onSelectionChanged?: (data: { userId: string; selectedNodes: string[] }) => void;
}

export function useCollaboration({
    viewId,
    user,
    onNodeChanged,
    onEdgeChanged,
    onNodeDeleted,
    onEdgeDeleted,
    onSelectionChanged,
}: UseCollaborationOptions) {
    const socketRef = useRef<Socket | null>(null);
    const [state, setState] = useState<CollaborationState>({
        users: [],
        cursors: {},
        selections: {},
        isConnected: false,
    });

    // Initialize socket connection
    useEffect(() => {
        // Don't connect if viewId is empty
        if (!viewId) {
            setState((prev) => ({ ...prev, isConnected: false }));
            return;
        }

        const socket = io('http://localhost:3002/collaboration', {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 5000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            console.log('✓ Connected to collaboration server');
            setState((prev) => ({ ...prev, isConnected: true }));

            // Join the view
            socket.emit('join-view', { viewId, user });
        });

        socket.on('disconnect', (reason) => {
            console.log('Disconnected from collaboration server:', reason);
            setState((prev) => ({ ...prev, isConnected: false }));
        });

        socket.on('connect_error', (error) => {
            // Silently handle connection errors - collaboration is optional
            console.warn('Collaboration server unavailable (this is optional)');
            setState((prev) => ({ ...prev, isConnected: false }));
        });

        socket.on('error', (error: any) => {
            console.warn('Collaboration error:', error?.message || error);
        });

        socket.on('session-state', (data: { users: User[]; cursors: Record<string, CursorPosition> }) => {
            setState((prev) => ({
                ...prev,
                users: data.users,
                cursors: data.cursors,
            }));
        });

        socket.on('user-joined', (data: { userId: string; user: User; users: User[] }) => {
            console.log('User joined:', data.user.name);
            setState((prev) => ({
                ...prev,
                users: data.users,
            }));
        });

        socket.on('user-left', (data: { userId: string; users: User[] }) => {
            console.log('User left:', data.userId);
            setState((prev) => {
                const newCursors = { ...prev.cursors };
                delete newCursors[data.userId];
                
                const newSelections = { ...prev.selections };
                delete newSelections[data.userId];

                return {
                    ...prev,
                    users: data.users,
                    cursors: newCursors,
                    selections: newSelections,
                };
            });
        });

        socket.on('cursor-update', (data: { userId: string; position: CursorPosition }) => {
            setState((prev) => ({
                ...prev,
                cursors: {
                    ...prev.cursors,
                    [data.userId]: data.position,
                },
            }));
        });

        socket.on('node-changed', onNodeChanged || (() => { }));
        socket.on('edge-changed', onEdgeChanged || (() => { }));
        socket.on('node-deleted', onNodeDeleted || (() => { }));
        socket.on('edge-deleted', onEdgeDeleted || (() => { }));
        
        socket.on('selection-changed', (data: { userId: string; selectedNodes: string[] }) => {
            setState((prev) => ({
                ...prev,
                selections: {
                    ...prev.selections,
                    [data.userId]: data.selectedNodes,
                },
            }));
            if (onSelectionChanged) onSelectionChanged(data);
        });

        return () => {
            if (socket.connected) {
                socket.emit('leave-view', { viewId });
            }
            socket.disconnect();
        };
    }, [viewId]); // Only reconnect when viewId changes

    // Methods to emit events
    const updateCursor = useCallback((position: CursorPosition) => {
        socketRef.current?.emit('cursor-move', { viewId, position });
    }, [viewId]);

    const updateNode = useCallback((node: any) => {
        socketRef.current?.emit('node-update', { viewId, node });
    }, [viewId]);

    const updateEdge = useCallback((edge: any) => {
        socketRef.current?.emit('edge-update', { viewId, edge });
    }, [viewId]);

    const deleteNode = useCallback((nodeId: string) => {
        socketRef.current?.emit('node-delete', { viewId, nodeId });
    }, [viewId]);

    const deleteEdge = useCallback((edgeId: string) => {
        socketRef.current?.emit('edge-delete', { viewId, edgeId });
    }, [viewId]);

    const updateSelection = useCallback((selectedNodes: string[]) => {
        socketRef.current?.emit('selection-change', { viewId, selectedNodes });
    }, [viewId]);

    return {
        ...state,
        updateCursor,
        updateNode,
        updateEdge,
        deleteNode,
        deleteEdge,
        updateSelection,
    };
}