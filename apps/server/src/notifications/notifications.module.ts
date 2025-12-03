import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/guards/roles.guard';
import { GraphQLModule } from '../graphql/graphql.module';

@Module({
    imports: [PrismaModule, AuthModule, forwardRef(() => GraphQLModule)],
    controllers: [NotificationsController],
    providers: [NotificationsService, RolesGuard],
    exports: [NotificationsService],
})
export class NotificationsModule {}
