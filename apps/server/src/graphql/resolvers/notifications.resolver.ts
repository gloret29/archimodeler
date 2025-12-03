import { Resolver, Query, Subscription, Args, Context, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { GraphQLPubSub } from '../pubsub';
import { NotificationsService } from '../../notifications/notifications.service';
import { Logger } from '@nestjs/common';

@ObjectType()
export class Notification {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  type!: string;
  
  @Field(() => String)
  severity!: string;
  
  @Field(() => String)
  title!: string;
  
  @Field(() => String)
  message!: string;
  
  @Field(() => Boolean)
  read!: boolean;
  
  @Field(() => String)
  createdAt!: string;
  
  @Field(() => String, { nullable: true })
  metadata?: string;
}

@Resolver(() => Notification)
export class NotificationsResolver {
  private readonly logger = new Logger(NotificationsResolver.name);

  constructor(
    private pubSub: GraphQLPubSub,
    private notificationsService: NotificationsService,
  ) {}

  @Query(() => [Notification])
  @UseGuards(GqlAuthGuard)
  async notifications(@Context() context: any): Promise<Notification[]> {
    const userId = context.req.user?.userId;
    if (!userId) return [];

    const notifications = await this.notificationsService.getUserNotifications(userId);
    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      severity: n.severity,
      title: n.title,
      message: n.message,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
      metadata: n.metadata ? JSON.stringify(n.metadata) : undefined,
    }));
  }

  @Query(() => Number)
  @UseGuards(GqlAuthGuard)
  async unreadNotificationCount(@Context() context: any): Promise<number> {
    const userId = context.req.user?.userId;
    if (!userId) return 0;

    return this.notificationsService.getUnreadCount(userId);
  }

  @Subscription(() => Notification, {
    filter: (payload: { notificationAdded: { userId: string; notification: Notification } }, variables: any, context: any) => {
      const currentUserId = context.req?.user?.userId || context.connection?.context?.req?.user?.userId;
      return payload.notificationAdded.userId === currentUserId;
    },
    resolve: (payload: { notificationAdded: { userId: string; notification: Notification } }) => payload.notificationAdded.notification,
  })
  @UseGuards(GqlAuthGuard)
  notificationAdded() {
    return this.pubSub.asyncIterator<{ notificationAdded: { userId: string; notification: Notification } }>('notification-added');
  }
}

