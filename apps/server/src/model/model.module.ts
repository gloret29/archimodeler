import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController, ModelPackageController, FolderController, ViewController } from './model.controller';
import { RelationshipsController } from './relationships.controller';
import { RelationshipsService } from './relationships.service';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [PrismaModule, SearchModule],
    controllers: [ModelController, ModelPackageController, FolderController, ViewController, RelationshipsController],
    providers: [ModelService, RelationshipsService],
    exports: [ModelService, RelationshipsService],
})
export class ModelModule { }
