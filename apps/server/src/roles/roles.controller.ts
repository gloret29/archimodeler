import { Controller, Get, Post, Body, Param, Delete, Put } from '@nestjs/common';
import { RolesService } from './roles.service';
import { Prisma } from '@repo/database';

@Controller('roles')
export class RolesController {
    constructor(private readonly rolesService: RolesService) { }

    @Get()
    findAll() {
        return this.rolesService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.rolesService.findOne(id);
    }

    @Post()
    create(@Body() data: Prisma.RoleCreateInput) {
        return this.rolesService.create(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: Prisma.RoleUpdateInput) {
        return this.rolesService.update(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.rolesService.remove(id);
    }
}
