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

        return element;
    }

    async deleteElement(id: string) {
        // Delete relationships first (cascade should handle this, but explicit is better)
        await this.prisma.relationship.deleteMany({
            where: {
                OR: [
                    { sourceId: id },
                    { targetId: id },
                ],
            },
        });

        // Then delete the element
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
                    select: { 
                        elements: true, 
                        relationships: true,
                        folders: true,
                        views: true
                    }
                }
            },
            orderBy: {
                updatedAt: 'desc'
            }
        });
    }

    async createPackage(data: Prisma.ModelPackageCreateInput) {
        return this.prisma.modelPackage.create({ data });
    }

    async updatePackage(id: string, data: Prisma.ModelPackageUpdateInput) {
        return this.prisma.modelPackage.update({
            where: { id },
            data,
        });
    }

    async exportPackage(packageId: string) {
        const packageData = await this.prisma.modelPackage.findUnique({
            where: { id: packageId },
            include: {
                elements: {
                    include: {
                        conceptType: {
                            include: {
                                metamodel: true
                            }
                        },
                        folder: true,
                        stereotypes: {
                            include: {
                                stereotype: true
                            }
                        }
                    }
                },
                relationships: {
                    include: {
                        relationType: {
                            include: {
                                metamodel: true
                            }
                        },
                        source: {
                            select: { id: true, name: true }
                        },
                        target: {
                            select: { id: true, name: true }
                        },
                        stereotypes: {
                            include: {
                                stereotype: true
                            }
                        }
                    }
                },
                folders: {
                    include: {
                        parent: {
                            select: { id: true, name: true }
                        }
                    }
                },
                views: {
                    include: {
                        folder: {
                            select: { id: true, name: true }
                        }
                    }
                }
            }
        });

        if (!packageData) {
            throw new Error('Package not found');
        }

        // Build export structure with ID mapping for relationships
        const exportData = {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            package: {
                name: packageData.name,
                description: packageData.description,
                status: packageData.status,
            },
            elements: packageData.elements.map(el => ({
                id: el.id,
                name: el.name,
                documentation: el.documentation,
                properties: el.properties,
                conceptType: el.conceptType.name,
                conceptTypeCategory: el.conceptType.category,
                metamodel: el.conceptType.metamodel.name,
                folderId: el.folderId,
                folderName: el.folder?.name,
                validFrom: el.validFrom,
                validTo: el.validTo,
                versionId: el.versionId,
                externalId: el.externalId,
                stereotypes: el.stereotypes.map(es => ({
                    stereotypeName: es.stereotype.name,
                    extendedProperties: es.extendedProperties
                }))
            })),
            relationships: packageData.relationships.map(rel => ({
                id: rel.id,
                name: rel.name,
                documentation: rel.documentation,
                properties: rel.properties,
                relationType: rel.relationType.name,
                metamodel: rel.relationType.metamodel.name,
                sourceId: rel.sourceId,
                sourceName: rel.source.name,
                targetId: rel.targetId,
                targetName: rel.target.name,
                validFrom: rel.validFrom,
                validTo: rel.validTo,
                versionId: rel.versionId,
                stereotypes: rel.stereotypes.map(rs => ({
                    stereotypeName: rs.stereotype.name,
                    extendedProperties: rs.extendedProperties
                }))
            })),
            folders: packageData.folders.map(folder => ({
                id: folder.id,
                name: folder.name,
                parentId: folder.parentId,
                parentName: folder.parent?.name
            })),
            views: packageData.views.map(view => ({
                id: view.id,
                name: view.name,
                description: view.description,
                content: view.content,
                folderId: view.folderId,
                folderName: view.folder?.name
            }))
        };

        return exportData;
    }

    async exportPackages(packageIds: string[]) {
        const packages = await Promise.all(
            packageIds.map(id => this.exportPackage(id))
        );

        return {
            version: '1.0',
            exportedAt: new Date().toISOString(),
            packages: packages.map(pkg => pkg.package),
            data: packages.map(pkg => ({
                packageName: pkg.package.name,
                elements: pkg.elements,
                relationships: pkg.relationships,
                folders: pkg.folders,
                views: pkg.views
            }))
        };
    }

    async importPackage(importData: any, options?: { overwrite?: boolean; newPackageName?: string }) {
        // Validate import data structure
        if (!importData.package) {
            throw new Error('Invalid import data structure: package is required');
        }
        if (!importData.elements || !Array.isArray(importData.elements)) {
            throw new Error('Invalid import data structure: elements array is required');
        }
        // Relationships are optional but should be an array if present
        if (importData.relationships && !Array.isArray(importData.relationships)) {
            throw new Error('Invalid import data structure: relationships must be an array');
        }
        if (!importData.relationships) {
            importData.relationships = [];
        }
        if (!importData.folders || !Array.isArray(importData.folders)) {
            throw new Error('Invalid import data structure: folders array is required');
        }
        if (!importData.views || !Array.isArray(importData.views)) {
            throw new Error('Invalid import data structure: views array is required');
        }

        const packageName = options?.newPackageName || importData.package.name;
        const overwrite = options?.overwrite || false;

        // Check if package already exists
        let existingPackage = await this.prisma.modelPackage.findFirst({
            where: { name: packageName }
        });

        if (existingPackage && !overwrite) {
            throw new Error(`Package "${packageName}" already exists. Use overwrite option to replace it.`);
        }

        // If overwrite, delete existing package
        if (existingPackage && overwrite) {
            await this.deletePackage(existingPackage.id);
        }

        // Create new package
        const newPackage = await this.prisma.modelPackage.create({
            data: {
                name: packageName,
                description: importData.package.description,
                status: importData.package.status || 'DRAFT'
            }
        });

        // Create ID mapping for imported entities
        const elementIdMap = new Map<string, string>();
        const folderIdMap = new Map<string, string>();

        // Import folders first (handle hierarchy)
        const foldersToImport = [...importData.folders];
        const importedFolders: any[] = [];

        // Sort folders by hierarchy (root folders first)
        const rootFolders = foldersToImport.filter(f => !f.parentId);
        const childFolders = foldersToImport.filter(f => f.parentId);

        for (const folderData of rootFolders) {
            const newFolder = await this.prisma.folder.create({
                data: {
                    name: folderData.name,
                    modelPackageId: newPackage.id
                }
            });
            folderIdMap.set(folderData.id, newFolder.id);
            importedFolders.push({ oldId: folderData.id, newId: newFolder.id, parentId: folderData.parentId });
        }

        // Import child folders
        let remainingFolders = [...childFolders];
        while (remainingFolders.length > 0) {
            const beforeLength = remainingFolders.length;
            for (const folderData of remainingFolders) {
                const parentNewId = folderIdMap.get(folderData.parentId);
                if (parentNewId) {
                    const newFolder = await this.prisma.folder.create({
                        data: {
                            name: folderData.name,
                            parentId: parentNewId,
                            modelPackageId: newPackage.id
                        }
                    });
                    folderIdMap.set(folderData.id, newFolder.id);
                    importedFolders.push({ oldId: folderData.id, newId: newFolder.id, parentId: folderData.parentId });
                    remainingFolders = remainingFolders.filter(f => f.id !== folderData.id);
                }
            }
            if (remainingFolders.length === beforeLength) {
                // Circular dependency or missing parent, create as root
                const folderData = remainingFolders[0];
                const newFolder = await this.prisma.folder.create({
                    data: {
                        name: folderData.name,
                        modelPackageId: newPackage.id
                    }
                });
                folderIdMap.set(folderData.id, newFolder.id);
                importedFolders.push({ oldId: folderData.id, newId: newFolder.id, parentId: null });
                remainingFolders = remainingFolders.filter(f => f.id !== folderData.id);
            }
        }

        // Find or create metamodel
        const metamodelName = importData.elements[0]?.metamodel || 'ArchiMate 3.2';
        let metamodel = await this.prisma.metamodel.findUnique({
            where: { name: metamodelName }
        });

        if (!metamodel) {
            metamodel = await this.prisma.metamodel.create({
                data: {
                    name: metamodelName,
                    version: '3.2',
                    description: `${metamodelName} Metamodel`
                }
            });
        }

        // Import elements
        for (const elementData of importData.elements) {
            // Find or create concept type
            let conceptType = await this.prisma.conceptType.findUnique({
                where: {
                    name_metamodelId: {
                        name: elementData.conceptType,
                        metamodelId: metamodel.id
                    }
                }
            });

            if (!conceptType) {
                conceptType = await this.prisma.conceptType.create({
                    data: {
                        name: elementData.conceptType,
                        category: elementData.conceptTypeCategory,
                        metamodelId: metamodel.id
                    }
                });
            }

            // Map folder ID
            const newFolderId = elementData.folderId ? folderIdMap.get(elementData.folderId) : null;

            const newElement = await this.prisma.element.create({
                data: {
                    name: elementData.name,
                    documentation: elementData.documentation,
                    properties: elementData.properties,
                    conceptTypeId: conceptType.id,
                    modelPackageId: newPackage.id,
                    folderId: newFolderId || undefined,
                    validFrom: elementData.validFrom ? new Date(elementData.validFrom) : new Date(),
                    validTo: elementData.validTo ? new Date(elementData.validTo) : null,
                    versionId: elementData.versionId || undefined,
                    externalId: elementData.externalId
                }
            });

            elementIdMap.set(elementData.id, newElement.id);

            // Import element stereotypes
            if (elementData.stereotypes && elementData.stereotypes.length > 0) {
                for (const stereotypeData of elementData.stereotypes) {
                    const stereotype = await this.prisma.stereotype.findFirst({
                        where: { name: stereotypeData.stereotypeName }
                    });

                    if (stereotype) {
                        await this.prisma.elementStereotype.create({
                            data: {
                                elementId: newElement.id,
                                stereotypeId: stereotype.id,
                                extendedProperties: stereotypeData.extendedProperties
                            }
                        });
                    }
                }
            }
        }

        // Import relationships (after all elements are imported)
        if (!importData.relationships || !Array.isArray(importData.relationships)) {
            console.warn('No relationships found in import data');
        } else {
            for (const relData of importData.relationships) {
                const sourceNewId = elementIdMap.get(relData.sourceId);
                const targetNewId = elementIdMap.get(relData.targetId);

                if (!sourceNewId || !targetNewId) {
                    console.warn(`Skipping relationship ${relData.id || 'unknown'}: source (${relData.sourceId}) or target (${relData.targetId}) element not found. Available element IDs: ${Array.from(elementIdMap.keys()).join(', ')}`);
                    continue;
                }

            // Find or create relation type
            let relationType = await this.prisma.relationType.findFirst({
                where: {
                    name: relData.relationType,
                    metamodelId: metamodel.id
                }
            });

            if (!relationType) {
                relationType = await this.prisma.relationType.create({
                    data: {
                        name: relData.relationType,
                        metamodelId: metamodel.id
                    }
                });
            }

            const newRelationship = await this.prisma.relationship.create({
                data: {
                    name: relData.name,
                    documentation: relData.documentation,
                    properties: relData.properties,
                    relationTypeId: relationType.id,
                    sourceId: sourceNewId,
                    targetId: targetNewId,
                    modelPackageId: newPackage.id,
                    validFrom: relData.validFrom ? new Date(relData.validFrom) : new Date(),
                    validTo: relData.validTo ? new Date(relData.validTo) : null,
                    versionId: relData.versionId || undefined
                }
            });

            // Import relationship stereotypes
            if (relData.stereotypes && relData.stereotypes.length > 0) {
                for (const stereotypeData of relData.stereotypes) {
                    const stereotype = await this.prisma.stereotype.findFirst({
                        where: { name: stereotypeData.stereotypeName }
                    });

                    if (stereotype) {
                        await this.prisma.relationshipStereotype.create({
                            data: {
                                relationshipId: newRelationship.id,
                                stereotypeId: stereotype.id,
                                extendedProperties: stereotypeData.extendedProperties
                            }
                        });
                    }
                }
            }
        }
        }

        // Import views
        for (const viewData of importData.views) {
            const newFolderId = viewData.folderId ? folderIdMap.get(viewData.folderId) : null;

            await this.prisma.view.create({
                data: {
                    name: viewData.name,
                    description: viewData.description,
                    content: viewData.content,
                    modelPackageId: newPackage.id,
                    folderId: newFolderId || undefined
                }
            });
        }

        return {
            success: true,
            packageId: newPackage.id,
            packageName: newPackage.name,
            imported: {
                elements: importData.elements.length,
                relationships: importData.relationships.length,
                folders: importData.folders.length,
                views: importData.views.length
            }
        };
    }

    async duplicatePackage(sourcePackageId: string, newPackageName: string) {
        // Export the source package
        const exportData = await this.exportPackage(sourcePackageId);
        
        // Import it with a new name
        const importResult = await this.importPackage(exportData, {
            newPackageName: newPackageName,
            overwrite: false
        });

        return importResult;
    }

    async deletePackage(id: string) {
        // Check if package exists
        const packageToDelete = await this.prisma.modelPackage.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        elements: true,
                        relationships: true,
                        folders: true,
                        views: true,
                    }
                }
            }
        });

        if (!packageToDelete) {
            throw new Error('Package not found');
        }

        // Delete all related data (cascade should handle this, but explicit is safer)
        // Delete relationships first
        await this.prisma.relationship.deleteMany({
            where: { modelPackageId: id }
        });

        // Delete elements (this will cascade to element stereotypes)
        await this.prisma.element.deleteMany({
            where: { modelPackageId: id }
        });

        // Delete views
        await this.prisma.view.deleteMany({
            where: { modelPackageId: id }
        });

        // Delete folders
        await this.prisma.folder.deleteMany({
            where: { modelPackageId: id }
        });

        // Delete change requests
        await this.prisma.changeRequest.deleteMany({
            where: { modelPackageId: id }
        });

        // Finally delete the package
        return this.prisma.modelPackage.delete({
            where: { id }
        });
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
        if (!packageId) {
            return [];
        }
        // Fetch all folders with their elements and views for the specified package
        const allFolders = await this.prisma.folder.findMany({
            where: { modelPackageId: packageId },
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

    async findElementsByPackage(packageId: string) {
        return this.prisma.element.findMany({
            where: { modelPackageId: packageId },
            include: {
                conceptType: true,
            },
        });
    }

    async findViewsByPackage(packageId: string) {
        return this.prisma.view.findMany({
            where: { modelPackageId: packageId },
        });
    }

    async deleteView(id: string) {
        return this.prisma.view.delete({
            where: { id }
        });
    }
}
