import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SearchService } from '../search/search.service';
import { RelationshipsService } from '../neo4j/relationships.service';
import { Prisma } from '@repo/database';

@Injectable()
export class ModelService {
    constructor(
        private prisma: PrismaService,
        private searchService: SearchService,
        private relationshipsService: RelationshipsService,
    ) { }

    async createElement(data: Prisma.ElementCreateInput) {
        const element = await this.prisma.element.create({
            data,
            include: {
                conceptType: true,
            },
        });
        await this.searchService.indexElement(element);

        // Create element node in Neo4j
        await this.relationshipsService.ensureElementNode(
            element.id,
            element.name,
            element.conceptTypeId
        );

        return element;
    }

    async createElementSimple(dto: { name: string; type: string; layer: string; packageId: string; folderId?: string }) {
        try {
            console.log('Creating element with DTO:', dto);

            // First, ensure the package exists or create a default one
            let packageId = dto.packageId;
            if (packageId === 'default-package-id') {
                let defaultPackage = await this.prisma.modelPackage.findFirst({
                    where: { name: 'Default Package' }
                });

                if (!defaultPackage) {
                    console.log('Default package not found, creating...');
                    defaultPackage = await this.prisma.modelPackage.create({
                        data: {
                            name: 'Default Package',
                            description: 'Default model package'
                        }
                    });
                    console.log('Default package created:', defaultPackage.id);
                }
                packageId = defaultPackage.id;
            }

            // Find or create the metamodel
            let metamodel = await this.prisma.metamodel.findUnique({
                where: { name: 'ArchiMate 3.2' }
            });

            if (!metamodel) {
                console.log('Metamodel not found, creating...');
                metamodel = await this.prisma.metamodel.create({
                    data: {
                        name: 'ArchiMate 3.2',
                        version: '3.2',
                        description: 'ArchiMate 3.2 Metamodel'
                    }
                });
                console.log('Metamodel created:', metamodel.id);
            }

            // Find or create the concept type
            let conceptType = await this.prisma.conceptType.findUnique({
                where: {
                    name_metamodelId: {
                        name: dto.type,
                        metamodelId: metamodel.id
                    }
                }
            });

            if (!conceptType) {
                console.log('ConceptType not found, creating for:', dto.type);
                conceptType = await this.prisma.conceptType.create({
                    data: {
                        name: dto.type,
                        category: dto.layer,
                        metamodelId: metamodel.id
                    }
                });
                console.log('ConceptType created:', conceptType.id);
            }

            // Create the element
            console.log('Creating element with conceptTypeId:', conceptType.id, 'packageId:', packageId, 'folderId:', dto.folderId);
            
            // Verify folder exists if folderId is provided
            if (dto.folderId) {
                const folder = await this.prisma.folder.findUnique({
                    where: { id: dto.folderId }
                });
                if (!folder) {
                    throw new Error(`Folder with id ${dto.folderId} not found`);
                }
            }
            
            const elementData: any = {
                name: dto.name,
                conceptTypeId: conceptType.id,
                modelPackageId: packageId
            };
            
            if (dto.folderId) {
                elementData.folderId = dto.folderId;
            }
            
            const element = await this.prisma.element.create({
                data: elementData,
                include: {
                    conceptType: true
                }
            });

            console.log('Element created successfully:', element.id, 'folderId:', element.folderId);
            await this.searchService.indexElement(element);

            // Create element node in Neo4j
            await this.relationshipsService.ensureElementNode(
                element.id,
                element.name,
                element.conceptTypeId
            );

            return element;
        } catch (error) {
            console.error('Error in createElementSimple:', error);
            throw error;
        }
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

        // Update element node in Neo4j if name or conceptType changed
        if (data.name || data.conceptType) {
            const updatedElement = await this.prisma.element.findUnique({
                where: { id },
                include: { conceptType: true },
            });
            if (updatedElement) {
                await this.relationshipsService.ensureElementNode(
                    updatedElement.id,
                    updatedElement.name,
                    updatedElement.conceptTypeId
                );
            }
        }

        return element;
    }

    async deleteElement(id: string) {
        // Delete from Neo4j first (this will also delete all relationships)
        await this.relationshipsService.deleteElementNode(id);

        // Then delete from PostgreSQL
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

    // Folders
    async createFolder(data: Prisma.FolderCreateInput) {
        // Handle default package ID
        if (data.modelPackage && 'connect' in data.modelPackage) {
            const connectData = data.modelPackage.connect as any;
            if (connectData.id === 'default-package-id') {
                let defaultPackage = await this.prisma.modelPackage.findFirst({
                    where: { name: 'Default Package' }
                });

                if (!defaultPackage) {
                    defaultPackage = await this.prisma.modelPackage.create({
                        data: {
                            name: 'Default Package',
                            description: 'Default model package'
                        }
                    });
                }

                // Update the data with the real package ID
                data = {
                    ...data,
                    modelPackage: { connect: { id: defaultPackage.id } }
                };
            }
        }
        return this.prisma.folder.create({ data });
    }

    async findAllFolders(packageId?: string) {
        // Fetch all folders with their elements and views
        const allFolders = await this.prisma.folder.findMany({
            where: packageId ? { modelPackageId: packageId } : undefined,
            include: {
                elements: {
                    include: {
                        conceptType: true
                    }
                },
                views: true
            }
        });

        // Build hierarchical structure recursively
        const buildHierarchy = (parentId: string | null): any[] => {
            return allFolders
                .filter(folder => folder.parentId === parentId)
                .map(folder => ({
                    ...folder,
                    children: buildHierarchy(folder.id)
                }));
        };

        return buildHierarchy(null);
    }

    async updateFolder(id: string, data: Prisma.FolderUpdateInput) {
        return this.prisma.folder.update({
            where: { id },
            data
        });
    }

    async deleteFolder(id: string) {
        const folder = await this.prisma.folder.findUnique({
            where: { id },
            include: {
                children: true,
                elements: true,
                views: true
            }
        });

        if (!folder) {
            throw new Error('Folder not found');
        }

        if (folder.children.length > 0 || folder.elements.length > 0 || folder.views.length > 0) {
            throw new Error('Folder is not empty');
        }

        return this.prisma.folder.delete({
            where: { id }
        });
    }

    // Views
    async createView(data: Prisma.ViewCreateInput) {
        // Handle default package ID
        if (data.modelPackage && 'connect' in data.modelPackage) {
            const connectData = data.modelPackage.connect as any;
            if (connectData.id === 'default-package-id') {
                let defaultPackage = await this.prisma.modelPackage.findFirst({
                    where: { name: 'Default Package' }
                });

                if (!defaultPackage) {
                    defaultPackage = await this.prisma.modelPackage.create({
                        data: {
                            name: 'Default Package',
                            description: 'Default model package'
                        }
                    });
                }

                // Update the data with the real package ID
                data = {
                    ...data,
                    modelPackage: { connect: { id: defaultPackage.id } }
                };
            }
        }

        return this.prisma.view.create({ data });
    }

    async updateView(id: string, data: Prisma.ViewUpdateInput) {
        console.log('Updating view:', id, 'with data:', {
            ...data,
            content: data.content ? `[Content with ${(data.content as any)?.nodes?.length || 0} nodes, ${(data.content as any)?.edges?.length || 0} edges]` : undefined
        });
        
        // Ensure content is properly serialized as JSON
        if (data.content && typeof data.content === 'object') {
            data.content = data.content as any;
        }
        
        const updated = await this.prisma.view.update({
            where: { id },
            data
        });
        
        console.log('View updated successfully:', updated.id);
        return updated;
    }

    async getView(id: string) {
        return this.prisma.view.findUnique({
            where: { id }
        });
    }

    async findAllViews() {
        return this.prisma.view.findMany();
    }

    async deleteView(id: string) {
        return this.prisma.view.delete({
            where: { id }
        });
    }
}
