import { Module } from '@nestjs/common';
import { WorkflowService } from './workflow.service';
import { WorkflowController } from './workflow.controller';
import { QualityService } from './quality.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [WorkflowController],
    providers: [WorkflowService, QualityService],
    exports: [WorkflowService],
})
export class WorkflowModule { }
