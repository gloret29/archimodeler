'use client';

import { ApolloProvider as ApolloProviderClient } from '@apollo/client/react';
import { apolloClient } from '@/lib/apollo-client';

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return (
    <ApolloProviderClient client={apolloClient}>
      {children}
    </ApolloProviderClient>
  );
}

