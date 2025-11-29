import { Module } from '@nestjs/common';
import { ModelService } from './model.service';
import { ModelController } from './model.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SearchModule } from '../search/search.module';

@Module({
    imports: [PrismaModule, SearchModule],
    controllers: [ModelController],
    providers: [ModelService],
    exports: [ModelService],
})
export class ModelModule { }
