/**
 * @fileoverview Module racine de l'application NestJS.
 * 
 * Importe et configure tous les modules de l'application :
 * - Authentification et autorisation
 * - Gestion des utilisateurs et rôles
 * - Modélisation (éléments, relations, vues)
 * - Collaboration en temps réel
 * - Commentaires et annotations
 * - Notifications
 * - Et autres modules métier
 */

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
import { SettingsModule } from './settings/settings.module';
import { RolesModule } from './roles/roles.module';
import { CollaborationModule } from './collaboration/collaboration.module';
import { StereotypesModule } from './stereotypes/stereotypes.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CommentsModule } from './comments/comments.module';

/**
 * Module racine de l'application ArchiModeler.
 * 
 * @class AppModule
 */
@Module({
  imports: [AuthModule, UsersModule, PrismaModule, MetamodelModule, ScriptingModule, SearchModule, ModelModule, WorkflowModule, ConnectorsModule, AiModule, SettingsModule, RolesModule, CollaborationModule, StereotypesModule, NotificationsModule, CommentsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
