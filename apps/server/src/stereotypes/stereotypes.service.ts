import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

@Injectable()
export class StereotypesService {
    constructor(private prisma: PrismaService) {}

    // Stereotype CRUD
    async createStereotype(data: Prisma.StereotypeCreateInput) {
        try {
            // Remove any fields that don't exist in the schema
            const { applicableConceptTypes, applicableRelationTypes, ...cleanData } = data as any;
            return await this.prisma.stereotype.create({ data: cleanData });
        } catch (error: any) {
            console.error('Prisma error creating stereotype:', error);
            throw error;
        }
    }

    async findAllStereotypes() {
        return this.prisma.stereotype.findMany({
            orderBy: { name: 'asc' },
            include: {
                applicableConceptTypes: {
                    include: {
                        conceptType: true,
                    },
                },
                applicableRelationTypes: {
                    include: {
                        relationType: true,
                    },
                },
            },
        });
    }

    async findStereotypeById(id: string) {
        return this.prisma.stereotype.findUnique({
            where: { id },
            include: {
                applicableConceptTypes: {
                    include: {
                        conceptType: true,
                    },
                },
                applicableRelationTypes: {
                    include: {
                        relationType: true,
                    },
                },
                elementStereotypes: {
                    include: {
                        element: {
                            include: {
                                conceptType: true,
                            },
                        },
                    },
                },
                relationshipStereotypes: {
                    include: {
                        relationship: {
                            include: {
                                relationType: true,
                            },
                        },
                    },
                },
            },
        });
    }

    async updateStereotype(id: string, data: Prisma.StereotypeUpdateInput) {
        return this.prisma.stereotype.update({
            where: { id },
            data,
        });
    }

    async deleteStereotype(id: string) {
        return this.prisma.stereotype.delete({
            where: { id },
        });
    }

    // Element Stereotype Management
    async applyStereotypeToElement(elementId: string, stereotypeId: string, extendedProperties?: any) {
        // First, verify that the stereotype is applicable to this element's type
        const element = await this.prisma.element.findUnique({
            where: { id: elementId },
            include: { conceptType: true },
        });

        if (!element) {
            throw new Error('Element not found');
        }

        const stereotype = await this.prisma.stereotype.findUnique({
            where: { id: stereotypeId },
            include: {
                applicableConceptTypes: {
                    include: { conceptType: true },
                },
            },
        });

        if (!stereotype) {
            throw new Error('Stereotype not found');
        }

        // Check if stereotype is applicable to this concept type
        const isApplicable = stereotype.applicableConceptTypes.some(
            (act) => act.conceptType.id === element.conceptTypeId
        );

        if (!isApplicable) {
            throw new Error(
                `Stereotype "${stereotype.name}" is not applicable to concept type "${element.conceptType.name}"`
            );
        }

        return this.prisma.elementStereotype.upsert({
            where: {
                elementId_stereotypeId: {
                    elementId,
                    stereotypeId,
                },
            },
            update: {
                extendedProperties: extendedProperties || {},
            },
            create: {
                elementId,
                stereotypeId,
                extendedProperties: extendedProperties || {},
            },
            include: {
                stereotype: true,
                element: {
                    include: {
                        conceptType: true,
                    },
                },
            },
        });
    }

    async removeStereotypeFromElement(elementId: string, stereotypeId: string) {
        return this.prisma.elementStereotype.delete({
            where: {
                elementId_stereotypeId: {
                    elementId,
                    stereotypeId,
                },
            },
        });
    }

    async getElementStereotypes(elementId: string) {
        return this.prisma.elementStereotype.findMany({
            where: { elementId },
            include: {
                stereotype: true,
            },
        });
    }

    async updateElementStereotypeProperties(elementId: string, stereotypeId: string, extendedProperties: any) {
        return this.prisma.elementStereotype.update({
            where: {
                elementId_stereotypeId: {
                    elementId,
                    stereotypeId,
                },
            },
            data: {
                extendedProperties,
            },
            include: {
                stereotype: true,
            },
        });
    }

    // Relationship Stereotype Management
    async applyStereotypeToRelationship(relationshipId: string, stereotypeId: string, extendedProperties?: any) {
        // First, verify that the stereotype is applicable to this relationship's type
        const relationship = await this.prisma.relationship.findUnique({
            where: { id: relationshipId },
            include: { relationType: true },
        });

        if (!relationship) {
            throw new Error('Relationship not found');
        }

        const stereotype = await this.prisma.stereotype.findUnique({
            where: { id: stereotypeId },
            include: {
                applicableRelationTypes: {
                    include: { relationType: true },
                },
            },
        });

        if (!stereotype) {
            throw new Error('Stereotype not found');
        }

        // Check if stereotype is applicable to this relation type
        const isApplicable = stereotype.applicableRelationTypes.some(
            (art) => art.relationType.id === relationship.relationTypeId
        );

        if (!isApplicable) {
            throw new Error(
                `Stereotype "${stereotype.name}" is not applicable to relation type "${relationship.relationType.name}"`
            );
        }

        return this.prisma.relationshipStereotype.upsert({
            where: {
                relationshipId_stereotypeId: {
                    relationshipId,
                    stereotypeId,
                },
            },
            update: {
                extendedProperties: extendedProperties || {},
            },
            create: {
                relationshipId,
                stereotypeId,
                extendedProperties: extendedProperties || {},
            },
            include: {
                stereotype: true,
                relationship: {
                    include: {
                        relationType: true,
                    },
                },
            },
        });
    }

    async removeStereotypeFromRelationship(relationshipId: string, stereotypeId: string) {
        return this.prisma.relationshipStereotype.delete({
            where: {
                relationshipId_stereotypeId: {
                    relationshipId,
                    stereotypeId,
                },
            },
        });
    }

    async getRelationshipStereotypes(relationshipId: string) {
        return this.prisma.relationshipStereotype.findMany({
            where: { relationshipId },
            include: {
                stereotype: true,
            },
        });
    }

    async updateRelationshipStereotypeProperties(relationshipId: string, stereotypeId: string, extendedProperties: any) {
        return this.prisma.relationshipStereotype.update({
            where: {
                relationshipId_stereotypeId: {
                    relationshipId,
                    stereotypeId,
                },
            },
            data: {
                extendedProperties,
            },
            include: {
                stereotype: true,
            },
        });
    }

    // Get applicable stereotypes for an element based on its concept type
    async getApplicableStereotypesForElement(elementId: string) {
        const element = await this.prisma.element.findUnique({
            where: { id: elementId },
            include: { conceptType: true },
        });

        if (!element) {
            return [];
        }

        return this.prisma.stereotype.findMany({
            where: {
                applicableConceptTypes: {
                    some: {
                        conceptTypeId: element.conceptTypeId,
                    },
                },
            },
            include: {
                applicableConceptTypes: {
                    include: { conceptType: true },
                },
            },
        });
    }

    // Get applicable stereotypes for a relationship based on its relation type
    async getApplicableStereotypesForRelationship(relationshipId: string) {
        const relationship = await this.prisma.relationship.findUnique({
            where: { id: relationshipId },
            include: { relationType: true },
        });

        if (!relationship) {
            return [];
        }

        return this.prisma.stereotype.findMany({
            where: {
                applicableRelationTypes: {
                    some: {
                        relationTypeId: relationship.relationTypeId,
                    },
                },
            },
            include: {
                applicableRelationTypes: {
                    include: { relationType: true },
                },
            },
        });
    }

    // Manage applicable types for stereotypes
    async updateApplicableConceptTypes(stereotypeId: string, conceptTypeIds: string[]) {
        // First, delete all existing associations
        await this.prisma.stereotypeConceptType.deleteMany({
            where: { stereotypeId },
        });

        // Then create new associations
        if (conceptTypeIds.length > 0) {
            await this.prisma.stereotypeConceptType.createMany({
                data: conceptTypeIds.map(conceptTypeId => ({
                    stereotypeId,
                    conceptTypeId,
                })),
            });
        }

        return this.findStereotypeById(stereotypeId);
    }

    async updateApplicableRelationTypes(stereotypeId: string, relationTypeIds: string[]) {
        // First, delete all existing associations
        await this.prisma.stereotypeRelationType.deleteMany({
            where: { stereotypeId },
        });

        // Then create new associations
        if (relationTypeIds.length > 0) {
            await this.prisma.stereotypeRelationType.createMany({
                data: relationTypeIds.map(relationTypeId => ({
                    stereotypeId,
                    relationTypeId,
                })),
            });
        }

        return this.findStereotypeById(stereotypeId);
    }

    // Get all concept types and relation types for selection
    async getAllConceptTypes() {
        return this.prisma.conceptType.findMany({
            orderBy: [
                { category: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async getAllRelationTypes() {
        return this.prisma.relationType.findMany({
            orderBy: { name: 'asc' },
        });
    }
}

