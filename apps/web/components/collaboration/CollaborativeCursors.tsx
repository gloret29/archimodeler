"use client";

import React from 'react';
import { User, CursorPosition } from '@/hooks/useCollaboration';

interface CollaborativeCursorsProps {
    users: User[];
    cursors: Record<string, CursorPosition>;
}

export default function CollaborativeCursors({ users, cursors }: CollaborativeCursorsProps) {
    return (
        <>
            {users.map((user) => {
                const cursor = cursors[user.id];
                if (!cursor) return null;

                return (
                    <div
                        key={user.id}
                        className="pointer-events-none absolute z-50 transition-all duration-100"
                        style={{
                            left: `${cursor.x}px`,
                            top: `${cursor.y}px`,
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
