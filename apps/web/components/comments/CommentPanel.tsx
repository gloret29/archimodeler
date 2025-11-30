"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Send, Plus, ChevronUp, ChevronDown } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useTranslations } from 'next-intl';
import { useDialog } from '@/contexts/DialogContext';
import CommentThread from './CommentThread';
import { CommentTargetType } from '@/lib/types/comments';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';
import MentionSuggestions from './MentionSuggestions';

interface CommentThread {
    id: string;
    targetType: CommentTargetType;
    targetId: string;
    positionX?: number | null;
    positionY?: number | null;
    resolved: boolean;
    resolvedAt?: Date | null;
    resolvedBy?: {
        id: string;
        name: string;
        email: string;
    } | null;
    createdAt: Date;
    updatedAt: Date;
    comments: Comment[];
}

interface Comment {
    id: string;
    content: string;
    author: {
        id: string;
        name: string;
        email: string;
    };
    mentions: Array<{
        mentionedUser: {
            id: string;
            name: string;
            email: string;
        };
    }>;
    parentId?: string | null;
    replies?: Comment[];
    createdAt: Date;
    updatedAt: Date;
}

interface CommentPanelProps {
    targetType: CommentTargetType;
    targetId: string | null;
    targetName?: string;
    currentUserId?: string;
}

export default function CommentPanel({ targetType, targetId, targetName, currentUserId }: CommentPanelProps) {
    const t = useTranslations('Comments');
    const { alert, prompt } = useDialog();
    const [threads, setThreads] = useState<CommentThread[]>([]);
    const [loading, setLoading] = useState(false);
    const [newCommentContent, setNewCommentContent] = useState('');
    const [isCreatingThread, setIsCreatingThread] = useState(false);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const {
        mentionState,
        filteredUsers,
        handleTextChange,
        handleKeyDown,
        insertMention,
    } = useMentionAutocomplete(newCommentContent, setNewCommentContent, textareaRef);

    useEffect(() => {
        if (targetId) {
            fetchThreads();
        } else {
            setThreads([]);
        }
    }, [targetType, targetId]);

    // Listen for comment events via WebSocket to refresh comments
    useEffect(() => {
        const handleCommentEvent = () => {
            if (targetId) {
                fetchThreads();
            }
        };

        // Listen to global events for comment updates
        window.addEventListener('comment-thread-created', handleCommentEvent);
        window.addEventListener('comment-added', handleCommentEvent);
        window.addEventListener('thread-resolved', handleCommentEvent);

        return () => {
            window.removeEventListener('comment-thread-created', handleCommentEvent);
            window.removeEventListener('comment-added', handleCommentEvent);
            window.removeEventListener('thread-resolved', handleCommentEvent);
        };
    }, [targetId]);

    const fetchThreads = async () => {
        if (!targetId) return;
        
        setLoading(true);
        try {
            const data = await api.get<CommentThread[]>(
                `/comments/threads?targetType=${targetType}&targetId=${targetId}`
            );
            setThreads(data);
        } catch (error) {
            console.error('Error fetching threads:', error);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToFetchThreads') || 'Failed to fetch comment threads',
                type: 'error',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateThread = async () => {
        if (!targetId || !newCommentContent.trim()) return;

        setIsCreatingThread(true);
        try {
            const thread = await api.post<CommentThread>('/comments/threads', {
                targetType,
                targetId,
                initialComment: newCommentContent,
            });
            setThreads([thread, ...threads]);
            setNewCommentContent('');
            setIsCreatingThread(false);
        } catch (error: any) {
            console.error('Error creating thread:', error);
            await alert({
                title: t('error') || 'Error',
                message: error.message || t('failedToCreateThread') || 'Failed to create comment thread',
                type: 'error',
            });
            setIsCreatingThread(false);
        }
    };

    const handleThreadUpdate = () => {
        fetchThreads();
    };

    if (!targetId) {
        return (
            <Card className="mt-4">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <MessageSquare className="h-4 w-4" />
                            {t('title') || 'Comments'}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>
                {!isCollapsed && (
                    <CardContent>
                        <p className="text-sm text-muted-foreground">
                            {t('selectTarget') || 'Select an element or relationship to view comments'}
                        </p>
                    </CardContent>
                )}
            </Card>
        );
    }

    return (
        <Card className="mt-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="h-4 w-4" />
                        {t('title') || 'Comments'}
                        {threads.length > 0 && (
                            <span className="ml-2 text-xs text-muted-foreground">
                                ({threads.length})
                            </span>
                        )}
                    </CardTitle>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {!isCollapsed && (
            <CardContent className="space-y-4">
                {/* Create new thread */}
                <div className="space-y-2 relative">
                    <Textarea
                        ref={textareaRef}
                        placeholder={t('addComment') || 'Add a comment...'}
                        value={newCommentContent}
                        onChange={(e) => {
                            const value = e.target.value;
                            const cursorPos = e.target.selectionStart;
                            handleTextChange(value, cursorPos);
                        }}
                        onSelect={(e) => {
                            // Update mention detection when cursor moves
                            const target = e.target as HTMLTextAreaElement;
                            handleTextChange(newCommentContent, target.selectionStart);
                        }}
                        onKeyDown={(e) => {
                            const handled = handleKeyDown(e);
                            if (!handled && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                e.preventDefault();
                                handleCreateThread();
                            }
                        }}
                        className="min-h-[80px]"
                    />
                    {mentionState && filteredUsers.length > 0 && (
                        <MentionSuggestions
                            users={filteredUsers}
                            selectedIndex={mentionState.selectedIndex}
                            onSelect={insertMention}
                            position={mentionState.startIndex}
                        />
                    )}
                    <Button
                        onClick={handleCreateThread}
                        disabled={!newCommentContent.trim() || isCreatingThread}
                        size="sm"
                        className="w-full"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        {t('createThread') || 'Start Discussion'}
                    </Button>
                </div>

                {/* Threads list */}
                <ScrollArea className="h-[400px]">
                    {loading ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {t('loading') || 'Loading...'}
                        </p>
                    ) : threads.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            {t('noComments') || 'No comments yet. Start a discussion!'}
                        </p>
                    ) : (
                        <div className="space-y-4">
                            {threads.map((thread) => (
                                <CommentThread
                                    key={thread.id}
                                    thread={thread}
                                    onUpdate={handleThreadUpdate}
                                    currentUserId={currentUserId}
                                />
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </CardContent>
            )}
        </Card>
    );
}

