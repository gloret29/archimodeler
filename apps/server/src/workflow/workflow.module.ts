import { Module, forwardRef } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { QualityService } from './quality.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [PrismaModule, forwardRef(() => NotificationsModule)],
    controllers: [WorkflowController],
    providers: [WorkflowService, QualityService],
    exports: [WorkflowService],
})
export class WorkflowModule { }
