"use client";

import React, { useEffect, useMemo, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import ModelingCanvas from '@/components/canvas/ModelingCanvas';
import { useCollaboration, User } from '@/hooks/useCollaboration';
import CollaborativeCursors from '@/components/collaboration/CollaborativeCursors';

interface CollaborativeCanvasProps {
    viewId: string;
    viewName: string;
    packageId: string | null;
}

// Generate a random color for the user
function generateUserColor(): string {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
    ];
    return colors[Math.floor(Math.random() * colors.length)] || '#4ECDC4';
}

export default function CollaborativeCanvas({
    viewId,
    viewName,
    packageId
}: CollaborativeCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);

    // Create user object (in a real app, this would come from auth)
    const currentUser = useMemo<User>(() => ({
        id: Math.random().toString(36).substring(7),
        name: `User ${Math.floor(Math.random() * 1000)}`, // Replace with actual user name
        color: generateUserColor(),
    }), []);

    const {
        users,
        cursors,
        isConnected,
        updateCursor,
        updateNode,
        updateEdge,
        deleteNode,
        deleteEdge,
    } = useCollaboration({
        viewId,
        user: currentUser,
        onNodeChanged: (data) => {
            console.log('Node changed by', data.userId, data.node);
            // Handle node update from other users
            // This would update the React Flow state
        },
        onEdgeChanged: (data) => {
            console.log('Edge changed by', data.userId, data.edge);
            // Handle edge update from other users
        },
        onNodeDeleted: (data) => {
            console.log('Node deleted by', data.userId, data.nodeId);
            // Handle node deletion from other users
        },
        onEdgeDeleted: (data) => {
            console.log('Edge deleted by', data.userId, data.edgeId);
            // Handle edge deletion from other users
        },
    });

    // Track mouse movement for cursor sharing
    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                updateCursor({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            return () => {
                canvas.removeEventListener('mousemove', handleMouseMove);
            };
        }
    }, [updateCursor]);

    return (
        <div ref={canvasRef} className="relative h-full w-full">
            <ReactFlowProvider>
                <ModelingCanvas packageId={packageId} />
            </ReactFlowProvider>

            {/* Collaborative cursors overlay - only shown when connected */}
            {isConnected && (
                <CollaborativeCursors users={users} cursors={cursors} />
            )}
        </div>
    );
}
