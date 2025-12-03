import { Injectable } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';

/**
 * Service de publication/souscription pour GraphQL Subscriptions.
 * Utilisé pour gérer les événements en temps réel (collaboration, notifications, chat).
 * 
 * Note: graphql-subscriptions v3 utilise asyncIterableIterator au lieu de asyncIterator
 */
@Injectable()
export class GraphQLPubSub {
  public readonly pubSub: PubSub;

  constructor() {
    this.pubSub = new PubSub();
  }

  /**
   * Publie un événement sur un topic
   */
  async publish<T>(trigger: string, payload: T): Promise<void> {
    await this.pubSub.publish(trigger, payload);
  }

  /**
   * Retourne un AsyncIterator pour s'abonner à un topic
   * Note: graphql-subscriptions v3 utilise asyncIterableIterator
   */
  asyncIterator<T>(triggers: string | string[]): AsyncIterableIterator<T> {
    // v3 uses asyncIterableIterator instead of asyncIterator
    if (typeof (this.pubSub as any).asyncIterableIterator === 'function') {
      return (this.pubSub as any).asyncIterableIterator(triggers);
    }
    // Fallback for older versions
    return (this.pubSub as any).asyncIterator(triggers);
  }
}

