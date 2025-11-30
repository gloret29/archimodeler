"use client";

import React, { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle2, MessageSquare, Send, MoreVertical, Edit2, Trash2 } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useTranslations } from 'next-intl';
import { useDialog } from '@/contexts/DialogContext';
import CommentItem from './CommentItem';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';
import MentionSuggestions from './MentionSuggestions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface CommentThread {
    id: string;
    targetType: string;
    targetId: string;
    resolved: boolean;
    resolvedAt?: Date | null;
    resolvedBy?: {
        id: string;
        name: string;
        email: string;
    } | null;
    createdAt: Date;
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

interface CommentThreadProps {
    thread: CommentThread;
    onUpdate: () => void;
    currentUserId?: string;
}

export default function CommentThread({ thread, onUpdate, currentUserId }: CommentThreadProps) {
    const t = useTranslations('Comments');
    const { alert, confirm } = useDialog();
    const [replyContent, setReplyContent] = useState('');
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const replyTextareaRef = useRef<HTMLTextAreaElement>(null);

    const {
        mentionState: replyMentionState,
        filteredUsers: replyFilteredUsers,
        handleTextChange: handleReplyTextChange,
        handleKeyDown: handleReplyKeyDown,
        insertMention: insertReplyMention,
    } = useMentionAutocomplete(replyContent, setReplyContent, replyTextareaRef);

    const handleReply = async (parentId?: string) => {
        if (!replyContent.trim()) return;

        try {
            await api.post(`/comments/threads/${thread.id}/comments`, {
                content: replyContent,
                parentId: parentId || undefined,
            });
            setReplyContent('');
            setReplyingTo(null);
            onUpdate();
        } catch (error: any) {
            console.error('Error adding reply:', error);
            await alert({
                title: t('error') || 'Error',
                message: error.message || t('failedToAddReply') || 'Failed to add reply',
                type: 'error',
            });
        }
    };

    const handleResolve = async () => {
        try {
            await api.put(`/comments/threads/${thread.id}/resolve`, {
                resolved: !thread.resolved,
            });
            onUpdate();
        } catch (error: any) {
            console.error('Error resolving thread:', error);
            await alert({
                title: t('error') || 'Error',
                message: error.message || t('failedToResolve') || 'Failed to resolve thread',
                type: 'error',
            });
        }
    };

    const handleEditComment = async (commentId: string) => {
        if (!editContent.trim()) return;

        try {
            await api.put(`/comments/comments/${commentId}`, {
                content: editContent,
            });
            setEditingCommentId(null);
            setEditContent('');
            onUpdate();
        } catch (error: any) {
            console.error('Error editing comment:', error);
            await alert({
                title: t('error') || 'Error',
                message: error.message || t('failedToEdit') || 'Failed to edit comment',
                type: 'error',
            });
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        const confirmed = await confirm({
            title: t('confirmDelete') || 'Delete Comment',
            description: t('confirmDeleteMessage') || 'Are you sure you want to delete this comment?',
            variant: 'destructive',
        });

        if (!confirmed) return;

        try {
            await api.delete(`/comments/comments/${commentId}`);
            onUpdate();
        } catch (error: any) {
            console.error('Error deleting comment:', error);
            await alert({
                title: t('error') || 'Error',
                message: error.message || t('failedToDelete') || 'Failed to delete comment',
                type: 'error',
            });
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const rootComments = thread.comments.filter(c => !c.parentId);

    return (
        <Card className={thread.resolved ? 'opacity-75' : ''}>
            <CardContent className="p-4 space-y-3">
                {/* Thread header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        {thread.resolved && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                            {thread.comments.length} {thread.comments.length === 1 ? 'comment' : 'comments'}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleResolve}
                            className="h-7 text-xs"
                        >
                            {thread.resolved ? t('unresolve') || 'Unresolve' : t('resolve') || 'Resolve'}
                        </Button>
                    </div>
                </div>

                {/* Comments */}
                <div className="space-y-3">
                    {rootComments.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            threadId={thread.id}
                            onReply={(parentId) => {
                                setReplyingTo(parentId);
                                setReplyContent('');
                            }}
                            onEdit={(commentId, content) => {
                                setEditingCommentId(commentId);
                                setEditContent(content);
                            }}
                            onDelete={handleDeleteComment}
                            onUpdate={onUpdate}
                            editingCommentId={editingCommentId}
                            editContent={editContent}
                            onEditContentChange={setEditContent}
                            onEditSave={handleEditComment}
                            onEditCancel={() => {
                                setEditingCommentId(null);
                                setEditContent('');
                            }}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>

                {/* Reply input */}
                {replyingTo && (
                    <div className="space-y-2 pl-8 border-l-2 border-muted">
                        <div className="relative">
                            <Textarea
                                ref={replyTextareaRef}
                                placeholder={t('writeReply') || 'Write a reply...'}
                                value={replyContent}
                                onChange={(e) => {
                                    handleReplyTextChange(e.target.value, e.target.selectionStart);
                                }}
                                onKeyDown={(e) => {
                                    const handled = handleReplyKeyDown(e);
                                    if (!handled && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        handleReply(replyingTo);
                                    }
                                }}
                                className="min-h-[60px]"
                            />
                            {replyMentionState && replyFilteredUsers.length > 0 && (
                                <MentionSuggestions
                                    users={replyFilteredUsers}
                                    selectedIndex={replyMentionState.selectedIndex}
                                    onSelect={insertReplyMention}
                                    position={replyMentionState.startIndex}
                                />
                            )}
                        </div>
                        <div className="flex gap-2">
                            <Button
                                onClick={() => handleReply(replyingTo)}
                                disabled={!replyContent.trim()}
                                size="sm"
                            >
                                <Send className="h-3 w-3 mr-1" />
                                {t('reply') || 'Reply'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setReplyingTo(null);
                                    setReplyContent('');
                                }}
                            >
                                {t('cancel') || 'Cancel'}
                            </Button>
                        </div>
                    </div>
                )}

                {/* New comment input (if not replying) */}
                {!replyingTo && (
                    <div className="space-y-2">
                        <div className="relative">
                            <Textarea
                                ref={replyTextareaRef}
                                placeholder={t('addReply') || 'Add a reply...'}
                                value={replyContent}
                                onChange={(e) => {
                                    handleReplyTextChange(e.target.value, e.target.selectionStart);
                                }}
                                onKeyDown={(e) => {
                                    const handled = handleReplyKeyDown(e);
                                    if (!handled && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                        e.preventDefault();
                                        handleReply();
                                    }
                                }}
                                className="min-h-[60px]"
                            />
                            {replyMentionState && replyFilteredUsers.length > 0 && (
                                <MentionSuggestions
                                    users={replyFilteredUsers}
                                    selectedIndex={replyMentionState.selectedIndex}
                                    onSelect={insertReplyMention}
                                    position={replyMentionState.startIndex}
                                />
                            )}
                        </div>
                        <Button
                            onClick={() => handleReply()}
                            disabled={!replyContent.trim()}
                            size="sm"
                            variant="outline"
                        >
                            <Send className="h-3 w-3 mr-1" />
                            {t('addReply') || 'Add Reply'}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

