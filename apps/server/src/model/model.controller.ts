import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ModelService } from './model.service';
import { Prisma } from '@repo/database';

@Controller('model/elements')
export class ModelController {
    constructor(private readonly modelService: ModelService) { }

    @Post()
    create(@Body() data: Prisma.ElementCreateInput) {
        return this.modelService.createElement(data);
    }

    @Get()
    findAll() {
        return this.modelService.findAllElements();
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.modelService.getElement(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: Prisma.ElementUpdateInput) {
        return this.modelService.updateElement(id, data);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.modelService.deleteElement(id);
    }
}

@Controller('model/packages')
export class ModelPackageController {
    constructor(private readonly modelService: ModelService) { }

    @Get()
    findAll() {
        return this.modelService.findAllPackages();
    }

    @Post()
    create(@Body() data: Prisma.ModelPackageCreateInput) {
        return this.modelService.createPackage(data);
    }
}
