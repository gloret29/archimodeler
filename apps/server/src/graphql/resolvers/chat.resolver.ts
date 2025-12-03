import { Resolver, Query, Mutation, Subscription, Args, Context, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { GraphQLPubSub } from '../pubsub';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationType, NotificationSeverity } from '@prisma/client';
import { Logger } from '@nestjs/common';

@ObjectType()
export class ChatMessage {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  from!: string;
  
  @Field(() => String)
  to!: string;
  
  @Field(() => String)
  message!: string;
  
  @Field(() => String)
  timestamp!: string;
  
  @Field(() => String, { nullable: true })
  senderName?: string;
}

@Resolver(() => ChatMessage)
export class ChatResolver {
  private readonly logger = new Logger(ChatResolver.name);

  constructor(
    private pubSub: GraphQLPubSub,
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  @Query(() => [ChatMessage])
  @UseGuards(GqlAuthGuard)
  async chatHistory(
    @Args('fromId') fromId: string,
    @Args('toId') toId: string,
    @Context() context: any,
  ): Promise<ChatMessage[]> {
    const userId = context.req.user?.userId;
    if (!userId) return [];

    const messages = await this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { fromId: fromId, toId: toId },
          { fromId: toId, toId: fromId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 100, // Limit to last 100 messages
    });

    return messages.map(msg => ({
      id: msg.id,
      from: msg.fromId,
      to: msg.toId,
      message: msg.message,
      timestamp: msg.createdAt.toISOString(),
      senderName: msg.fromId === userId ? context.req.user?.username : undefined,
    }));
  }

  @Mutation(() => ChatMessage)
  @UseGuards(GqlAuthGuard)
  async sendChatMessage(
    @Args('to') to: string,
    @Args('message') message: string,
    @Context() context: any,
  ): Promise<ChatMessage> {
    const from = context.req.user?.userId;
    if (!from) {
      throw new Error('User not authenticated');
    }

    // Save message to database
    const savedMessage = await this.prisma.chatMessage.create({
      data: {
        fromId: from,
        toId: to,
        message,
      },
    });

    const chatMessage: ChatMessage = {
      id: savedMessage.id,
      from,
      to,
      message,
      timestamp: savedMessage.createdAt.toISOString(),
      senderName: context.req.user?.username,
    };

    // Publish to both users (bidirectional)
    await this.pubSub.publish('chat-message', {
      chatMessage: {
        ...chatMessage,
        room1: `chat:${from}:${to}`,
        room2: `chat:${to}:${from}`,
      },
    });

    // Create notification for recipient
    try {
      await this.notificationsService.createNotification({
        userId: to,
        type: NotificationType.CHAT_MESSAGE,
        severity: NotificationSeverity.INFO,
        title: `Nouveau message de ${context.req.user?.username || 'User'}`,
        message: message.length > 100 ? message.substring(0, 100) + '...' : message,
        metadata: {
          from,
          fromName: context.req.user?.username || 'User',
          messageId: savedMessage.id,
          fullMessage: message,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create notification for chat message: ${error}`);
    }

    return chatMessage;
  }

  @Subscription(() => ChatMessage, {
    filter: (payload: { chatMessage: ChatMessage }, variables: any, context: any) => {
      const currentUserId = context.req?.user?.userId || context.connection?.context?.req?.user?.userId;
      if (!currentUserId) return false;
      
      // Check if message is for this user
      const msg = payload.chatMessage;
      return msg.from === currentUserId || msg.to === currentUserId;
    },
    resolve: (payload: { chatMessage: ChatMessage }) => payload.chatMessage,
  })
  @UseGuards(GqlAuthGuard)
  chatMessageAdded() {
    return this.pubSub.asyncIterator<{ chatMessage: ChatMessage }>('chat-message');
  }
}

