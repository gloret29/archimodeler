import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { Prisma } from '@repo/database';

@Injectable()
export class ModelService {
    constructor(
        private prisma: PrismaService,
        private searchService: SearchService,
    ) { }

    async createElement(data: Prisma.ElementCreateInput) {
        const element = await this.prisma.element.create({
            data,
            include: {
                conceptType: true,
            },
        });
        await this.searchService.indexElement(element);
        return element;
    }

    async updateElement(id: string, data: Prisma.ElementUpdateInput) {
        const element = await this.prisma.element.update({
            where: { id },
            data,
            include: {
                conceptType: true,
            },
        });
        await this.searchService.indexElement(element);
        return element;
    }

    async deleteElement(id: string) {
        // Ideally we should also remove from search index
        return this.prisma.element.delete({
            where: { id },
        });
    }

    async getElement(id: string) {
        return this.prisma.element.findUnique({
            where: { id },
            include: {
                conceptType: true,
            },
        });
    }

    async findAllElements() {
        return this.prisma.element.findMany({
            include: {
                conceptType: true,
            },
        });
    }

    async findAllPackages() {
        return this.prisma.modelPackage.findMany({
            include: {
                _count: {
                    select: { elements: true, relationships: true }
                }
            }
        });
    }

    async createPackage(data: Prisma.ModelPackageCreateInput) {
        return this.prisma.modelPackage.create({ data });
    }
}
