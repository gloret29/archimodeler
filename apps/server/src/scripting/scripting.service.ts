import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RelationshipsService } from '../model/relationships.service';
import { VM } from 'vm2';

@Injectable()
export class ScriptingService {
    constructor(
        private prisma: PrismaService,
        private relationshipsService: RelationshipsService
    ) { }

    async executeScript(script: string, context?: any) {
        // Create a sandboxed VM
        const vm = new VM({
            timeout: 5000, // 5 seconds timeout
            sandbox: {
                // Provide a DSL for model manipulation
                model: {
                    findAll: async (type: string) => {
                        return this.prisma.element.findMany({
                            where: {
                                conceptType: {
                                    name: type,
                                },
                                validTo: null, // Only current versions
                            },
                            include: {
                                conceptType: true,
                            },
                        });
                    },

                    findById: async (id: string) => {
                        return this.prisma.element.findUnique({
                            where: { id },
                            include: {
                                conceptType: true,
                                sourceRelationships: {
                                    include: {
                                        relationType: true,
                                        target: true,
                                    },
                                },
                                targetRelationships: {
                                    include: {
                                        relationType: true,
                                        source: true,
                                    },
                                },
                            },
                        });
                    },

                    create: async (data: any) => {
                        const { type, name, properties, modelPackageId } = data;

                        const conceptType = await this.prisma.conceptType.findFirst({
                            where: { name: type },
                        });

                        if (!conceptType) {
                            throw new Error(`ConceptType ${type} not found`);
                        }

                        return this.prisma.element.create({
                            data: {
                                name,
                                properties,
                                conceptTypeId: conceptType.id,
                                modelPackageId,
                            },
                        });
                    },

                    update: async (id: string, data: any) => {
                        return this.prisma.element.update({
                            where: { id },
                            data,
                        });
                    },
                },

                element: {
                    getRelations: async (elementId: string, relationType?: string) => {
                        // Fetch relationships from PostgreSQL
                        const relationships = await this.relationshipsService.getElementRelationships(elementId);

                        // Filter by relation type if provided
                        const filtered = relationType
                            ? relationships.filter(r => r.relationTypeName === relationType)
                            : relationships;

                        // Hydrate with Prisma data to match previous DSL return type
                        const hydrated = await Promise.all(filtered.map(async (rel) => {
                            const [source, target, type] = await Promise.all([
                                this.prisma.element.findUnique({ where: { id: rel.sourceId } }),
                                this.prisma.element.findUnique({ where: { id: rel.targetId } }),
                                this.prisma.relationType.findUnique({ where: { id: rel.relationTypeId } })
                            ]);

                            return {
                                ...rel,
                                source,
                                target,
                                relationType: type
                            };
                        }));

                        return hydrated;
                    },
                },

                console: {
                    log: (...args: any[]) => console.log('[Script]', ...args),
                },

                // Add custom context if provided
                ...context,
            },
        });

        try {
            const result = await vm.run(script);
            return { success: true, result };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}
