import { Controller, Get, Post, Body, Param, Delete, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Prisma } from '@repo/database';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    @ApiOperation({ summary: 'Get all roles', description: 'Retrieve all roles in the system' })
    @ApiResponse({ status: 200, description: 'List of roles retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get role by ID', description: 'Retrieve a specific role by its ID' })
    @ApiParam({ name: 'id', description: 'Role ID', example: 'role-123' })
    @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @Post()
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Create a new role', description: 'Create a new role. Requires System Administrator role.' })
    @ApiResponse({ status: 201, description: 'Role created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    create(@Body() data: Prisma.RoleCreateInput) {
        return this.rolesService.create(data);
    }

    @Put(':id')
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Update a role', description: 'Update an existing role. Requires System Administrator role.' })
    @ApiParam({ name: 'id', description: 'Role ID', example: 'role-123' })
    @ApiResponse({ status: 200, description: 'Role updated successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    update(@Param('id') id: string, @Body() data: Prisma.RoleUpdateInput) {
        return this.rolesService.update(id, data);
    }

    @Delete(':id')
    @Roles('System Administrator')
    @ApiOperation({ summary: 'Delete a role', description: 'Delete a role from the system. Requires System Administrator role.' })
    @ApiParam({ name: 'id', description: 'Role ID', example: 'role-123' })
    @ApiResponse({ status: 200, description: 'Role deleted successfully' })
    @ApiResponse({ status: 404, description: 'Role not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
