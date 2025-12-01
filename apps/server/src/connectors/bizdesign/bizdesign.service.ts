import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { ModelService } from '../../model/model.service';

export interface BizDesignConfig {
    url: string;
    username: string;
    password: string;
    repositoryId?: string;
}

export interface BizDesignElement {
    id: string;
    name: string;
    type: string;
    properties?: Record<string, any>;
    relationships?: Array<{
        id: string;
        type: string;
        sourceId: string;
        targetId: string;
        properties?: Record<string, any>;
    }>;
}

export interface BizDesignRepository {
    id: string;
    name: string;
    description?: string;
}

@Injectable()
export class BizDesignService {
    private readonly logger = new Logger(BizDesignService.name);

    constructor(
        private readonly httpService: HttpService,
        private readonly modelService: ModelService,
    ) {}

    /**
     * Teste la connexion à l'API BizDesign
     */
    async testConnection(config: BizDesignConfig): Promise<{ success: boolean; message: string; data?: any }> {
        try {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            
            const response = await firstValueFrom(
                this.httpService.get(`${config.url}/api/repositories`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                    timeout: 10000,
                })
            );

            return {
                success: true,
                message: 'Connexion réussie',
                data: response.data,
            };
        } catch (error: any) {
            this.logger.error('Failed to connect to BizDesign API', error);
            return {
                success: false,
                message: error.response?.data?.message || error.message || 'Erreur de connexion',
            };
        }
    }

    /**
     * Récupère la liste des repositories BizDesign
     */
    async getRepositories(config: BizDesignConfig): Promise<BizDesignRepository[]> {
        try {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            
            const response = await firstValueFrom(
                this.httpService.get(`${config.url}/api/repositories`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            this.logger.error('Failed to fetch repositories from BizDesign', error);
            throw new Error(`Failed to fetch repositories: ${error.message}`);
        }
    }

    /**
     * Récupère les éléments d'un repository BizDesign
     */
    async getElements(config: BizDesignConfig, repositoryId: string): Promise<BizDesignElement[]> {
        try {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            
            const response = await firstValueFrom(
                this.httpService.get(`${config.url}/api/repositories/${repositoryId}/elements`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            this.logger.error('Failed to fetch elements from BizDesign', error);
            throw new Error(`Failed to fetch elements: ${error.message}`);
        }
    }

    /**
     * Récupère les relations d'un repository BizDesign
     */
    async getRelationships(config: BizDesignConfig, repositoryId: string): Promise<any[]> {
        try {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            
            const response = await firstValueFrom(
                this.httpService.get(`${config.url}/api/repositories/${repositoryId}/relationships`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            this.logger.error('Failed to fetch relationships from BizDesign', error);
            throw new Error(`Failed to fetch relationships: ${error.message}`);
        }
    }

    /**
     * Récupère les vues d'un repository BizDesign
     */
    async getViews(config: BizDesignConfig, repositoryId: string): Promise<any[]> {
        try {
            const auth = Buffer.from(`${config.username}:${config.password}`).toString('base64');
            
            const response = await firstValueFrom(
                this.httpService.get(`${config.url}/api/repositories/${repositoryId}/views`, {
                    headers: {
                        'Authorization': `Basic ${auth}`,
                        'Content-Type': 'application/json',
                    },
                })
            );

            return Array.isArray(response.data) ? response.data : [];
        } catch (error: any) {
            this.logger.error('Failed to fetch views from BizDesign', error);
            throw new Error(`Failed to fetch views: ${error.message}`);
        }
    }

    /**
     * Convertit les données BizDesign au format ArchiModeler
     */
    private convertBizDesignToArchiModeler(
        bizDesignElements: BizDesignElement[],
        bizDesignRelationships: any[],
        bizDesignViews: any[],
        repositoryName: string
    ): any {
        // Mapping des types BizDesign vers ArchiMate
        const typeMapping: Record<string, string> = {
            'BusinessActor': 'BusinessActor',
            'BusinessRole': 'BusinessRole',
            'BusinessProcess': 'BusinessProcess',
            'ApplicationComponent': 'ApplicationComponent',
            'ApplicationService': 'ApplicationService',
            'TechnologyNode': 'TechnologyNode',
            'TechnologyService': 'TechnologyService',
            // Ajouter d'autres mappings selon les besoins
        };

        // Convertir les éléments
        const elements = bizDesignElements.map((elem) => {
            const archiMateType = typeMapping[elem.type] || elem.type;
            return {
                name: elem.name,
                conceptTypeName: archiMateType,
                properties: elem.properties || {},
                externalId: elem.id, // Garder la référence à l'ID BizDesign
            };
        });

        // Convertir les relations
        const relationships = bizDesignRelationships.map((rel) => {
            return {
                sourceElementName: this.findElementName(bizDesignElements, rel.sourceId),
                targetElementName: this.findElementName(bizDesignElements, rel.targetId),
                relationTypeName: rel.type || 'Association',
                properties: rel.properties || {},
                externalId: rel.id,
            };
        });

        // Convertir les vues
        const views = bizDesignViews.map((view) => {
            return {
                name: view.name || 'Imported View',
                description: view.description,
                content: view.content || { nodes: [], edges: [] },
            };
        });

        return {
            package: {
                name: repositoryName,
                description: `Imported from BizDesign on ${new Date().toISOString()}`,
            },
            elements,
            relationships,
            folders: [], // BizDesign n'a pas de dossiers, on peut en créer si nécessaire
            views,
        };
    }

    /**
     * Trouve le nom d'un élément par son ID
     */
    private findElementName(elements: BizDesignElement[], id: string): string {
        const element = elements.find((e) => e.id === id);
        return element?.name || id;
    }

    /**
     * Importe un repository BizDesign vers un ModelPackage
     */
    async importRepository(
        config: BizDesignConfig,
        repositoryId: string,
        targetPackageId?: string,
        options?: { overwrite?: boolean; newPackageName?: string }
    ): Promise<any> {
        try {
            this.logger.log(`Starting import from BizDesign repository ${repositoryId}`);

            // Récupérer les données du repository
            const repositories = await this.getRepositories(config);
            const repository = repositories.find((r) => r.id === repositoryId);
            
            if (!repository) {
                throw new Error(`Repository ${repositoryId} not found`);
            }

            // Récupérer les éléments, relations et vues
            const [elements, relationships, views] = await Promise.all([
                this.getElements(config, repositoryId),
                this.getRelationships(config, repositoryId),
                this.getViews(config, repositoryId),
            ]);

            this.logger.log(`Fetched ${elements.length} elements, ${relationships.length} relationships, ${views.length} views`);

            // Convertir au format ArchiModeler
            const importData = this.convertBizDesignToArchiModeler(
                elements,
                relationships,
                views,
                options?.newPackageName || repository.name
            );

            // Importer via le ModelService
            const result = await this.modelService.importPackage(importData, {
                overwrite: options?.overwrite || false,
                newPackageName: options?.newPackageName || repository.name,
            });

            this.logger.log(`Successfully imported repository ${repositoryId} to package ${result.packageId}`);
            return result;
        } catch (error: any) {
            this.logger.error(`Failed to import repository ${repositoryId}`, error);
            throw new Error(`Failed to import repository: ${error.message}`);
        }
    }
}

