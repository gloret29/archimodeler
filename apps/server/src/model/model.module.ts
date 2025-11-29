import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController, ModelPackageController, FolderController, ViewController } from './model.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [PrismaModule, SearchModule],
    controllers: [ModelController, ModelPackageController, FolderController, ViewController],
    providers: [ModelService],
    exports: [ModelService],
})
export class ModelModule { }
