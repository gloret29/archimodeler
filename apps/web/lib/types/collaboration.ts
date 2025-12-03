/**
 * Types partagés pour la collaboration
 * Utilisés par les hooks WebSocket et GraphQL
 */

export interface User {
  id: string;
  name: string;
  color: string;
}

export interface CursorPosition {
  x: number;
  y: number;
}




