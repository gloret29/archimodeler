import { Module, forwardRef, Logger } from '@nestjs/common';
import { GraphQLModule as NestGraphQLModule } from '@nestjs/graphql';
import { ApolloDriver, ApolloDriverConfig } from '@nestjs/apollo';
import { join } from 'path';
import { CollaborationResolver } from './resolvers/collaboration.resolver';
import { NotificationsResolver } from './resolvers/notifications.resolver';
import { ChatResolver } from './resolvers/chat.resolver';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { CommentsModule } from '../comments/comments.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GraphQLPubSub } from './pubsub';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { jwtConstants } from '../auth/constants';
import * as jwt from 'jsonwebtoken';

const logger = new Logger('GraphQLModule');

@Module({
  imports: [
    NestGraphQLModule.forRoot<ApolloDriverConfig>({
      driver: ApolloDriver,
      autoSchemaFile: join(process.cwd(), 'src/graphql/schema.gql'),
      sortSchema: true,
      subscriptions: {
        'graphql-ws': {
          path: '/graphql',
          onConnect: (context: any) => {
            // Extract JWT from connection params
            const token = context.connectionParams?.authorization?.replace('Bearer ', '') || 
                         context.connectionParams?.token;
            
            if (token) {
              try {
                // Decode the JWT to get user info
                const decoded = jwt.verify(token, jwtConstants.secret) as any;
                logger.debug(`WebSocket connection authenticated for user: ${decoded.sub || decoded.userId}`);
                return { 
                  token,
                  user: {
                    userId: decoded.sub || decoded.userId,
                    username: decoded.username || decoded.email,
                    email: decoded.email,
                  }
                };
              } catch (error) {
                logger.warn(`Invalid JWT token for WebSocket connection: ${error}`);
                return { token };
              }
            }
            
            logger.debug('WebSocket connection without authentication token');
            return {};
          },
        },
        'subscriptions-transport-ws': false, // Disable deprecated transport
      },
      context: ({ req, extra }: { req?: any; extra?: any }) => {
        // For HTTP requests
        if (req) {
          return { req };
        }
        // For WebSocket subscriptions (graphql-ws passes context in extra)
        if (extra) {
          return { 
            req: { user: extra.user },
            user: extra.user,
          };
        }
        return {};
      },
      playground: true,
      introspection: true,
    }),
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60m' },
    }),
    forwardRef(() => NotificationsModule),
    UsersModule,
    forwardRef(() => CommentsModule),
    PrismaModule,
  ],
  providers: [
    CollaborationResolver,
    NotificationsResolver,
    ChatResolver,
    GraphQLPubSub,
  ],
  exports: [GraphQLPubSub],
})
export class GraphQLModule {}

