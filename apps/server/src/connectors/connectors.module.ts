import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConnectorsService } from './connectors.service';
import { ConnectorsController } from './connectors.controller';
import { ServiceNowConnector } from './servicenow/servicenow.connector';
import { PrismaModule } from '../prisma/prisma.module';
import { ModelModule } from '../model/model.module';

@Module({
    imports: [HttpModule, PrismaModule, ModelModule],
    controllers: [ConnectorsController],
    providers: [ConnectorsService, ServiceNowConnector],
    exports: [ConnectorsService],
})
export class ConnectorsModule { }
