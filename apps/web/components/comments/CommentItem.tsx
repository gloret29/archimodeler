"use client";

import React, { useState, useEffect, ReactNode, useRef } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, MoreVertical, Edit2, Trash2, Reply } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useMentionAutocomplete } from '@/hooks/useMentionAutocomplete';
import MentionSuggestions from './MentionSuggestions';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useLocale } from 'next-intl';

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

interface CommentItemProps {
    comment: Comment;
    threadId: string;
    onReply: (parentId: string) => void;
    onEdit: (commentId: string, content: string) => void;
    onDelete: (commentId: string) => void;
    onUpdate: () => void;
    editingCommentId: string | null;
    editContent: string;
    onEditContentChange: (content: string) => void;
    onEditSave: (commentId: string) => void;
    onEditCancel: () => void;
    currentUserId?: string;
}

export default function CommentItem({
    comment,
    threadId,
    onReply,
    onEdit,
    onDelete,
    onUpdate,
    editingCommentId,
    editContent,
    onEditContentChange,
    onEditSave,
    onEditCancel,
    currentUserId,
}: CommentItemProps) {
    const t = useTranslations('Comments');
    const locale = useLocale();
    const [isEditing, setIsEditing] = useState(editingCommentId === comment.id);
    const editTextareaRef = useRef<HTMLTextAreaElement>(null);

    const {
        mentionState: editMentionState,
        filteredUsers: editFilteredUsers,
        handleTextChange: handleEditTextChange,
        handleKeyDown: handleEditKeyDown,
        insertMention: insertEditMention,
    } = useMentionAutocomplete(editContent, onEditContentChange, editTextareaRef);

    useEffect(() => {
        setIsEditing(editingCommentId === comment.id);
        if (editingCommentId === comment.id) {
            onEditContentChange(comment.content);
        }
    }, [editingCommentId, comment.id, comment.content, onEditContentChange]);

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const formatMentions = (content: string): (string | ReactNode)[] => {
        // Highlight mentions in the content
        const mentionPattern = /@(\w+@?\w*\.?\w*)/g;
        const parts: (string | ReactNode)[] = [];
        let lastIndex = 0;
        let match;

        while ((match = mentionPattern.exec(content)) !== null) {
            // Add text before mention
            if (match.index > lastIndex) {
                parts.push(content.substring(lastIndex, match.index));
            }
            // Add mention as badge
            parts.push(
                <Badge key={match.index} variant="secondary" className="mx-1">
                    {match[0]}
                </Badge>
            );
            lastIndex = mentionPattern.lastIndex;
        }
        // Add remaining text
        if (lastIndex < content.length) {
            parts.push(content.substring(lastIndex));
        }

        return parts.length > 0 ? parts : [content];
    };

    const isAuthor = currentUserId === comment.author.id;
    const dateLocale = locale === 'fr' ? fr : enUS;
    
    // Convert dates to Date objects if they're strings (from JSON serialization)
    const createdAt = comment.createdAt instanceof Date ? comment.createdAt : new Date(comment.createdAt);
    const updatedAt = comment.updatedAt instanceof Date ? comment.updatedAt : new Date(comment.updatedAt);
    
    const timeAgo = formatDistanceToNow(createdAt, {
        addSuffix: true,
        locale: dateLocale,
    });

    return (
        <div className="space-y-2">
            <div className="flex gap-3">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                        {getInitials(comment.author.name || comment.author.email)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                                {comment.author.name || comment.author.email}
                            </span>
                            <span className="text-xs text-muted-foreground">{timeAgo}</span>
                            {updatedAt.getTime() !== createdAt.getTime() && (
                                <span className="text-xs text-muted-foreground">
                                    ({t('edited') || 'edited'})
                                </span>
                            )}
                        </div>
                        {isAuthor && (
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                                        <MoreVertical className="h-3 w-3" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                        onClick={() => onEdit(comment.id, comment.content)}
                                    >
                                        <Edit2 className="h-4 w-4 mr-2" />
                                        {t('edit') || 'Edit'}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() => onDelete(comment.id)}
                                        className="text-destructive"
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        {t('delete') || 'Delete'}
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        )}
                    </div>
                    {isEditing ? (
                        <div className="space-y-2">
                            <div className="relative">
                                <Textarea
                                    ref={editTextareaRef}
                                    value={editContent}
                                    onChange={(e) => {
                                        handleEditTextChange(e.target.value, e.target.selectionStart);
                                    }}
                                    onKeyDown={(e) => {
                                        const handled = handleEditKeyDown(e);
                                        if (!handled && e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                                            e.preventDefault();
                                            onEditSave(comment.id);
                                        }
                                    }}
                                    className="min-h-[60px]"
                                />
                                {editMentionState && editFilteredUsers.length > 0 && (
                                    <MentionSuggestions
                                        users={editFilteredUsers}
                                        selectedIndex={editMentionState.selectedIndex}
                                        onSelect={insertEditMention}
                                        position={editMentionState.startIndex}
                                    />
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button
                                    onClick={() => onEditSave(comment.id)}
                                    disabled={!editContent.trim()}
                                    size="sm"
                                >
                                    {t('save') || 'Save'}
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onEditCancel}
                                >
                                    {t('cancel') || 'Cancel'}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="text-sm whitespace-pre-wrap">
                            {formatMentions(comment.content)}
                        </div>
                    )}
                    {!isEditing && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onReply(comment.id)}
                            className="h-6 text-xs"
                        >
                            <Reply className="h-3 w-3 mr-1" />
                            {t('reply') || 'Reply'}
                        </Button>
                    )}
                </div>
            </div>

            {/* Replies */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="pl-8 space-y-2 border-l-2 border-muted">
                    {comment.replies.map((reply) => (
                        <CommentItem
                            key={reply.id}
                            comment={reply}
                            threadId={threadId}
                            onReply={onReply}
                            onEdit={onEdit}
                            onDelete={onDelete}
                            onUpdate={onUpdate}
                            editingCommentId={editingCommentId}
                            editContent={editContent}
                            onEditContentChange={onEditContentChange}
                            onEditSave={onEditSave}
                            onEditCancel={onEditCancel}
                            currentUserId={currentUserId}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

