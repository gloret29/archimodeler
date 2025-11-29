import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { ModelService } from './model.service';
import { Prisma } from '@repo/database';
import { CreateElementDto } from './dto/create-element.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Model - Elements')
@Controller('model/elements')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class ModelController {
    constructor(private readonly modelService: ModelService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new element', description: 'Create a new ArchiMate element in the model' })
    @ApiResponse({ status: 201, description: 'Element created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(@Body() dto: CreateElementDto | Prisma.ElementCreateInput) {
        // Check if it's the simplified DTO
        if ('type' in dto && 'layer' in dto && 'packageId' in dto) {
            return this.modelService.createElementSimple(dto as CreateElementDto);
        }
        // Otherwise use the full Prisma input
        return this.modelService.createElement(dto as Prisma.ElementCreateInput);
    }

    @Get()
    @ApiOperation({ summary: 'Get all elements', description: 'Retrieve all ArchiMate elements in the model' })
    @ApiResponse({ status: 200, description: 'List of elements retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.modelService.findAllElements();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get element by ID', description: 'Retrieve a specific element by its ID' })
    @ApiParam({ name: 'id', description: 'Element ID', example: 'elem-123' })
    @ApiResponse({ status: 200, description: 'Element retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Element not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id') id: string) {
        return this.modelService.getElement(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an element', description: 'Update an existing element' })
    @ApiParam({ name: 'id', description: 'Element ID', example: 'elem-123' })
    @ApiResponse({ status: 200, description: 'Element updated successfully' })
    @ApiResponse({ status: 404, description: 'Element not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    update(@Param('id') id: string, @Body() data: Prisma.ElementUpdateInput) {
        return this.modelService.updateElement(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete an element', description: 'Delete an element from the model' })
    @ApiParam({ name: 'id', description: 'Element ID', example: 'elem-123' })
    @ApiResponse({ status: 200, description: 'Element deleted successfully' })
    @ApiResponse({ status: 404, description: 'Element not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    remove(@Param('id') id: string) {
        return this.modelService.deleteElement(id);
    }
}

@ApiTags('Model - Packages')
@Controller('model/packages')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class ModelPackageController {
    constructor(private readonly modelService: ModelService) { }

    @Get()
    @ApiOperation({ summary: 'Get all packages', description: 'Retrieve all model packages' })
    @ApiResponse({ status: 200, description: 'List of packages retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.modelService.findAllPackages();
    }

    @Post()
    @ApiOperation({ summary: 'Create a new package', description: 'Create a new model package' })
    @ApiResponse({ status: 201, description: 'Package created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Body() data: Prisma.ModelPackageCreateInput) {
        return this.modelService.createPackage(data);
    }

    @Get(':packageId/elements')
    @ApiOperation({ summary: 'Get elements by package', description: 'Retrieve all elements for a specific package' })
    @ApiParam({ name: 'packageId', description: 'Package ID', example: 'pkg-123' })
    @ApiResponse({ status: 200, description: 'List of elements retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getElementsByPackage(@Param('packageId') packageId: string) {
        return this.modelService.findElementsByPackage(packageId);
    }

    @Get(':packageId/folders')
    @ApiOperation({ summary: 'Get folders by package', description: 'Retrieve all folders for a specific package' })
    @ApiParam({ name: 'packageId', description: 'Package ID', example: 'pkg-123' })
    @ApiResponse({ status: 200, description: 'List of folders retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getFoldersByPackage(@Param('packageId') packageId: string) {
        return this.modelService.findAllFolders(packageId);
    }

    @Get(':packageId/views')
    @ApiOperation({ summary: 'Get views by package', description: 'Retrieve all views for a specific package' })
    @ApiParam({ name: 'packageId', description: 'Package ID', example: 'pkg-123' })
    @ApiResponse({ status: 200, description: 'List of views retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getViewsByPackage(@Param('packageId') packageId: string) {
        return this.modelService.findViewsByPackage(packageId);
    }
}

@ApiTags('Model - Folders')
@Controller('model/folders')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class FolderController {
    constructor(private readonly modelService: ModelService) { }

    @Get()
    @ApiOperation({ summary: 'Get all folders', description: 'Retrieve all folders in the model' })
    @ApiResponse({ status: 200, description: 'List of folders retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.modelService.findAllFolders();
    }

    @Post()
    @ApiOperation({ summary: 'Create a new folder', description: 'Create a new folder for organizing elements' })
    @ApiResponse({ status: 201, description: 'Folder created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Body() data: Prisma.FolderCreateInput) {
        return this.modelService.createFolder(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a folder', description: 'Update an existing folder' })
    @ApiParam({ name: 'id', description: 'Folder ID', example: 'folder-123' })
    @ApiResponse({ status: 200, description: 'Folder updated successfully' })
    @ApiResponse({ status: 404, description: 'Folder not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    update(@Param('id') id: string, @Body() data: Prisma.FolderUpdateInput) {
        return this.modelService.updateFolder(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a folder', description: 'Delete a folder from the model' })
    @ApiParam({ name: 'id', description: 'Folder ID', example: 'folder-123' })
    @ApiResponse({ status: 200, description: 'Folder deleted successfully' })
    @ApiResponse({ status: 404, description: 'Folder not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    remove(@Param('id') id: string) {
        return this.modelService.deleteFolder(id);
    }
}

@ApiTags('Model - Views')
@Controller('model/views')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class ViewController {
    constructor(private readonly modelService: ModelService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new view', description: 'Create a new ArchiMate view/diagram' })
    @ApiResponse({ status: 201, description: 'View created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    create(@Body() data: Prisma.ViewCreateInput) {
        return this.modelService.createView(data);
    }

    @Get()
    @ApiOperation({ summary: 'Get all views', description: 'Retrieve all views in the model' })
    @ApiResponse({ status: 200, description: 'List of views retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.modelService.findAllViews();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get view by ID', description: 'Retrieve a specific view by its ID' })
    @ApiParam({ name: 'id', description: 'View ID', example: 'view-123' })
    @ApiResponse({ status: 200, description: 'View retrieved successfully' })
    @ApiResponse({ status: 404, description: 'View not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id') id: string) {
        return this.modelService.getView(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a view', description: 'Update an existing view' })
    @ApiParam({ name: 'id', description: 'View ID', example: 'view-123' })
    @ApiResponse({ status: 200, description: 'View updated successfully' })
    @ApiResponse({ status: 404, description: 'View not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    update(@Param('id') id: string, @Body() data: Prisma.ViewUpdateInput) {
        return this.modelService.updateView(id, data);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a view', description: 'Delete a view from the model' })
    @ApiParam({ name: 'id', description: 'View ID', example: 'view-123' })
    @ApiResponse({ status: 200, description: 'View deleted successfully' })
    @ApiResponse({ status: 404, description: 'View not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    remove(@Param('id') id: string) {
        return this.modelService.deleteView(id);
    }
}
