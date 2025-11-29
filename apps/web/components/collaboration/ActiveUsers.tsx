"use client";

import React from 'react';
import { User } from '@/hooks/useCollaboration';
import { Users } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';

interface ActiveUsersProps {
    users: User[];
    isConnected: boolean;
}

export default function ActiveUsers({ users, isConnected }: ActiveUsersProps) {
    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <div className="relative">
                        <Users className="h-4 w-4" />
                        {isConnected && (
                            <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                        )}
                    </div>
                    <span className="font-medium">{users.length}</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64" align="end">
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <h4 className="font-semibold text-sm">Active Users</h4>
                        <div className="flex items-center gap-1.5">
                            <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-gray-400'}`} />
                            <span className="text-xs text-muted-foreground">
                                {isConnected ? 'Connected' : 'Disconnected'}
                            </span>
                        </div>
                    </div>

                    {users.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No other users in this view</p>
                    ) : (
                        <div className="space-y-2">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center gap-2 p-2 rounded-md hover:bg-accent">
                                    <div
                                        className="h-3 w-3 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: user.color }}
                                    />
                                    <span className="text-sm font-medium truncate">{user.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
