import { Resolver, Subscription, Mutation, Args, Context, InputType, Field, ObjectType } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { GraphQLPubSub } from '../pubsub';
import { Logger, Inject, forwardRef } from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { PrismaService } from '../../prisma/prisma.service';

// GraphQL Input Types
@InputType()
export class UserInput {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  name!: string;
  
  @Field(() => String)
  color!: string;
}

@InputType()
export class CursorPositionInput {
  @Field(() => Number)
  x!: number;
  
  @Field(() => Number)
  y!: number;
}

@InputType()
export class SavedByInput {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  name!: string;
}

@InputType()
export class NodeInput {
  @Field(() => String)
  id!: string;
  
  @Field(() => String, { nullable: true })
  type?: string;
  
  @Field(() => String, { nullable: true })
  data?: string;
  
  @Field(() => CursorPositionInput, { nullable: true })
  position?: CursorPositionInput;
}

@InputType()
export class EdgeInput {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  source!: string;
  
  @Field(() => String)
  target!: string;
  
  @Field(() => String, { nullable: true })
  type?: string;
  
  @Field(() => String, { nullable: true })
  data?: string;
}

// GraphQL Output Types
@ObjectType()
export class User {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  name!: string;
  
  @Field(() => String)
  color!: string;
}

@ObjectType()
export class CursorPosition {
  @Field(() => Number)
  x!: number;
  
  @Field(() => Number)
  y!: number;
}

@ObjectType()
export class SavedBy {
  @Field(() => String)
  id!: string;
  
  @Field(() => String)
  name!: string;
}

@ObjectType()
export class CursorUpdate {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => CursorPosition)
  position!: CursorPosition;
}

@ObjectType()
export class NodeUpdate {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => String)
  node!: string;
}

@ObjectType()
export class EdgeUpdate {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => String)
  edge!: string;
}

@ObjectType()
export class NodeDelete {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => String)
  nodeId!: string;
}

@ObjectType()
export class EdgeDelete {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => String)
  edgeId!: string;
}

@ObjectType()
export class UserJoined {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => User)
  user!: User;
  
  @Field(() => [User])
  users!: User[];
}

@ObjectType()
export class UserLeft {
  @Field(() => String)
  userId!: string;
  
  @Field(() => String)
  viewId!: string;
  
  @Field(() => [User])
  users!: User[];
}

@ObjectType()
export class ViewSaved {
  @Field(() => String)
  viewId!: string;
  
  @Field(() => SavedBy)
  savedBy!: SavedBy;
}

@Resolver()
export class CollaborationResolver {
  private readonly logger = new Logger(CollaborationResolver.name);
  private viewSessions: Map<string, Map<string, User>> = new Map(); // viewId -> userId -> User

  constructor(
    private pubSub: GraphQLPubSub,
    @Inject(forwardRef(() => UsersService))
    private usersService: UsersService,
    private prisma: PrismaService,
  ) {}

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async joinView(
    @Args('viewId') viewId: string,
    @Args('user', { type: () => UserInput }) userInput: UserInput,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId || userInput.id;
    
    // Enrich user with name from database if missing
    let enrichedUser = { ...userInput };
    if (!enrichedUser.name || enrichedUser.name.trim() === '' || enrichedUser.name === 'User') {
      try {
        const dbUser = await this.usersService.findById(userId);
        if (dbUser) {
          enrichedUser.name = dbUser.name || dbUser.email || 'User';
        }
      } catch (error) {
        this.logger.warn(`Failed to fetch user ${userId}: ${error}`);
      }
    }

    // Initialize session if it doesn't exist
    if (!this.viewSessions.has(viewId)) {
      this.viewSessions.set(viewId, new Map());
    }

    const session = this.viewSessions.get(viewId)!;
    session.set(userId, enrichedUser);

    // Get all users in the view
    const users = Array.from(session.values());

    // Publish user joined event
    await this.pubSub.publish('user-joined', {
      userJoined: {
        userId,
        viewId,
        user: enrichedUser,
        users,
      },
    });

    this.logger.log(`User ${enrichedUser.name} joined view ${viewId}`);
    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async leaveView(
    @Args('viewId') viewId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    const session = this.viewSessions.get(viewId);
    if (session) {
      session.delete(userId);
      const users = Array.from(session.values());

      await this.pubSub.publish('user-left', {
        userLeft: {
          userId,
          viewId,
          users,
        },
      });

      if (session.size === 0) {
        this.viewSessions.delete(viewId);
      }
    }

    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async updateCursor(
    @Args('viewId') viewId: string,
    @Args('position', { type: () => CursorPositionInput }) position: CursorPositionInput,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    await this.pubSub.publish('cursor-update', {
      cursorUpdate: {
        userId,
        viewId,
        position,
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async updateNode(
    @Args('viewId') viewId: string,
    @Args('node') node: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    await this.pubSub.publish('node-update', {
      nodeUpdate: {
        userId,
        viewId,
        node, // Already a JSON string from frontend
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async updateEdge(
    @Args('viewId') viewId: string,
    @Args('edge') edge: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    await this.pubSub.publish('edge-update', {
      edgeUpdate: {
        userId,
        viewId,
        edge, // Already a JSON string from frontend
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteNode(
    @Args('viewId') viewId: string,
    @Args('nodeId') nodeId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    await this.pubSub.publish('node-delete', {
      nodeDelete: {
        userId,
        viewId,
        nodeId,
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async deleteEdge(
    @Args('viewId') viewId: string,
    @Args('edgeId') edgeId: string,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    await this.pubSub.publish('edge-delete', {
      edgeDelete: {
        userId,
        viewId,
        edgeId,
      },
    });

    return true;
  }

  @Mutation(() => Boolean)
  @UseGuards(GqlAuthGuard)
  async notifyViewSaved(
    @Args('viewId') viewId: string,
    @Args('savedBy', { type: () => SavedByInput }) savedBy: SavedByInput,
    @Context() context: any,
  ): Promise<boolean> {
    const userId = context.req.user?.userId;
    if (!userId) return false;

    await this.pubSub.publish('view-saved', {
      viewSaved: {
        viewId,
        savedBy: savedBy || { id: userId, name: context.req.user?.username || 'User' },
      },
    });

    return true;
  }

  // Helper to extract userId from context
  private extractUserId(context: any): string | undefined {
    return context?.user?.userId || 
           context?.req?.user?.userId ||
           context?.extra?.user?.userId;
  }

  // Subscriptions
  @Subscription(() => CursorUpdate, {
    filter: (payload: { cursorUpdate: CursorUpdate }, variables: { viewId: string }, context: any) => {
      // Filter by viewId and exclude own updates
      const userId = context?.user?.userId || context?.req?.user?.userId || context?.extra?.user?.userId;
      const isOwnUpdate = userId && payload.cursorUpdate.userId === userId;
      return payload.cursorUpdate.viewId === variables.viewId && !isOwnUpdate;
    },
    resolve: (payload: { cursorUpdate: CursorUpdate }) => payload.cursorUpdate,
  })
  cursorUpdates(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ cursorUpdate: CursorUpdate }>('cursor-update');
  }

  @Subscription(() => NodeUpdate, {
    filter: function(this: CollaborationResolver, payload: { nodeUpdate: NodeUpdate }, variables: { viewId: string }, context: any) {
      // Filter by viewId and exclude own updates
      const userId = context?.user?.userId || context?.req?.user?.userId || context?.extra?.user?.userId;
      const isOwnUpdate = userId && payload.nodeUpdate.userId === userId;
      const viewMatches = payload.nodeUpdate.viewId === variables.viewId;
      
      // Log for debugging (can be removed in production)
      console.log(`[NodeUpdate filter] viewId match: ${viewMatches}, isOwnUpdate: ${isOwnUpdate}, payloadUserId: ${payload.nodeUpdate.userId}, contextUserId: ${userId}`);
      
      return viewMatches && !isOwnUpdate;
    },
    resolve: (payload: { nodeUpdate: NodeUpdate }) => payload.nodeUpdate,
  })
  nodeUpdates(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ nodeUpdate: NodeUpdate }>('node-update');
  }

  @Subscription(() => EdgeUpdate, {
    filter: (payload: { edgeUpdate: EdgeUpdate }, variables: { viewId: string }, context: any) => {
      const userId = context?.user?.userId || context?.req?.user?.userId || context?.extra?.user?.userId;
      const isOwnUpdate = userId && payload.edgeUpdate.userId === userId;
      return payload.edgeUpdate.viewId === variables.viewId && !isOwnUpdate;
    },
    resolve: (payload: { edgeUpdate: EdgeUpdate }) => payload.edgeUpdate,
  })
  edgeUpdates(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ edgeUpdate: EdgeUpdate }>('edge-update');
  }

  @Subscription(() => NodeDelete, {
    filter: (payload: { nodeDelete: NodeDelete }, variables: { viewId: string }, context: any) => {
      const userId = context?.user?.userId || context?.req?.user?.userId || context?.extra?.user?.userId;
      const isOwnUpdate = userId && payload.nodeDelete.userId === userId;
      return payload.nodeDelete.viewId === variables.viewId && !isOwnUpdate;
    },
    resolve: (payload: { nodeDelete: NodeDelete }) => payload.nodeDelete,
  })
  nodeDeletes(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ nodeDelete: NodeDelete }>('node-delete');
  }

  @Subscription(() => EdgeDelete, {
    filter: (payload: { edgeDelete: EdgeDelete }, variables: { viewId: string }, context: any) => {
      const userId = context?.user?.userId || context?.req?.user?.userId || context?.extra?.user?.userId;
      const isOwnUpdate = userId && payload.edgeDelete.userId === userId;
      return payload.edgeDelete.viewId === variables.viewId && !isOwnUpdate;
    },
    resolve: (payload: { edgeDelete: EdgeDelete }) => payload.edgeDelete,
  })
  edgeDeletes(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ edgeDelete: EdgeDelete }>('edge-delete');
  }

  @Subscription(() => UserJoined, {
    filter: (payload: { userJoined: UserJoined }, variables: { viewId: string }) => 
      payload.userJoined.viewId === variables.viewId,
    resolve: (payload: { userJoined: UserJoined }) => payload.userJoined,
  })
  userJoined(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ userJoined: UserJoined }>('user-joined');
  }

  @Subscription(() => UserLeft, {
    filter: (payload: { userLeft: UserLeft }, variables: { viewId: string }) => 
      payload.userLeft.viewId === variables.viewId,
    resolve: (payload: { userLeft: UserLeft }) => payload.userLeft,
  })
  userLeft(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ userLeft: UserLeft }>('user-left');
  }

  @Subscription(() => ViewSaved, {
    filter: (payload: { viewSaved: ViewSaved }, variables: { viewId: string }) => 
      payload.viewSaved.viewId === variables.viewId,
    resolve: (payload: { viewSaved: ViewSaved }) => payload.viewSaved,
  })
  viewSaved(@Args('viewId') viewId: string) {
    return this.pubSub.asyncIterator<{ viewSaved: ViewSaved }>('view-saved');
  }
}

