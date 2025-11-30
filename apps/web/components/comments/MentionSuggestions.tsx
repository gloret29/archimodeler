"use client";

import React, { useEffect, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';

interface User {
    id: string;
    name: string;
    email: string;
}

interface MentionSuggestionsProps {
    users: User[];
    selectedIndex: number;
    onSelect: (user: User) => void;
    position: number;
}

export default function MentionSuggestions({
    users,
    selectedIndex,
    onSelect,
    position,
}: MentionSuggestionsProps) {
    const cardRef = useRef<HTMLDivElement>(null);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    // Scroll selected item into view
    useEffect(() => {
        if (cardRef.current && selectedIndex >= 0) {
            const selectedElement = cardRef.current.querySelector(
                `[data-user-index="${selectedIndex}"]`
            );
            if (selectedElement) {
                selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
        }
    }, [selectedIndex]);

    if (users.length === 0) {
        return null;
    }

    return (
        <Card 
            ref={cardRef}
            className="absolute z-50 w-64 max-h-48 overflow-y-auto shadow-lg border top-full mt-1"
        >
            <div className="p-1">
                {users.map((user, index) => (
                    <div
                        key={user.id}
                        data-user-index={index}
                        onClick={() => onSelect(user)}
                        className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer transition-colors ${
                            index === selectedIndex
                                ? 'bg-primary text-primary-foreground'
                                : 'hover:bg-muted'
                        }`}
                    >
                        <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                                {getInitials(user.name || user.email)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium truncate">
                                {user.name || user.email}
                            </div>
                            {user.name && (
                                <div className={`text-xs truncate ${
                                    index === selectedIndex ? 'opacity-90' : 'opacity-70'
                                }`}>
                                    {user.email}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </Card>
    );
}

