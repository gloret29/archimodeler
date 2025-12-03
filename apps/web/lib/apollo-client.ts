'use client';

import { ApolloClient, InMemoryCache, createHttpLink, split, from } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';
import { API_CONFIG } from './api/config';

/**
 * Crée l'URL GraphQL HTTP
 */
function getGraphQLHttpUrl(): string {
  const baseUrl = API_CONFIG.baseUrl;
  const useReverseProxy = process.env.NEXT_PUBLIC_USE_REVERSE_PROXY === 'true' ||
    (typeof window !== 'undefined' && baseUrl === window.location.origin);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const isUsingDirectApiUrl = apiUrl && baseUrl === apiUrl;
  
  let graphqlUrl = baseUrl;
  if (useReverseProxy && !isUsingDirectApiUrl) {
    graphqlUrl = `${baseUrl}/api/graphql`;
  } else {
    graphqlUrl = `${baseUrl}/graphql`;
  }
  
  return graphqlUrl;
}

/**
 * Crée l'URL GraphQL WebSocket
 */
function getGraphQLWsUrl(): string {
  const baseUrl = API_CONFIG.baseUrl;
  const useReverseProxy = process.env.NEXT_PUBLIC_USE_REVERSE_PROXY === 'true' ||
    (typeof window !== 'undefined' && baseUrl === window.location.origin);
  
  const apiUrl = process.env.NEXT_PUBLIC_API_URL;
  const isUsingDirectApiUrl = apiUrl && baseUrl === apiUrl;
  
  let wsUrl = baseUrl;
  if (useReverseProxy && !isUsingDirectApiUrl) {
    wsUrl = `${baseUrl}/api/graphql`;
  } else {
    wsUrl = `${baseUrl}/graphql`;
  }
  
  // Convertir http:// en ws:// et https:// en wss://
  wsUrl = wsUrl.replace(/^http:/, 'ws:').replace(/^https:/, 'wss:');
  
  return wsUrl;
}

// HTTP Link pour queries et mutations
const httpLink = createHttpLink({
  uri: getGraphQLHttpUrl(),
});

// WebSocket Link pour subscriptions (uniquement côté client)
const wsLink = typeof window !== 'undefined' 
  ? new GraphQLWsLink(
      createClient({
        url: getGraphQLWsUrl(),
        connectionParams: () => {
          const token = API_CONFIG.getAuthToken();
          return {
            authorization: token ? `Bearer ${token}` : '',
            token: token || '',
          };
        },
        shouldRetry: () => true,
      })
    )
  : null;

// Auth Link pour ajouter le token JWT aux requêtes HTTP
const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? API_CONFIG.getAuthToken() : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

// Split link : WebSocket pour subscriptions, HTTP pour queries/mutations
const splitLink = typeof window !== 'undefined' && wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink)
    )
  : authLink.concat(httpLink);

// Client Apollo
export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache({
    typePolicies: {
      // Politiques de cache personnalisées si nécessaire
    },
  }),
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
  },
});

