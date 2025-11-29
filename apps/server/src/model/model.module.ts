import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController, ModelPackageController, FolderController, ViewController } from './model.controller';
import { RelationshipsController } from './relationships.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';
import { Neo4jModule } from '../neo4j/neo4j.module';

@Module({
    imports: [PrismaModule, SearchModule, Neo4jModule],
    controllers: [ModelController, ModelPackageController, FolderController, ViewController, RelationshipsController],
    providers: [ModelService],
    exports: [ModelService],
})
export class ModelModule { }
