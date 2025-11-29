import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { RelationshipsService } from './relationships.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRelationshipDto, UpdateRelationshipDto } from './dto/create-relationship.dto';
import { AuthGuard } from '@nestjs/passport';

@ApiTags('Model - Relationships')
@Controller('model/relationships')
@UseGuards(AuthGuard('jwt'))
@ApiBearerAuth('JWT-auth')
export class RelationshipsController {
    constructor(
        private readonly relationshipsService: RelationshipsService,
        private readonly prisma: PrismaService,
    ) { }

    @Post()
    @ApiOperation({ summary: 'Create a new relationship', description: 'Create a new ArchiMate relationship between two elements' })
    @ApiResponse({ status: 201, description: 'Relationship created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async create(@Body() dto: CreateRelationshipDto) {
        // Get relation type info from PostgreSQL
        const relationType = await this.prisma.relationType.findUnique({
            where: { id: dto.relationTypeId },
        });

        if (!relationType) {
            throw new Error(`RelationType with id ${dto.relationTypeId} not found`);
        }

        // Create relationship in PostgreSQL
        const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.relationshipsService.createRelationship({
            id: relationshipId,
            name: dto.name,
            documentation: dto.documentation,
            properties: dto.properties,
            relationTypeId: dto.relationTypeId,
            sourceId: dto.sourceId,
            targetId: dto.targetId,
            modelPackageId: dto.modelPackageId,
            validFrom: new Date(),
            versionId: `v_${Date.now()}`,
        });

        return {
            id: relationshipId,
            ...dto,
            relationTypeName: relationType.name,
        };
    }

    @Get()
    @ApiOperation({ summary: 'Get all relationships', description: 'Retrieve all relationships, optionally filtered by package ID' })
    @ApiResponse({ status: 200, description: 'List of relationships retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findAll(@Param('packageId') packageId?: string) {
        if (packageId) {
            return this.relationshipsService.getPackageRelationships(packageId);
        }
        // For now, return empty array if no packageId specified
        // In the future, we might want to return all relationships
        return [];
    }

    @Get('element/:elementId')
    @ApiOperation({ summary: 'Get element relationships', description: 'Get all relationships for a specific element' })
    @ApiParam({ name: 'elementId', description: 'Element ID', example: 'elem-123' })
    @ApiResponse({ status: 200, description: 'Element relationships retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Element not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getElementRelationships(@Param('elementId') elementId: string) {
        return this.relationshipsService.getElementRelationships(elementId);
    }

    @Get('between/:sourceId/:targetId')
    @ApiOperation({ summary: 'Get relationships between elements', description: 'Get all relationships between two specific elements' })
    @ApiParam({ name: 'sourceId', description: 'Source element ID', example: 'elem-123' })
    @ApiParam({ name: 'targetId', description: 'Target element ID', example: 'elem-456' })
    @ApiResponse({ status: 200, description: 'Relationships retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async getRelationshipsBetween(
        @Param('sourceId') sourceId: string,
        @Param('targetId') targetId: string,
    ) {
        return this.relationshipsService.getRelationshipsBetween(sourceId, targetId);
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get relationship by ID', description: 'Retrieve a specific relationship by its ID' })
    @ApiParam({ name: 'id', description: 'Relationship ID', example: 'rel-123' })
    @ApiResponse({ status: 200, description: 'Relationship retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Relationship not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async findOne(@Param('id') id: string) {
        return this.relationshipsService.getRelationship(id);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update a relationship', description: 'Update an existing relationship' })
    @ApiParam({ name: 'id', description: 'Relationship ID', example: 'rel-123' })
    @ApiResponse({ status: 200, description: 'Relationship updated successfully' })
    @ApiResponse({ status: 404, description: 'Relationship not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async update(@Param('id') id: string, @Body() data: UpdateRelationshipDto) {
        await this.relationshipsService.updateRelationship(id, data);
        return this.relationshipsService.getRelationship(id);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Delete a relationship', description: 'Delete a relationship from the model' })
    @ApiParam({ name: 'id', description: 'Relationship ID', example: 'rel-123' })
    @ApiResponse({ status: 200, description: 'Relationship deleted successfully' })
    @ApiResponse({ status: 404, description: 'Relationship not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    async remove(@Param('id') id: string) {
        await this.relationshipsService.deleteRelationship(id);
        return { success: true };
    }
}

