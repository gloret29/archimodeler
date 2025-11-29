import { Module } from '@nestjs/common';
import { MetamodelService } from './metamodel.service';
import { MetamodelController } from './metamodel.controller';

@Module({
    providers: [MetamodelService],
    controllers: [MetamodelController],
    exports: [MetamodelService],
})
export class MetamodelModule { }
