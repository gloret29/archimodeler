import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ModelService } from './model.service';
import { Prisma } from '@repo/database';


interface CreateElementDto {
    name: string;
    type: string;
    layer: string;
    packageId: string;
}

@Controller('model/elements')
export class ModelController {
    constructor(private readonly modelService: ModelService) { }

    @Post()
    async create(@Body() dto: CreateElementDto | Prisma.ElementCreateInput) {
        // Check if it's the simplified DTO
        if ('type' in dto && 'layer' in dto && 'packageId' in dto) {
            return this.modelService.createElementSimple(dto as CreateElementDto);
        }
        // Otherwise use the full Prisma input
        return this.modelService.createElement(dto as Prisma.ElementCreateInput);
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

@Controller('model/folders')
export class FolderController {
    constructor(private readonly modelService: ModelService) { }

    @Get()
    findAll() {
        return this.modelService.findAllFolders();
    }

    @Post()
    create(@Body() data: Prisma.FolderCreateInput) {
        return this.modelService.createFolder(data);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: Prisma.FolderUpdateInput) {
        return this.modelService.updateFolder(id, data);
    }
}

@Controller('model/views')
export class ViewController {
    constructor(private readonly modelService: ModelService) { }

    @Post()
    create(@Body() data: Prisma.ViewCreateInput) {
        return this.modelService.createView(data);
    }

    @Get(':id')
    findOne(@Param('id') id: string) {
        return this.modelService.getView(id);
    }

    @Put(':id')
    update(@Param('id') id: string, @Body() data: Prisma.ViewUpdateInput) {
        return this.modelService.updateView(id, data);
    }
}
