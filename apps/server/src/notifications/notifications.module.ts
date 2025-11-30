import { Module, forwardRef } from '@nestjs/common';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CollaborationModule } from '../collaboration/collaboration.module';
import { AuthModule } from '../auth/auth.module';
import { RolesGuard } from '../auth/guards/roles.guard';

@Module({
    imports: [PrismaModule, forwardRef(() => CollaborationModule), AuthModule],
    controllers: [NotificationsController],
    providers: [NotificationsService, RolesGuard],
    exports: [NotificationsService],
})
export class NotificationsModule {}
