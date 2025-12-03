import { gql } from '@apollo/client';

// Types
export interface User {
  id: string;
  name: string;
  color: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}

// Mutations
export const JOIN_VIEW = gql`
  mutation JoinView($viewId: String!, $user: UserInput!) {
    joinView(viewId: $viewId, user: $user)
  }
`;

export const LEAVE_VIEW = gql`
  mutation LeaveView($viewId: String!) {
    leaveView(viewId: $viewId)
  }
`;

export const UPDATE_CURSOR = gql`
  mutation UpdateCursor($viewId: String!, $position: CursorPositionInput!) {
    updateCursor(viewId: $viewId, position: $position)
  }
`;

export const UPDATE_NODE = gql`
  mutation UpdateNode($viewId: String!, $node: String!) {
    updateNode(viewId: $viewId, node: $node)
  }
`;

export const UPDATE_EDGE = gql`
  mutation UpdateEdge($viewId: String!, $edge: String!) {
    updateEdge(viewId: $viewId, edge: $edge)
  }
`;

export const DELETE_NODE = gql`
  mutation DeleteNode($viewId: String!, $nodeId: String!) {
    deleteNode(viewId: $viewId, nodeId: $nodeId)
  }
`;

export const DELETE_EDGE = gql`
  mutation DeleteEdge($viewId: String!, $edgeId: String!) {
    deleteEdge(viewId: $viewId, edgeId: $edgeId)
  }
`;

export const NOTIFY_VIEW_SAVED = gql`
  mutation NotifyViewSaved($viewId: String!, $savedBy: SavedByInput!) {
    notifyViewSaved(viewId: $viewId, savedBy: $savedBy)
  }
`;

// Subscriptions
export const CURSOR_UPDATES = gql`
  subscription CursorUpdates($viewId: String!) {
    cursorUpdates(viewId: $viewId) {
      userId
      viewId
      position {
        x
        y
      }
    }
  }
`;

export const NODE_UPDATES = gql`
  subscription NodeUpdates($viewId: String!) {
    nodeUpdates(viewId: $viewId) {
      userId
      viewId
      node
    }
  }
`;

export const EDGE_UPDATES = gql`
  subscription EdgeUpdates($viewId: String!) {
    edgeUpdates(viewId: $viewId) {
      userId
      viewId
      edge
    }
  }
`;

export const NODE_DELETES = gql`
  subscription NodeDeletes($viewId: String!) {
    nodeDeletes(viewId: $viewId) {
      userId
      viewId
      nodeId
    }
  }
`;

export const EDGE_DELETES = gql`
  subscription EdgeDeletes($viewId: String!) {
    edgeDeletes(viewId: $viewId) {
      userId
      viewId
      edgeId
    }
  }
`;

export const USER_JOINED = gql`
  subscription UserJoined($viewId: String!) {
    userJoined(viewId: $viewId) {
      userId
      viewId
      user {
        id
        name
        color
      }
      users {
        id
        name
        color
      }
    }
  }
`;

export const USER_LEFT = gql`
  subscription UserLeft($viewId: String!) {
    userLeft(viewId: $viewId) {
      userId
      viewId
      users {
        id
        name
        color
      }
    }
  }
`;

export const VIEW_SAVED = gql`
  subscription ViewSaved($viewId: String!) {
    viewSaved(viewId: $viewId) {
      viewId
      savedBy {
        id
        name
      }
    }
  }
`;



