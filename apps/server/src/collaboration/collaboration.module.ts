import { Module, forwardRef } from '@nestjs/common';
import { CollaborationGateway } from './collaboration.gateway';
import { NotificationsModule } from '../notifications/notifications.module';
import { UsersModule } from '../users/users.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [
        forwardRef(() => NotificationsModule),
        forwardRef(() => UsersModule),
        PrismaModule,
    ],
    providers: [CollaborationGateway],
    exports: [CollaborationGateway],
})
export class CollaborationModule { }
