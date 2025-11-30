"use client";

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api/client';
import { CommentTargetType } from '@/lib/types/comments';

interface CommentThread {
    id: string;
    targetType: CommentTargetType;
    targetId: string;
    resolved: boolean;
    comments: Array<{ id: string }>;
}

interface CommentsMap {
    [targetId: string]: {
        count: number;
        unresolvedCount: number;
    };
}

/**
 * Hook to fetch and manage comment counts for multiple targets
 */
export function useComments(targets: Array<{ type: CommentTargetType; id: string }>) {
    const [commentsMap, setCommentsMap] = useState<CommentsMap>({});
    const [loading, setLoading] = useState(false);

    const fetchComments = useCallback(async () => {
        if (targets.length === 0) {
            setCommentsMap({});
            return;
        }

        setLoading(true);
        try {
            // Fetch comments for all targets in parallel
            const promises = targets.map(async (target) => {
                try {
                    const threads = await api.get<CommentThread[]>(
                        `/comments/threads?targetType=${target.type}&targetId=${target.id}`
                    );
                    return {
                        targetId: target.id,
                        threads,
                    };
                } catch (error) {
                    console.error(`Error fetching comments for ${target.type}:${target.id}`, error);
                    return {
                        targetId: target.id,
                        threads: [],
                    };
                }
            });

            const results = await Promise.all(promises);

            const newMap: CommentsMap = {};
            results.forEach(({ targetId, threads }) => {
                const unresolvedThreads = threads.filter(t => !t.resolved);
                newMap[targetId] = {
                    count: threads.length,
                    unresolvedCount: unresolvedThreads.length,
                };
            });

            setCommentsMap(newMap);
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    }, [targets]);

    useEffect(() => {
        fetchComments();
    }, [fetchComments]);

    const getCommentCount = useCallback((targetId: string) => {
        return commentsMap[targetId]?.count || 0;
    }, [commentsMap]);

    const getUnresolvedCount = useCallback((targetId: string) => {
        return commentsMap[targetId]?.unresolvedCount || 0;
    }, [commentsMap]);

    const hasComments = useCallback((targetId: string) => {
        return (commentsMap[targetId]?.count || 0) > 0;
    }, [commentsMap]);

    const hasUnresolvedComments = useCallback((targetId: string) => {
        return (commentsMap[targetId]?.unresolvedCount || 0) > 0;
    }, [commentsMap]);

    return {
        commentsMap,
        loading,
        getCommentCount,
        getUnresolvedCount,
        hasComments,
        hasUnresolvedComments,
        refresh: fetchComments,
    };
}

