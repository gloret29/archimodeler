import { Module, forwardRef } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { GraphQLModule } from '../graphql/graphql.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationsModule), forwardRef(() => GraphQLModule)],
    controllers: [CommentsController],
    providers: [CommentsService],
    exports: [CommentsService],
})
export class CommentsModule { }

