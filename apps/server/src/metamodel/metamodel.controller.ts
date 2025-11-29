import { Controller, Post, Body, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { MetamodelService } from './metamodel.service';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Metamodel')
@Controller('metamodels')
export class MetamodelController {
    constructor(private readonly metamodelService: MetamodelService) { }

    @Post('import')
    @UseGuards(AuthGuard('jwt'), RolesGuard)
    @Roles('System Administrator', 'Lead Designer')
    @ApiBearerAuth('JWT-auth')
    @ApiOperation({ summary: 'Import metamodel', description: 'Import a metamodel definition. Requires System Administrator or Lead Designer role.' })
    @ApiResponse({ status: 201, description: 'Metamodel imported successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async import(@Body() json: any) {
        return this.metamodelService.importMetamodel(json);
    }

    @Get(':name')
    @ApiOperation({ summary: 'Get metamodel by name', description: 'Retrieve a specific metamodel by its name' })
    @ApiParam({ name: 'name', description: 'Metamodel name', example: 'archimate' })
    @ApiResponse({ status: 200, description: 'Metamodel retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Metamodel not found' })
    async get(@Param('name') name: string) {
        return this.metamodelService.getMetamodel(name);
    }
}
