import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrismaModule } from './prisma/prisma.module';
import { MetamodelModule } from './metamodel/metamodel.module';
import { ScriptingModule } from './scripting/scripting.module';

import { SearchModule } from './search/search.module';
import { ModelModule } from './model/model.module';
import { WorkflowModule } from './workflow/workflow.module';
import { ConnectorsModule } from './connectors/connectors.module';
import { AiModule } from './ai/ai.module';

@Module({
  imports: [AuthModule, UsersModule, PrismaModule, MetamodelModule, ScriptingModule, SearchModule, ModelModule, WorkflowModule, ConnectorsModule, AiModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
