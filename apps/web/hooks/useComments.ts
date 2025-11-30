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
 * Hook pour récupérer et gérer les compteurs de commentaires pour plusieurs cibles.
 * 
 * Ce hook est utilisé pour afficher les badges de commentaires sur les éléments
 * et relations du canvas. Il récupère les threads de commentaires en parallèle
 * pour toutes les cibles fournies.
 * 
 * @param {Array<{type: CommentTargetType, id: string}>} targets - Liste des cibles pour lesquelles récupérer les commentaires
 * @returns {Object} Objet contenant la map des commentaires et l'état de chargement
 * @returns {CommentsMap} returns.commentsMap - Map des compteurs de commentaires par targetId
 * @returns {boolean} returns.loading - Indique si les commentaires sont en cours de chargement
 * 
 * @example
 * const { commentsMap, loading } = useComments([
 *   { type: 'ELEMENT', id: 'elem-1' },
 *   { type: 'ELEMENT', id: 'elem-2' }
 * ]);
 * 
 * const commentCount = commentsMap['elem-1']?.count || 0;
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

