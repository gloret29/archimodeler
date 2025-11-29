import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { RelationshipsService } from '../neo4j/relationships.service';
import { PrismaService } from '../prisma/prisma.service';

interface CreateRelationshipDto {
    name?: string;
    documentation?: string;
    properties?: Record<string, any>;
    relationTypeId: string;
    sourceId: string;
    targetId: string;
    modelPackageId: string;
}

interface UpdateRelationshipDto {
    name?: string;
    documentation?: string;
    properties?: Record<string, any>;
    validTo?: Date;
}

@Controller('model/relationships')
export class RelationshipsController {
    constructor(
        private readonly relationshipsService: RelationshipsService,
        private readonly prisma: PrismaService,
    ) { }

    @Post('migrate')
    async migrate() {
        return this.relationshipsService.migrateFromPostgres(this.prisma);
    }

    @Post()
    async create(@Body() dto: CreateRelationshipDto) {
        // Get relation type info from PostgreSQL
        const relationType = await this.prisma.relationType.findUnique({
            where: { id: dto.relationTypeId },
        });

        if (!relationType) {
            throw new Error(`RelationType with id ${dto.relationTypeId} not found`);
        }

        // Create relationship in Neo4j
        const relationshipId = `rel_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await this.relationshipsService.createRelationship({
            id: relationshipId,
            name: dto.name,
            documentation: dto.documentation,
            properties: dto.properties,
            relationTypeId: dto.relationTypeId,
            relationTypeName: relationType.name,
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
    async findAll(@Param('packageId') packageId?: string) {
        if (packageId) {
            return this.relationshipsService.getPackageRelationships(packageId);
        }
        // For now, return empty array if no packageId specified
        // In the future, we might want to return all relationships
        return [];
    }

    @Get('element/:elementId')
    async getElementRelationships(@Param('elementId') elementId: string) {
        return this.relationshipsService.getElementRelationships(elementId);
    }

    @Get('between/:sourceId/:targetId')
    async getRelationshipsBetween(
        @Param('sourceId') sourceId: string,
        @Param('targetId') targetId: string,
    ) {
        return this.relationshipsService.getRelationshipsBetween(sourceId, targetId);
    }

    @Get(':id')
    async findOne(@Param('id') id: string) {
        return this.relationshipsService.getRelationship(id);
    }

    @Put(':id')
    async update(@Param('id') id: string, @Body() data: UpdateRelationshipDto) {
        await this.relationshipsService.updateRelationship(id, data);
        return this.relationshipsService.getRelationship(id);
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.relationshipsService.deleteRelationship(id);
        return { success: true };
    }
}

