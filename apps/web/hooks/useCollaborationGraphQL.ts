'use client';

/**
 * @fileoverview Hook pour gérer la collaboration en temps réel avec GraphQL.
 * 
 * Version GraphQL du hook useCollaboration qui remplace les WebSockets Socket.io
 * par des GraphQL Subscriptions.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useMutation, useSubscription } from '@apollo/client/react';
import {
  JOIN_VIEW,
  LEAVE_VIEW,
  UPDATE_CURSOR,
  UPDATE_NODE,
  UPDATE_EDGE,
  DELETE_NODE,
  DELETE_EDGE,
  NOTIFY_VIEW_SAVED,
  CURSOR_UPDATES,
  NODE_UPDATES,
  EDGE_UPDATES,
  NODE_DELETES,
  EDGE_DELETES,
  USER_JOINED,
  USER_LEFT,
  VIEW_SAVED,
} from '@/lib/graphql/collaboration';
import { User, CursorPosition } from '@/lib/types/collaboration';

export interface CollaborationState {
  users: User[];
  cursors: Record<string, CursorPosition>; // user.id -> position
  selections: Record<string, string[]>; // userId -> nodeIds
  isConnected: boolean;
}

interface UseCollaborationOptions {
  viewId: string;
  user: User;
  onNodeChanged?: (data: { userId: string; node: any }) => void;
  onEdgeChanged?: (data: { userId: string; edge: any }) => void;
  onNodeDeleted?: (data: { userId: string; nodeId: string }) => void;
  onEdgeDeleted?: (data: { userId: string; edgeId: string }) => void;
  onSelectionChanged?: (data: { userId: string; selectedNodes: string[] }) => void;
  onViewSaved?: (data: { viewId: string; savedBy: { id: string; name: string } }) => void;
}

/**
 * Hook pour gérer la collaboration en temps réel sur une vue avec GraphQL.
 */
export function useCollaborationGraphQL({
  viewId,
  user,
  onNodeChanged,
  onEdgeChanged,
  onNodeDeleted,
  onEdgeDeleted,
  onSelectionChanged,
  onViewSaved,
}: UseCollaborationOptions) {
  const [state, setState] = useState<CollaborationState>({
    users: [],
    cursors: {},
    selections: {},
    isConnected: false,
  });

  const onNodeChangedRef = useRef(onNodeChanged);
  const onEdgeChangedRef = useRef(onEdgeChanged);
  const onNodeDeletedRef = useRef(onNodeDeleted);
  const onEdgeDeletedRef = useRef(onEdgeDeleted);
  const onSelectionChangedRef = useRef(onSelectionChanged);
  const onViewSavedRef = useRef(onViewSaved);

  // Update refs when callbacks change
  useEffect(() => {
    onNodeChangedRef.current = onNodeChanged;
    onEdgeChangedRef.current = onEdgeChanged;
    onNodeDeletedRef.current = onNodeDeleted;
    onEdgeDeletedRef.current = onEdgeDeleted;
    onSelectionChangedRef.current = onSelectionChanged;
    onViewSavedRef.current = onViewSaved;
  }, [onNodeChanged, onEdgeChanged, onNodeDeleted, onEdgeDeleted, onSelectionChanged, onViewSaved]);

  // Mutations
  const [joinView] = useMutation(JOIN_VIEW);
  const [leaveView] = useMutation(LEAVE_VIEW);
  const [updateCursorMutation] = useMutation(UPDATE_CURSOR);
  const [updateNodeMutation] = useMutation(UPDATE_NODE);
  const [updateEdgeMutation] = useMutation(UPDATE_EDGE);
  const [deleteNodeMutation] = useMutation(DELETE_NODE);
  const [deleteEdgeMutation] = useMutation(DELETE_EDGE);
  const [notifyViewSavedMutation] = useMutation(NOTIFY_VIEW_SAVED);

  // Join view on mount
  useEffect(() => {
    if (!viewId || !user || !user.name || user.name.trim() === '' || user.name === 'User') {
      setState((prev) => ({ ...prev, isConnected: false }));
      return;
    }

    joinView({
      variables: {
        viewId,
        user: {
          id: user.id,
          name: user.name,
          color: user.color,
        },
      },
    })
      .then(() => {
        setState((prev) => ({ ...prev, isConnected: true }));
      })
      .catch((error) => {
        console.error('Failed to join view:', error);
        setState((prev) => ({ ...prev, isConnected: false }));
      });

    return () => {
      leaveView({
        variables: { viewId },
      }).catch((error) => {
        console.error('Failed to leave view:', error);
      });
    };
  }, [viewId, user.id, user.name, user.color]);

  // Subscriptions
  const { data: cursorData } = useSubscription<{ cursorUpdates: { userId: string; viewId: string; position: CursorPosition } }>(CURSOR_UPDATES, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: nodeData } = useSubscription<{ nodeUpdates: { userId: string; viewId: string; node: any } }>(NODE_UPDATES, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: edgeData } = useSubscription<{ edgeUpdates: { userId: string; viewId: string; edge: any } }>(EDGE_UPDATES, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: nodeDeleteData } = useSubscription<{ nodeDeletes: { userId: string; viewId: string; nodeId: string } }>(NODE_DELETES, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: edgeDeleteData } = useSubscription<{ edgeDeletes: { userId: string; viewId: string; edgeId: string } }>(EDGE_DELETES, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: userJoinedData } = useSubscription<{ userJoined: { userId: string; viewId: string; user: User; users: User[] } }>(USER_JOINED, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: userLeftData } = useSubscription<{ userLeft: { userId: string; viewId: string; users: User[] } }>(USER_LEFT, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  const { data: viewSavedData } = useSubscription<{ viewSaved: { viewId: string; savedBy: { id: string; name: string } } }>(VIEW_SAVED, {
    variables: { viewId },
    skip: !viewId || !state.isConnected,
  });

  // Handle subscription data
  useEffect(() => {
    if (cursorData?.cursorUpdates) {
      const { userId, position } = cursorData.cursorUpdates;
      setState((prev) => ({
        ...prev,
        cursors: {
          ...prev.cursors,
          [userId]: position,
        },
      }));
    }
  }, [cursorData]);

  useEffect(() => {
    if (nodeData?.nodeUpdates && onNodeChangedRef.current) {
      // Parse the JSON string node received from the server
      let parsedNode = nodeData.nodeUpdates.node;
      if (typeof parsedNode === 'string') {
        try {
          parsedNode = JSON.parse(parsedNode);
        } catch (e) {
          console.error('Failed to parse node JSON:', e);
          return;
        }
      }
      console.log('[Collaboration] Received node update:', parsedNode);
      onNodeChangedRef.current({
        userId: nodeData.nodeUpdates.userId,
        node: parsedNode,
      });
    }
  }, [nodeData]);

  useEffect(() => {
    if (edgeData?.edgeUpdates && onEdgeChangedRef.current) {
      // Parse the JSON string edge received from the server
      let parsedEdge = edgeData.edgeUpdates.edge;
      if (typeof parsedEdge === 'string') {
        try {
          parsedEdge = JSON.parse(parsedEdge);
        } catch (e) {
          console.error('Failed to parse edge JSON:', e);
          return;
        }
      }
      console.log('[Collaboration] Received edge update:', parsedEdge);
      onEdgeChangedRef.current({
        userId: edgeData.edgeUpdates.userId,
        edge: parsedEdge,
      });
    }
  }, [edgeData]);

  useEffect(() => {
    if (nodeDeleteData?.nodeDeletes && onNodeDeletedRef.current) {
      onNodeDeletedRef.current({
        userId: nodeDeleteData.nodeDeletes.userId,
        nodeId: nodeDeleteData.nodeDeletes.nodeId,
      });
    }
  }, [nodeDeleteData]);

  useEffect(() => {
    if (edgeDeleteData?.edgeDeletes && onEdgeDeletedRef.current) {
      onEdgeDeletedRef.current({
        userId: edgeDeleteData.edgeDeletes.userId,
        edgeId: edgeDeleteData.edgeDeletes.edgeId,
      });
    }
  }, [edgeDeleteData]);

  useEffect(() => {
    if (userJoinedData?.userJoined) {
      setState((prev) => ({
        ...prev,
        users: userJoinedData.userJoined.users,
      }));
    }
  }, [userJoinedData]);

  useEffect(() => {
    if (userLeftData?.userLeft) {
      setState((prev) => ({
        ...prev,
        users: userLeftData.userLeft.users,
        cursors: Object.fromEntries(
          Object.entries(prev.cursors).filter(
            ([userId]) => userLeftData.userLeft.users.some((u: User) => u.id === userId)
          )
        ),
      }));
    }
  }, [userLeftData]);

  useEffect(() => {
    if (viewSavedData?.viewSaved && onViewSavedRef.current) {
      onViewSavedRef.current({
        viewId: viewSavedData.viewSaved.viewId,
        savedBy: viewSavedData.viewSaved.savedBy,
      });
    }
  }, [viewSavedData]);

  // Methods to emit events
  const updateCursor = useCallback(
    (position: CursorPosition) => {
      updateCursorMutation({
        variables: { viewId, position },
      }).catch((error) => {
        console.error('Failed to update cursor:', error);
      });
    },
    [viewId, updateCursorMutation]
  );

  const updateNode = useCallback(
    (node: any) => {
      if (state.isConnected) {
        updateNodeMutation({
          variables: { viewId, node: JSON.stringify(node) },
        }).catch((error) => {
          console.error('Failed to update node:', error);
        });
      }
    },
    [viewId, updateNodeMutation, state.isConnected]
  );

  const updateEdge = useCallback(
    (edge: any) => {
      updateEdgeMutation({
        variables: { viewId, edge: JSON.stringify(edge) },
      }).catch((error) => {
        console.error('Failed to update edge:', error);
      });
    },
    [viewId, updateEdgeMutation]
  );

  const deleteNode = useCallback(
    (nodeId: string) => {
      deleteNodeMutation({
        variables: { viewId, nodeId },
      }).catch((error) => {
        console.error('Failed to delete node:', error);
      });
    },
    [viewId, deleteNodeMutation]
  );

  const deleteEdge = useCallback(
    (edgeId: string) => {
      deleteEdgeMutation({
        variables: { viewId, edgeId },
      }).catch((error) => {
        console.error('Failed to delete edge:', error);
      });
    },
    [viewId, deleteEdgeMutation]
  );

  const updateSelection = useCallback(
    (_selectedNodes: string[]) => {
      // Selection changes are not yet implemented in GraphQL
      // This can be added later if needed
    },
    []
  );

  const notifyViewSaved = useCallback(
    (savedBy: { id: string; name: string }) => {
      if (state.isConnected) {
        notifyViewSavedMutation({
          variables: { viewId, savedBy },
        }).catch((error) => {
          console.error('Failed to notify view saved:', error);
        });
      }
    },
    [viewId, notifyViewSavedMutation, state.isConnected]
  );

  return {
    ...state,
    updateCursor,
    updateNode,
    updateEdge,
    deleteNode,
    deleteEdge,
    updateSelection,
    notifyViewSaved,
  };
}

