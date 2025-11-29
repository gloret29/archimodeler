import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBearerAuth } from '@nestjs/swagger';
import { StereotypesService } from './stereotypes.service';
import { Prisma } from '@repo/database';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Stereotypes')
@Controller('stereotypes')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@ApiBearerAuth('JWT-auth')
export class StereotypesController {
    constructor(private readonly stereotypesService: StereotypesService) {}

    // Stereotype CRUD
    @Post()
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Create a new stereotype', description: 'Create a new stereotype definition. Requires System Administrator or Lead Designer role.' })
    @ApiResponse({ status: 201, description: 'Stereotype created successfully' })
    @ApiResponse({ status: 400, description: 'Invalid input data' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    async create(@Body() data: Prisma.StereotypeCreateInput) {
        try {
            return await this.stereotypesService.createStereotype(data);
        } catch (error: any) {
            console.error('Error creating stereotype:', error);
            throw new HttpException(
                error.message || 'Failed to create stereotype',
                error.status || HttpStatus.INTERNAL_SERVER_ERROR,
            );
        }
    }

    @Get()
    @ApiOperation({ summary: 'Get all stereotypes', description: 'Retrieve all stereotype definitions' })
    @ApiResponse({ status: 200, description: 'List of stereotypes retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findAll() {
        return this.stereotypesService.findAllStereotypes();
    }

    @Get(':id')
    @ApiOperation({ summary: 'Get stereotype by ID', description: 'Retrieve a specific stereotype by its ID' })
    @ApiParam({ name: 'id', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    findOne(@Param('id') id: string) {
        return this.stereotypesService.findStereotypeById(id);
    }

    @Put(':id')
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Update a stereotype', description: 'Update an existing stereotype. Requires System Administrator or Lead Designer role.' })
    @ApiParam({ name: 'id', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype updated successfully' })
    @ApiResponse({ status: 404, description: 'Stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    update(@Param('id') id: string, @Body() data: Prisma.StereotypeUpdateInput) {
        return this.stereotypesService.updateStereotype(id, data);
    }

    @Delete(':id')
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Delete a stereotype', description: 'Delete a stereotype definition. Requires System Administrator or Lead Designer role.' })
    @ApiParam({ name: 'id', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype deleted successfully' })
    @ApiResponse({ status: 404, description: 'Stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    remove(@Param('id') id: string) {
        return this.stereotypesService.deleteStereotype(id);
    }

    // Element Stereotype Management
    @Post('elements/:elementId/apply/:stereotypeId')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Apply stereotype to element', description: 'Apply a stereotype to an ArchiMate element' })
    @ApiParam({ name: 'elementId', description: 'Element ID', example: 'elem-123' })
    @ApiParam({ name: 'stereotypeId', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype applied successfully' })
    @ApiResponse({ status: 404, description: 'Element or stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    applyToElement(
        @Param('elementId') elementId: string,
        @Param('stereotypeId') stereotypeId: string,
        @Body() body?: { extendedProperties?: any },
    ) {
        return this.stereotypesService.applyStereotypeToElement(elementId, stereotypeId, body?.extendedProperties);
    }

    @Delete('elements/:elementId/remove/:stereotypeId')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Remove stereotype from element', description: 'Remove a stereotype from an ArchiMate element' })
    @ApiParam({ name: 'elementId', description: 'Element ID', example: 'elem-123' })
    @ApiParam({ name: 'stereotypeId', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype removed successfully' })
    @ApiResponse({ status: 404, description: 'Element or stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    removeFromElement(
        @Param('elementId') elementId: string,
        @Param('stereotypeId') stereotypeId: string,
    ) {
        return this.stereotypesService.removeStereotypeFromElement(elementId, stereotypeId);
    }

    @Get('elements/:elementId')
    @ApiOperation({ summary: 'Get element stereotypes', description: 'Get all stereotypes applied to an element' })
    @ApiParam({ name: 'elementId', description: 'Element ID', example: 'elem-123' })
    @ApiResponse({ status: 200, description: 'Element stereotypes retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Element not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getElementStereotypes(@Param('elementId') elementId: string) {
        return this.stereotypesService.getElementStereotypes(elementId);
    }

    @Put('elements/:elementId/properties/:stereotypeId')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Update element stereotype properties', description: 'Update extended properties of a stereotype applied to an element' })
    @ApiParam({ name: 'elementId', description: 'Element ID', example: 'elem-123' })
    @ApiParam({ name: 'stereotypeId', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Properties updated successfully' })
    @ApiResponse({ status: 404, description: 'Element or stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    updateElementProperties(
        @Param('elementId') elementId: string,
        @Param('stereotypeId') stereotypeId: string,
        @Body() body: { extendedProperties: any },
    ) {
        return this.stereotypesService.updateElementStereotypeProperties(
            elementId,
            stereotypeId,
            body.extendedProperties,
        );
    }

    // Relationship Stereotype Management
    @Post('relationships/:relationshipId/apply/:stereotypeId')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Apply stereotype to relationship', description: 'Apply a stereotype to an ArchiMate relationship' })
    @ApiParam({ name: 'relationshipId', description: 'Relationship ID', example: 'rel-123' })
    @ApiParam({ name: 'stereotypeId', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype applied successfully' })
    @ApiResponse({ status: 404, description: 'Relationship or stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    applyToRelationship(
        @Param('relationshipId') relationshipId: string,
        @Param('stereotypeId') stereotypeId: string,
        @Body() body?: { extendedProperties?: any },
    ) {
        return this.stereotypesService.applyStereotypeToRelationship(relationshipId, stereotypeId, body?.extendedProperties);
    }

    @Delete('relationships/:relationshipId/remove/:stereotypeId')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Remove stereotype from relationship', description: 'Remove a stereotype from an ArchiMate relationship' })
    @ApiParam({ name: 'relationshipId', description: 'Relationship ID', example: 'rel-123' })
    @ApiParam({ name: 'stereotypeId', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Stereotype removed successfully' })
    @ApiResponse({ status: 404, description: 'Relationship or stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    removeFromRelationship(
        @Param('relationshipId') relationshipId: string,
        @Param('stereotypeId') stereotypeId: string,
    ) {
        return this.stereotypesService.removeStereotypeFromRelationship(relationshipId, stereotypeId);
    }

    @Get('relationships/:relationshipId')
    @ApiOperation({ summary: 'Get relationship stereotypes', description: 'Get all stereotypes applied to a relationship' })
    @ApiParam({ name: 'relationshipId', description: 'Relationship ID', example: 'rel-123' })
    @ApiResponse({ status: 200, description: 'Relationship stereotypes retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Relationship not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getRelationshipStereotypes(@Param('relationshipId') relationshipId: string) {
        return this.stereotypesService.getRelationshipStereotypes(relationshipId);
    }

    @Put('relationships/:relationshipId/properties/:stereotypeId')
    @Roles('Designer', 'Lead Designer', 'System Administrator')
    @ApiOperation({ summary: 'Update relationship stereotype properties', description: 'Update extended properties of a stereotype applied to a relationship' })
    @ApiParam({ name: 'relationshipId', description: 'Relationship ID', example: 'rel-123' })
    @ApiParam({ name: 'stereotypeId', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Properties updated successfully' })
    @ApiResponse({ status: 404, description: 'Relationship or stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    updateRelationshipProperties(
        @Param('relationshipId') relationshipId: string,
        @Param('stereotypeId') stereotypeId: string,
        @Body() body: { extendedProperties: any },
    ) {
        return this.stereotypesService.updateRelationshipStereotypeProperties(
            relationshipId,
            stereotypeId,
            body.extendedProperties,
        );
    }

    // Applicable Types Management
    @Put(':id/applicable-concept-types')
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Update applicable concept types', description: 'Update which ArchiMate concept types a stereotype can be applied to' })
    @ApiParam({ name: 'id', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Applicable concept types updated successfully' })
    @ApiResponse({ status: 404, description: 'Stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    updateApplicableConceptTypes(
        @Param('id') id: string,
        @Body() body: { conceptTypeIds: string[] },
    ) {
        return this.stereotypesService.updateApplicableConceptTypes(id, body.conceptTypeIds);
    }

    @Put(':id/applicable-relation-types')
    @Roles('System Administrator', 'Lead Designer')
    @ApiOperation({ summary: 'Update applicable relation types', description: 'Update which ArchiMate relation types a stereotype can be applied to' })
    @ApiParam({ name: 'id', description: 'Stereotype ID', example: 'stereotype-123' })
    @ApiResponse({ status: 200, description: 'Applicable relation types updated successfully' })
    @ApiResponse({ status: 404, description: 'Stereotype not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    @ApiResponse({ status: 403, description: 'Forbidden - Insufficient permissions' })
    updateApplicableRelationTypes(
        @Param('id') id: string,
        @Body() body: { relationTypeIds: string[] },
    ) {
        return this.stereotypesService.updateApplicableRelationTypes(id, body.relationTypeIds);
    }

    // Get available types for selection
    @Get('types/concept-types')
    @ApiOperation({ summary: 'Get all concept types', description: 'Get all available ArchiMate concept types' })
    @ApiResponse({ status: 200, description: 'Concept types retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getAllConceptTypes() {
        return this.stereotypesService.getAllConceptTypes();
    }

    @Get('types/relation-types')
    @ApiOperation({ summary: 'Get all relation types', description: 'Get all available ArchiMate relation types' })
    @ApiResponse({ status: 200, description: 'Relation types retrieved successfully' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getAllRelationTypes() {
        return this.stereotypesService.getAllRelationTypes();
    }

    // Get applicable stereotypes for an element
    @Get('elements/:elementId/applicable')
    @ApiOperation({ summary: 'Get applicable stereotypes for element', description: 'Get all stereotypes that can be applied to a specific element based on its type' })
    @ApiParam({ name: 'elementId', description: 'Element ID', example: 'elem-123' })
    @ApiResponse({ status: 200, description: 'Applicable stereotypes retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Element not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getApplicableStereotypesForElement(@Param('elementId') elementId: string) {
        return this.stereotypesService.getApplicableStereotypesForElement(elementId);
    }

    // Get applicable stereotypes for a relationship
    @Get('relationships/:relationshipId/applicable')
    @ApiOperation({ summary: 'Get applicable stereotypes for relationship', description: 'Get all stereotypes that can be applied to a specific relationship based on its type' })
    @ApiParam({ name: 'relationshipId', description: 'Relationship ID', example: 'rel-123' })
    @ApiResponse({ status: 200, description: 'Applicable stereotypes retrieved successfully' })
    @ApiResponse({ status: 404, description: 'Relationship not found' })
    @ApiResponse({ status: 401, description: 'Unauthorized' })
    getApplicableStereotypesForRelationship(@Param('relationshipId') relationshipId: string) {
        return this.stereotypesService.getApplicableStereotypesForRelationship(relationshipId);
    }
}

