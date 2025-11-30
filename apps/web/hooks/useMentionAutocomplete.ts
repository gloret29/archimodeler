"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api/client';

interface User {
    id: string;
    name: string;
    email: string;
}

interface MentionState {
    show: boolean;
    query: string;
    startIndex: number;
    endIndex: number;
    selectedIndex: number;
}

export function useMentionAutocomplete(
    value: string,
    onChange: (value: string) => void,
    textareaRef: React.RefObject<HTMLTextAreaElement>
) {
    const [users, setUsers] = useState<User[]>([]);
    const [mentionState, setMentionState] = useState<MentionState | null>(null);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);

    // Load users on mount
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const data = await api.get<User[]>('/users/mentions');
                // Ensure data is an array
                const usersArray = Array.isArray(data) ? data : [];
                console.log('Loaded users for mentions:', usersArray.length);
                setUsers(usersArray);
            } catch (error) {
                console.error('Failed to fetch users for mentions:', error);
                setUsers([]); // Set empty array on error
            }
        };
        fetchUsers();
    }, []);

    // Detect @ mentions in text
    const detectMention = useCallback((text: string, cursorPosition: number) => {
        // Find the @ symbol before the cursor
        const textBeforeCursor = text.substring(0, cursorPosition);
        const lastAtIndex = textBeforeCursor.lastIndexOf('@');
        
        if (lastAtIndex === -1) {
            return null;
        }

        // Check if there's a space or newline between @ and cursor
        const textAfterAt = textBeforeCursor.substring(lastAtIndex + 1);
        if (textAfterAt.includes(' ') || textAfterAt.includes('\n')) {
            return null;
        }

        // Extract the query (text after @)
        const query = textAfterAt.toLowerCase();
        const endIndex = cursorPosition;

        return {
            show: true,
            query,
            startIndex: lastAtIndex,
            endIndex,
            selectedIndex: 0,
        };
    }, []);

    // Handle text change
    const handleTextChange = useCallback((newValue: string, cursorPosition?: number) => {
        onChange(newValue);
        
        // Use requestAnimationFrame to ensure cursor position is updated
        requestAnimationFrame(() => {
            if (!textareaRef.current) return;

            const position = cursorPosition !== undefined ? cursorPosition : textareaRef.current.selectionStart;
            const mention = detectMention(newValue, position);

            if (mention) {
                // Filter users based on query (ensure users is an array)
                const usersArray = Array.isArray(users) ? users : [];
                let filtered: User[];
                
                if (mention.query.length === 0) {
                    // Show all users if no query yet (limit to 10 for performance)
                    filtered = usersArray.slice(0, 10);
                } else {
                    // Filter users based on query
                    filtered = usersArray.filter(user => {
                        const nameMatch = user.name?.toLowerCase().includes(mention.query);
                        const emailMatch = user.email?.toLowerCase().includes(mention.query);
                        return nameMatch || emailMatch;
                    });
                }
                
                console.log('Mention detected:', mention.query, 'Filtered users:', filtered.length, 'Total users:', usersArray.length);
                setFilteredUsers(filtered);
                setMentionState(mention);
            } else {
                setMentionState(null);
                setFilteredUsers([]);
            }
        });
    }, [users, detectMention, onChange, textareaRef]);

    // Insert mention into text
    const insertMention = useCallback((user: User) => {
        if (!mentionState || !textareaRef.current) return;

        const before = value.substring(0, mentionState.startIndex);
        const after = value.substring(mentionState.endIndex);
        const newValue = `${before}@${user.name} ${after}`;
        
        onChange(newValue);
        setMentionState(null);
        setFilteredUsers([]);

        // Set cursor position after the mention
        setTimeout(() => {
            if (textareaRef.current) {
                const newPosition = before.length + user.name.length + 2; // +2 for @ and space
                textareaRef.current.setSelectionRange(newPosition, newPosition);
                textareaRef.current.focus();
            }
        }, 0);
    }, [mentionState, value, onChange, textareaRef]);

    // Handle keyboard navigation
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mentionState || filteredUsers.length === 0) {
            return false; // Let the event propagate
        }

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setMentionState(prev => prev ? {
                ...prev,
                selectedIndex: Math.min(prev.selectedIndex + 1, filteredUsers.length - 1),
            } : null);
            return true;
        }

        if (e.key === 'ArrowUp') {
            e.preventDefault();
            setMentionState(prev => prev ? {
                ...prev,
                selectedIndex: Math.max(prev.selectedIndex - 1, 0),
            } : null);
            return true;
        }

        if (e.key === 'Enter' || e.key === 'Tab') {
            e.preventDefault();
            if (filteredUsers[mentionState.selectedIndex]) {
                insertMention(filteredUsers[mentionState.selectedIndex]);
            }
            return true;
        }

        if (e.key === 'Escape') {
            e.preventDefault();
            setMentionState(null);
            setFilteredUsers([]);
            return true;
        }

        return false; // Let the event propagate
    }, [mentionState, filteredUsers, insertMention]);

    return {
        mentionState,
        filteredUsers,
        handleTextChange,
        handleKeyDown,
        insertMention,
    };
}

