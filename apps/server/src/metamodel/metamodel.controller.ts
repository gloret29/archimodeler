import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { MetamodelService } from './metamodel.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('metamodels')
export class MetamodelController {
    constructor(private readonly metamodelService: MetamodelService) { }

    @Post('import')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('System Administrator', 'Lead Designer')
    async import(@Body() json: any) {
        return this.metamodelService.importMetamodel(json);
    }

    @Get(':name')
    async get(@Param('name') name: string) {
        return this.metamodelService.getMetamodel(name);
    }
}
