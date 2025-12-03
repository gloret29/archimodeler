"use client";

import React, { useState, useEffect } from 'react';
import { User, CursorPosition } from '@/lib/types/collaboration';

interface CollaborativeCursorsProps {
    users: User[];
    cursors: Record<string, CursorPosition>;
    reactFlowInstance: any;
}

export default function CollaborativeCursors({ users, cursors, reactFlowInstance }: CollaborativeCursorsProps) {
    const [paneRect, setPaneRect] = useState<DOMRect | null>(null);

    // Update pane rect when React Flow instance changes or on resize
    useEffect(() => {
        if (!reactFlowInstance) return;

        const updatePaneRect = () => {
            const reactFlowPane = document.querySelector('.react-flow__pane') as HTMLElement;
            if (reactFlowPane) {
                setPaneRect(reactFlowPane.getBoundingClientRect());
            }
        };

        updatePaneRect();
        window.addEventListener('resize', updatePaneRect);
        window.addEventListener('scroll', updatePaneRect, true);

        // Update periodically to catch React Flow viewport changes
        const interval = setInterval(updatePaneRect, 100);

        return () => {
            window.removeEventListener('resize', updatePaneRect);
            window.removeEventListener('scroll', updatePaneRect, true);
            clearInterval(interval);
        };
    }, [reactFlowInstance]);

    if (!reactFlowInstance || !paneRect) {
        return null;
    }

    return (
        <>
            {users.map((user) => {
                const cursor = cursors[user.id];
                if (!cursor) {
                    return null;
                }

                // Check if cursor position is valid
                if (typeof cursor.x !== 'number' || typeof cursor.y !== 'number') {
                    return null;
                }

                // Convert flow coordinates to screen coordinates
                const screenPosition = reactFlowInstance.flowToScreenPosition({
                    x: cursor.x,
                    y: cursor.y,
                });
                
                return (
                    <div
                        key={user.id}
                        className="pointer-events-none fixed z-50 transition-all duration-100"
                        style={{
                            left: `${paneRect.left + screenPosition.x}px`,
                            top: `${paneRect.top + screenPosition.y}px`,
                            transform: 'translate(-50%, -50%)',
                        }}
                    >
                        {/* Cursor icon */}
                        <svg
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                            style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
                        >
                            <path
                                d="M5.65376 12.3673H5.46026L5.31717 12.4976L0.500002 16.8829L0.500002 1.19841L11.7841 12.3673H5.65376Z"
                                fill={user.color}
                                stroke="white"
                                strokeWidth="1"
                            />
                        </svg>

                        {/* User name label */}
                        <div
                            className="absolute left-6 top-0 px-2 py-1 rounded text-xs font-medium text-white whitespace-nowrap"
                            style={{
                                backgroundColor: user.color,
                                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                            }}
                        >
                            {user.name}
                        </div>
                    </div>
                );
            })}
        </>
    );
}
