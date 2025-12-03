import { gql } from '@apollo/client';

// Types
export interface ChatMessage {
  id: string;
  from: string;
  to: string;
  message: string;
  timestamp: string;
  senderName?: string;
}

// Queries
export const CHAT_HISTORY = gql`
  query ChatHistory($fromId: String!, $toId: String!) {
    chatHistory(fromId: $fromId, toId: $toId) {
      id
      from
      to
      message
      timestamp
      senderName
    }
  }
`;

// Mutations
export const SEND_CHAT_MESSAGE = gql`
  mutation SendChatMessage($to: String!, $message: String!) {
    sendChatMessage(to: $to, message: $message) {
      id
      from
      to
      message
      timestamp
      senderName
    }
  }
`;

// Subscriptions
export const CHAT_MESSAGE_ADDED = gql`
  subscription ChatMessageAdded {
    chatMessageAdded {
      id
      from
      to
      message
      timestamp
      senderName
    }
  }
`;

