import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Query, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { ModelService } from './model.service';
import { Prisma } from '@repo/database';
import { CreateElementDto } from './dto/create-element.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import type { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';

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
    @ApiOperation({ summary: 'Create a new package', description: 'Create a new model package (Admin only)' })
    @ApiResponse({ status: 201, description: 'Package created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(RolesGuard)
    create(@Body() data: Prisma.ModelPackageCreateInput) {
        return this.modelService.createPackage(data);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a package', description: 'Update a model package (Admin only)' })
    @ApiParam({ name: 'id', description: 'Package ID', example: 'pkg-123' })
    @ApiResponse({ status: 200, description: 'Package updated successfully' })
    @ApiResponse({ status: 404, description: 'Package not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(RolesGuard)
    update(@Param('id') id: string, @Body() data: Prisma.ModelPackageUpdateInput) {
        return this.modelService.updatePackage(id, data);
    }

    @Post(':id/duplicate')
    @ApiOperation({ summary: 'Duplicate a package', description: 'Create a copy of a model package with all its contents' })
    @ApiParam({ name: 'id', description: 'Source Package ID', example: 'pkg-123' })
    @ApiResponse({ status: 201, description: 'Package duplicated successfully' })
    @ApiResponse({ status: 400, description: 'Invalid package name or package not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(RolesGuard)
    duplicate(
        @Param('id') id: string,
        @Body() body: { name: string }
    ) {
        if (!body.name || !body.name.trim()) {
            throw new Error('Package name is required');
        }
        return this.modelService.duplicatePackage(id, body.name.trim());
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a package', description: 'Delete a model package and all its contents' })
    @ApiParam({ name: 'id', description: 'Package ID', example: 'pkg-123' })
    @ApiResponse({ status: 200, description: 'Package deleted successfully' })
    @ApiResponse({ status: 404, description: 'Package not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(RolesGuard)
    remove(@Param('id') id: string) {
        return this.modelService.deletePackage(id);
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

    @Post('export')
    @ApiOperation({ summary: 'Export one or more packages', description: 'Export model packages to JSON format' })
    @ApiResponse({ status: 200, description: 'Packages exported successfully' })
    @ApiResponse({ status: 400, description: 'Invalid package IDs' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(RolesGuard)
    async exportPackages(
        @Body() body: { packageIds: string[] },
        @Res() res: Response
    ) {
        try {
            if (!body.packageIds || !Array.isArray(body.packageIds) || body.packageIds.length === 0) {
                return res.status(400).json({ error: 'packageIds array is required' });
            }

            let exportData;
            if (body.packageIds.length === 1) {
                exportData = await this.modelService.exportPackage(body.packageIds[0]);
            } else {
                exportData = await this.modelService.exportPackages(body.packageIds);
            }

            const filename = body.packageIds.length === 1 && 'package' in exportData
                ? `package-${exportData.package.name}-${new Date().toISOString().split('T')[0]}.json`
                : `packages-${new Date().toISOString().split('T')[0]}.json`;

            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            res.json(exportData);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    @Post('import')
    @ApiOperation({ summary: 'Import a package', description: 'Import a model package from JSON format' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                file: {
                    type: 'string',
                    format: 'binary',
                },
                overwrite: {
                    type: 'boolean',
                    description: 'Overwrite existing package if it exists'
                },
                newPackageName: {
                    type: 'string',
                    description: 'New name for the imported package (optional)'
                }
            }
        }
    })
    @ApiResponse({ status: 201, description: 'Package imported successfully' })
    @ApiResponse({ status: 400, description: 'Invalid import data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @UseGuards(RolesGuard)
    @UseInterceptors(FileInterceptor('file'))
    async importPackage(
        @UploadedFile() file: { buffer: Buffer; originalname: string; mimetype: string },
        @Body() body: { overwrite?: string; newPackageName?: string }
    ) {
        if (!file) {
            throw new Error('No file uploaded');
        }

        try {
            // Handle both single package and multiple packages format
            const fileContent = file.buffer.toString('utf-8');
            const importData = JSON.parse(fileContent);
            
            // Check if it's a single package or multiple packages format
            let packageData;
            if (importData.package && importData.elements) {
                // Single package format
                packageData = importData;
            } else if (importData.packages && importData.data) {
                // Multiple packages format - import first one for now
                if (importData.data.length === 0) {
                    throw new Error('No package data found in file');
                }
                const firstPackage = importData.data[0];
                packageData = {
                    package: importData.packages.find((p: any) => p.name === firstPackage.packageName) || { name: firstPackage.packageName },
                    elements: firstPackage.elements,
                    relationships: firstPackage.relationships,
                    folders: firstPackage.folders,
                    views: firstPackage.views
                };
            } else {
                throw new Error('Invalid import file format');
            }

            const options = {
                overwrite: body.overwrite === 'true',
                newPackageName: body.newPackageName || undefined
            };

            return await this.modelService.importPackage(packageData, options);
        } catch (error) {
            throw new Error(`Failed to import package: ${error.message}`);
        }
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
