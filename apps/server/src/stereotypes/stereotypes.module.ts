import { Module } from '@nestjs/common';
import { StereotypesService } from './stereotypes.service';
import { StereotypesController } from './stereotypes.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [StereotypesController],
    providers: [StereotypesService],
    exports: [StereotypesService],
})
export class StereotypesModule { }

