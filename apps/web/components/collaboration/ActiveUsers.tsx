"use client";

import React, { useState } from 'react';
import { User } from '@/hooks/useCollaboration';
import { Users, MessageCircle } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from '@/components/ui/button';
import { UserChat } from './UserChat';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useChatContext } from '@/contexts/ChatContext';

interface ActiveUsersProps {
    users: User[];
    isConnected: boolean;
    currentUser: User;
}

export default function ActiveUsers({ users, isConnected, currentUser }: ActiveUsersProps) {
    const { getUnreadCount } = useUnreadMessages();
    const { openChat, chatTarget, isChatOpen, closeChat } = useChatContext();

    // Filter out duplicate users based on ID
    const uniqueUsers = React.useMemo(() => {
        const seen = new Set<string>();
        return users.filter(user => {
            if (seen.has(user.id)) {
                return false;
            }
            seen.add(user.id);
            return true;
        });
    }, [users]);

    const handleChatClick = (user: User) => {
        openChat(user.id, user.name, user.color);
    };

    return (
        <>
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                        <div className="relative">
                            <Users className="h-4 w-4" />
                            {isConnected && (
                                <div className="absolute -top-1 -right-1 h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                            )}
                        </div>
                        <span className="font-medium">{uniqueUsers.length}</span>
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-80" align="end">
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

                        {uniqueUsers.length === 0 ? (
                            <p className="text-sm text-muted-foreground">No other users in this view</p>
                        ) : (
                            <div className="space-y-1">
                                {uniqueUsers.map((user) => (
                                    <div 
                                        key={user.id} 
                                        className="flex items-center justify-between gap-2 p-2 rounded-md hover:bg-accent group"
                                    >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                            <div className="relative flex-shrink-0">
                                                <div
                                                    className="h-3 w-3 rounded-full"
                                                    style={{ backgroundColor: user.color }}
                                                />
                                                {getUnreadCount(user.id) > 0 && (
                                                    <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center">
                                                        <span className="text-[10px] font-bold text-white">
                                                            {getUnreadCount(user.id) > 9 ? '9+' : getUnreadCount(user.id)}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-sm font-medium truncate">{user.name}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                                            onClick={() => handleChatClick(user)}
                                            title={`Chat with ${user.name}`}
                                        >
                                            <MessageCircle className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </PopoverContent>
            </Popover>

            {chatTarget && (
                <UserChat
                    currentUser={currentUser}
                    targetUser={{ id: chatTarget.id, name: chatTarget.name, color: chatTarget.color }}
                    isOpen={isChatOpen}
                    onClose={closeChat}
                />
            )}
        </>
    );
}
