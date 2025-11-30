"use client";

/**
 * @fileoverview Hook pour gérer la collaboration en temps réel.
 * 
 * Gère la connexion WebSocket, la synchronisation des curseurs,
 * la sélection d'éléments et la communication entre utilisateurs.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_CONFIG } from '@/lib/api/config';

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
    cursors: Record<string, CursorPosition>; // user.id -> position
    selections: Record<string, string[]>; // userId -> nodeIds
    isConnected: boolean;
    socketIdToUserId: Record<string, string>; // socket.id -> user.id mapping
}

interface UseCollaborationOptions {
    viewId: string;
    user: User;
    onNodeChanged?: (data: { userId: string; node: any }) => void;
    onEdgeChanged?: (data: { userId: string; edge: any }) => void;
    onNodeDeleted?: (data: { userId: string; nodeId: string }) => void;
    onEdgeDeleted?: (data: { userId: string; edgeId: string }) => void;
    onSelectionChanged?: (data: { userId: string; selectedNodes: string[] }) => void;
    onViewSaved?: (data: { viewId: string; savedBy: { id: string; name: string } }) => void;
}

/**
 * Hook pour gérer la collaboration en temps réel sur une vue.
 * 
 * Établit une connexion WebSocket pour synchroniser les actions des utilisateurs
 * en temps réel : curseurs, sélections, modifications de nœuds/arêtes.
 * 
 * @param {UseCollaborationOptions} options - Options de configuration
 * @param {string} options.viewId - ID de la vue pour la session de collaboration
 * @param {User} options.user - Informations de l'utilisateur actuel
 * @param {(data: {userId: string, node: any}) => void} [options.onNodeChanged] - Callback appelé quand un nœud est modifié
 * @param {(data: {userId: string, edge: any}) => void} [options.onEdgeChanged] - Callback appelé quand une arête est modifiée
 * @param {(data: {userId: string, nodeId: string}) => void} [options.onNodeDeleted] - Callback appelé quand un nœud est supprimé
 * @param {(data: {userId: string, edgeId: string}) => void} [options.onEdgeDeleted] - Callback appelé quand une arête est supprimée
 * @param {(data: {userId: string, selectedNodes: string[]}) => void} [options.onSelectionChanged] - Callback appelé quand la sélection change
 * @param {(data: {viewId: string, savedBy: {id: string, name: string}}) => void} [options.onViewSaved] - Callback appelé quand une vue est sauvegardée
 * @returns {CollaborationState} État de la collaboration (utilisateurs, curseurs, sélections, connexion)
 * 
 * @example
 * const { users, cursors, isConnected, sendCursorUpdate } = useCollaboration({
 *   viewId: 'view-123',
 *   user: { id: 'user-1', name: 'John', color: '#FF0000' },
 *   onNodeChanged: (data) => console.log('Node changed by', data.userId),
 * });
 */
export function useCollaboration({
    viewId,
    user,
    onNodeChanged,
    onEdgeChanged,
    onNodeDeleted,
    onEdgeDeleted,
    onSelectionChanged,
    onViewSaved,
}: UseCollaborationOptions) {
    const socketRef = useRef<Socket | null>(null);
    const socketIdRef = useRef<string | null>(null);
    const onNodeChangedRef = useRef(onNodeChanged);
    const onEdgeChangedRef = useRef(onEdgeChanged);
    const onNodeDeletedRef = useRef(onNodeDeleted);
    const onEdgeDeletedRef = useRef(onEdgeDeleted);
    const onSelectionChangedRef = useRef(onSelectionChanged);
    const onViewSavedRef = useRef(onViewSaved);
    const userRef = useRef(user);
    
    // Update refs when callbacks change
    useEffect(() => {
        onNodeChangedRef.current = onNodeChanged;
        onEdgeChangedRef.current = onEdgeChanged;
        onNodeDeletedRef.current = onNodeDeleted;
        onEdgeDeletedRef.current = onEdgeDeleted;
        onSelectionChangedRef.current = onSelectionChanged;
        onViewSavedRef.current = onViewSaved;
        userRef.current = user;
    }, [onNodeChanged, onEdgeChanged, onNodeDeleted, onEdgeDeleted, onSelectionChanged, onViewSaved, user]);
    
    const [state, setState] = useState<CollaborationState>({
        users: [],
        cursors: {},
        selections: {},
        isConnected: false,
        socketIdToUserId: {},
    });

    // Initialize socket connection
    useEffect(() => {
        // Don't connect if viewId is empty or user doesn't have a valid name
        if (!viewId || !user || !user.name || user.name.trim() === '' || user.name === 'User') {
            setState((prev) => ({ ...prev, isConnected: false }));
            return;
        }

        const socket = io(API_CONFIG.wsUrl, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
            timeout: 5000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            socketIdRef.current = socket.id ?? null;
            setState((prev) => ({ ...prev, isConnected: true }));

            // Join the view
            socket.emit('join-view', { viewId, user: userRef.current });
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

        socket.on('session-state', (data: { users: User[]; cursors: Record<string, CursorPosition>; socketIdToUserId?: Record<string, string> }) => {
            // Filter out duplicate users
            const uniqueUsers = data.users.filter((user, index, self) => 
                index === self.findIndex(u => u.id === user.id)
            );
            setState((prev) => ({
                ...prev,
                users: uniqueUsers,
                cursors: data.cursors, // Cursors should already be mapped by user.id from server
                socketIdToUserId: data.socketIdToUserId || prev.socketIdToUserId, // Store mapping if provided
            }));
        });

        socket.on('user-joined', (data: { userId: string; user: User; users: User[] }) => {
            console.log('User joined:', data.user.name, 'socket ID:', data.userId);
            // Filter out duplicate users
            const uniqueUsers = data.users.filter((user, index, self) => 
                index === self.findIndex(u => u.id === user.id)
            );
            setState((prev) => {
                // Create mapping: data.userId is socket ID, data.user.id is user ID
                const newMapping = { ...prev.socketIdToUserId };
                newMapping[data.userId] = data.user.id;
                
                return {
                    ...prev,
                    users: uniqueUsers,
                    socketIdToUserId: newMapping,
                };
            });
        });

        socket.on('user-left', (data: { userId: string; users: User[] }) => {
            console.log('User left:', data.userId);
            // Filter out duplicate users
            const uniqueUsers = data.users.filter((user, index, self) => 
                index === self.findIndex(u => u.id === user.id)
            );
            setState((prev) => {
                const newCursors = { ...prev.cursors };
                // data.userId might be socket ID, try to find user ID
                const userToRemove = uniqueUsers.find(u => u.id === data.userId) || 
                                    prev.users.find(u => prev.socketIdToUserId[data.userId] === u.id);
                if (userToRemove) {
                    delete newCursors[userToRemove.id];
                }
                // Also try socket ID directly
                delete newCursors[data.userId];
                
                const newSelections = { ...prev.selections };
                if (userToRemove) {
                    delete newSelections[userToRemove.id];
                }
                delete newSelections[data.userId];
                
                // Clean up mapping
                const newMapping = { ...prev.socketIdToUserId };
                delete newMapping[data.userId];

                return {
                    ...prev,
                    users: uniqueUsers,
                    cursors: newCursors,
                    selections: newSelections,
                    socketIdToUserId: newMapping,
                };
            });
        });

        socket.on('cursor-update', (data: { userId: string; position: CursorPosition }) => {
            // The userId might be a socket ID if server hasn't been restarted
            // Try to find the corresponding user ID
            setState((prev) => {
                // Check if userId is actually a user ID (exists in users)
                const isUserId = prev.users.some(u => u.id === data.userId);
                let actualUserId = data.userId;
                
                // If it's a socket ID, try to find the user
                if (!isUserId) {
                    // Check if we have a mapping
                    const mappedUserId = prev.socketIdToUserId[data.userId];
                    if (mappedUserId) {
                        actualUserId = mappedUserId;
                    } else {
                        // Store cursor with socket ID for now, will be cleaned up when user mapping is available
                        actualUserId = data.userId;
                    }
                }
                
                const currentPos = prev.cursors[actualUserId];
                if (currentPos && 
                    currentPos.x === data.position.x && 
                    currentPos.y === data.position.y) {
                    return prev; // No change, return previous state
                }
                return {
                    ...prev,
                    cursors: {
                        ...prev.cursors,
                        [actualUserId]: data.position,
                    },
                };
            });
        });

        socket.on('node-changed', (data: { userId: string; node: any }) => {
            // Filter out our own messages by comparing user IDs
            if (data.userId === userRef.current.id) {
                return;
            }
            if (onNodeChangedRef.current) {
                onNodeChangedRef.current(data);
            }
        });
        socket.on('edge-changed', (data: { userId: string; edge: any }) => {
            // Filter out our own messages by comparing user IDs
            if (data.userId === userRef.current.id) {
                return;
            }
            if (onEdgeChangedRef.current) {
                onEdgeChangedRef.current(data);
            }
        });
        socket.on('node-deleted', (data: { userId: string; nodeId: string }) => {
            // Filter out our own messages by comparing user IDs
            if (data.userId === userRef.current.id) {
                return;
            }
            if (onNodeDeletedRef.current) {
                onNodeDeletedRef.current(data);
            }
        });
        socket.on('edge-deleted', (data: { userId: string; edgeId: string }) => {
            // Filter out our own messages by comparing user IDs
            if (data.userId === userRef.current.id) {
                return;
            }
            if (onEdgeDeletedRef.current) {
                onEdgeDeletedRef.current(data);
            }
        });
        
        socket.on('selection-changed', (data: { userId: string; selectedNodes: string[] }) => {
            setState((prev) => ({
                ...prev,
                selections: {
                    ...prev.selections,
                    [data.userId]: data.selectedNodes,
                },
            }));
            if (onSelectionChangedRef.current) {
                onSelectionChangedRef.current(data);
            }
        });

        socket.on('view-saved', (data: { viewId: string; savedBy: { id: string; name: string } }) => {
            if (onViewSavedRef.current) {
                onViewSavedRef.current(data);
            }
        });

        // Listen for comment events
        socket.on('comment-thread-created', (thread: any) => {
            // Dispatch global event for comment panels to listen to
            window.dispatchEvent(new CustomEvent('comment-thread-created', { detail: thread }));
        });

        socket.on('comment-added', (data: { threadId: string; comment: any }) => {
            // Dispatch global event for comment panels to listen to
            window.dispatchEvent(new CustomEvent('comment-added', { detail: data }));
        });

        socket.on('thread-resolved', (data: { threadId: string; resolved: boolean }) => {
            // Dispatch global event for comment panels to listen to
            window.dispatchEvent(new CustomEvent('thread-resolved', { detail: data }));
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
        if (socketRef.current?.connected) {
            socketRef.current.emit('node-update', { viewId, node });
        }
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

    const notifyViewSaved = useCallback((savedBy: { id: string; name: string }) => {
        if (socketRef.current?.connected) {
            socketRef.current.emit('view-saved', { viewId, savedBy });
        }
    }, [viewId]);

    return {
        ...state,
        updateCursor,
        updateNode,
        updateEdge,
        deleteNode,
        deleteEdge,
        updateSelection,
        notifyViewSaved,
    };
}