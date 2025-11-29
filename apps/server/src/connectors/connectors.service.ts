import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ServiceNowConnector } from './servicenow/servicenow.connector';
import { ModelService } from '../model/model.service';
import { Prisma } from '@repo/database';

@Injectable()
export class ConnectorsService implements OnModuleInit {
    private readonly logger = new Logger(ConnectorsService.name);

    constructor(
        private prisma: PrismaService,
        private serviceNowConnector: ServiceNowConnector,
        private modelService: ModelService,
    ) { }

    async onModuleInit() {
        const count = await this.prisma.dataSource.count();
        if (count === 0) {
            this.logger.log('Seeding sample ServiceNow data source...');
            await this.prisma.dataSource.create({
                data: {
                    name: 'Corporate ServiceNow',
                    type: 'ServiceNow',
                    config: {
                        url: 'https://dev12345.service-now.com',
                        username: 'admin',
                        password: 'password',
                        table: 'cmdb_ci_appl',
                        query: 'install_status=1'
                    },
                    mapping: {
                        name: 'name',
                        documentation: 'short_description'
                    }
                }
            });
        }
    }

    async createDataSource(data: Prisma.DataSourceCreateInput) {
        return this.prisma.dataSource.create({ data });
    }

    async findAll() {
        return this.prisma.dataSource.findMany();
    }

    async syncDataSource(id: string) {
        const dataSource = await this.prisma.dataSource.findUnique({ where: { id } });
        if (!dataSource) throw new NotFoundException('Data source not found');

        let rawData: any[] = [];
        let mappedData: any[] = [];

        // 1. Fetch
        if (dataSource.type === 'ServiceNow') {
            rawData = await this.serviceNowConnector.fetch(dataSource.config);
            mappedData = this.serviceNowConnector.map(rawData, dataSource.mapping);
        } else {
            throw new Error(`Unsupported data source type: ${dataSource.type}`);
        }

        // 2. Sync (Upsert)
        // We assume mapping contains 'name', 'documentation', and 'conceptType' info or we default it
        // For this MVP, let's assume we are importing ApplicationComponents

        // Find ApplicationComponent concept type
        const appComponentType = await this.prisma.conceptType.findFirst({ where: { name: 'ApplicationComponent' } });
        if (!appComponentType) throw new Error('ApplicationComponent concept type not found');

        // Find a default Model Package for imports
        let modelPackage = await this.prisma.modelPackage.findFirst({ where: { name: 'Imported' } });
        if (!modelPackage) {
            modelPackage = await this.prisma.modelPackage.create({ data: { name: 'Imported' } });
        }

        const results = [];
        for (const item of mappedData) {
            // Check if element exists by externalId and dataSourceId
            const existing = await this.prisma.element.findFirst({
                where: {
                    externalId: item.externalId,
                    dataSourceId: dataSource.id
                }
            });

            const elementData: Prisma.ElementCreateInput = {
                name: item.name,
                documentation: item.documentation || `Imported from ${dataSource.name}`,
                properties: item, // Store all mapped props
                conceptType: { connect: { id: appComponentType.id } },
                modelPackage: { connect: { id: modelPackage.id } },
                dataSource: { connect: { id: dataSource.id } },
                externalId: item.externalId
            };

            if (existing) {
                // Update
                results.push(await this.modelService.updateElement(existing.id, elementData));
            } else {
                // Create
                results.push(await this.modelService.createElement(elementData));
            }
        }

        // Update last sync
        await this.prisma.dataSource.update({
            where: { id },
            data: { lastSync: new Date() }
        });

        return { synced: results.length };
    }
}
