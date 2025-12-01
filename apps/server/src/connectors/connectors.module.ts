import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConnectorsService } from './connectors.service';
import { ConnectorsController } from './connectors.controller';
import { ServiceNowConnector } from './servicenow/servicenow.connector';
import { BizDesignService } from './bizdesign/bizdesign.service';
import { BizDesignController } from './bizdesign/bizdesign.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { ModelModule } from '../model/model.module';

@Module({
    imports: [HttpModule, PrismaModule, ModelModule],
    controllers: [ConnectorsController, BizDesignController],
    providers: [ConnectorsService, ServiceNowConnector, BizDesignService],
    exports: [ConnectorsService, BizDesignService],
})
export class ConnectorsModule { }
