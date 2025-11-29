import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@repo/database';

@Injectable()
export class MetamodelService {
    constructor(private prisma: PrismaService) { }

    async createMetamodel(data: Prisma.MetamodelCreateInput) {
        return this.prisma.metamodel.create({
            data,
        });
    }

    async getMetamodel(name: string) {
        return this.prisma.metamodel.findUnique({
            where: { name },
            include: {
                conceptTypes: true,
                relationTypes: true,
            },
        });
    }

    async createConceptType(data: Prisma.ConceptTypeCreateInput) {
        return this.prisma.conceptType.create({
            data,
        });
    }

    async createRelationType(data: Prisma.RelationTypeCreateInput) {
        return this.prisma.relationType.create({
            data,
        });
    }

    async importMetamodel(json: any) {
        // Implementation for importing metamodel from JSON
        // This is a placeholder for the logic to parse JSON and populate tables
        const { name, version, concepts, relations } = json;

        let metamodel = await this.prisma.metamodel.findUnique({ where: { name } });
        if (!metamodel) {
            metamodel = await this.prisma.metamodel.create({
                data: { name, version },
            });
        }

        for (const concept of concepts) {
            await this.prisma.conceptType.upsert({
                where: { name_metamodelId: { name: concept.name, metamodelId: metamodel.id } },
                update: {},
                create: {
                    name: concept.name,
                    category: concept.category,
                    metamodel: { connect: { id: metamodel.id } },
                },
            });
        }

        for (const relation of relations) {
            await this.prisma.relationType.upsert({
                where: { name_metamodelId: { name: relation.name, metamodelId: metamodel.id } },
                update: {},
                create: {
                    name: relation.name,
                    metamodel: { connect: { id: metamodel.id } },
                },
            });
        }

        return metamodel;
    }
}
