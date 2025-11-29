import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

export interface RelationshipNode {
    id: string;
    name?: string;
    documentation?: string;
    properties?: Record<string, any>;
    relationTypeId: string;
    relationTypeName: string;
    sourceId: string;
    targetId: string;
    modelPackageId: string;
    validFrom: Date;
    validTo?: Date;
    versionId: string;
}

@Injectable()
export class RelationshipsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Create a relationship in PostgreSQL
     */
    async createRelationship(data: {
        id: string;
        name?: string;
        documentation?: string;
        properties?: Record<string, any>;
        relationTypeId: string;
        sourceId: string;
        targetId: string;
        modelPackageId: string;
        validFrom: Date;
        validTo?: Date;
        versionId: string;
    }): Promise<void> {
        await this.prisma.relationship.create({
            data: {
                id: data.id,
                name: data.name,
                documentation: data.documentation,
                properties: data.properties as Prisma.InputJsonValue,
                relationTypeId: data.relationTypeId,
                sourceId: data.sourceId,
                targetId: data.targetId,
                modelPackageId: data.modelPackageId,
                validFrom: data.validFrom,
                validTo: data.validTo,
                versionId: data.versionId,
            },
        });
    }

    /**
     * Get a relationship by ID
     */
    async getRelationship(id: string): Promise<RelationshipNode | null> {
        const relationship = await this.prisma.relationship.findUnique({
            where: { id },
            include: {
                relationType: true,
                source: true,
                target: true,
            },
        });

        if (!relationship) {
            return null;
        }

        return {
            id: relationship.id,
            name: relationship.name || undefined,
            documentation: relationship.documentation || undefined,
            properties: relationship.properties as Record<string, any> | undefined,
            relationTypeId: relationship.relationTypeId,
            relationTypeName: relationship.relationType.name,
            sourceId: relationship.sourceId,
            targetId: relationship.targetId,
            modelPackageId: relationship.modelPackageId,
            validFrom: relationship.validFrom,
            validTo: relationship.validTo || undefined,
            versionId: relationship.versionId,
        };
    }

    /**
     * Get all relationships for a given element (as source or target)
     */
    async getElementRelationships(elementId: string): Promise<RelationshipNode[]> {
        const relationships = await this.prisma.relationship.findMany({
            where: {
                OR: [
                    { sourceId: elementId },
                    { targetId: elementId },
                ],
            },
            include: {
                relationType: true,
                source: true,
                target: true,
            },
        });

        return relationships.map(rel => ({
            id: rel.id,
            name: rel.name || undefined,
            documentation: rel.documentation || undefined,
            properties: rel.properties as Record<string, any> | undefined,
            relationTypeId: rel.relationTypeId,
            relationTypeName: rel.relationType.name,
            sourceId: rel.sourceId,
            targetId: rel.targetId,
            modelPackageId: rel.modelPackageId,
            validFrom: rel.validFrom,
            validTo: rel.validTo || undefined,
            versionId: rel.versionId,
        }));
    }

    /**
     * Get relationships between two elements
     */
    async getRelationshipsBetween(sourceId: string, targetId: string): Promise<RelationshipNode[]> {
        const relationships = await this.prisma.relationship.findMany({
            where: {
                sourceId,
                targetId,
            },
            include: {
                relationType: true,
                source: true,
                target: true,
            },
        });

        return relationships.map(rel => ({
            id: rel.id,
            name: rel.name || undefined,
            documentation: rel.documentation || undefined,
            properties: rel.properties as Record<string, any> | undefined,
            relationTypeId: rel.relationTypeId,
            relationTypeName: rel.relationType.name,
            sourceId: rel.sourceId,
            targetId: rel.targetId,
            modelPackageId: rel.modelPackageId,
            validFrom: rel.validFrom,
            validTo: rel.validTo || undefined,
            versionId: rel.versionId,
        }));
    }

    /**
     * Update a relationship
     */
    async updateRelationship(id: string, data: {
        name?: string;
        documentation?: string;
        properties?: Record<string, any>;
        validTo?: Date;
    }): Promise<void> {
        await this.prisma.relationship.update({
            where: { id },
            data: {
                name: data.name,
                documentation: data.documentation,
                properties: data.properties as Prisma.InputJsonValue,
                validTo: data.validTo,
            },
        });
    }

    /**
     * Delete a relationship
     */
    async deleteRelationship(id: string): Promise<void> {
        await this.prisma.relationship.delete({
            where: { id },
        });
    }

    /**
     * Get all relationships for a model package
     */
    async getPackageRelationships(modelPackageId: string): Promise<RelationshipNode[]> {
        const relationships = await this.prisma.relationship.findMany({
            where: { modelPackageId },
            include: {
                relationType: true,
                source: true,
                target: true,
            },
        });

        return relationships.map(rel => ({
            id: rel.id,
            name: rel.name || undefined,
            documentation: rel.documentation || undefined,
            properties: rel.properties as Record<string, any> | undefined,
            relationTypeId: rel.relationTypeId,
            relationTypeName: rel.relationType.name,
            sourceId: rel.sourceId,
            targetId: rel.targetId,
            modelPackageId: rel.modelPackageId,
            validFrom: rel.validFrom,
            validTo: rel.validTo || undefined,
            versionId: rel.versionId,
        }));
    }
}

