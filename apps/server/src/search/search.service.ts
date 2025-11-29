import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Client } from '@opensearch-project/opensearch';

@Injectable()
export class SearchService implements OnModuleInit {
    private client: Client;
    private readonly logger = new Logger(SearchService.name);

    constructor() {
        this.client = new Client({
            node: process.env.OPENSEARCH_NODE || 'http://localhost:9200',
        });
    }

    async onModuleInit() {
        try {
            const indexExists = await this.client.indices.exists({ index: 'elements' });
            if (!indexExists.body) {
                await this.client.indices.create({
                    index: 'elements',
                    body: {
                        mappings: {
                            properties: {
                                name: { type: 'text' },
                                documentation: { type: 'text' },
                                type: { type: 'keyword' },
                                layer: { type: 'keyword' },
                                properties: { type: 'object' }, // Dynamic properties
                            },
                        },
                    },
                });
                this.logger.log('Created index: elements');
            }
        } catch (error) {
            this.logger.error('Failed to connect to OpenSearch', error);
        }
    }

    async indexElement(element: any) {
        try {
            await this.client.index({
                index: 'elements',
                id: element.id,
                body: {
                    name: element.name,
                    documentation: element.documentation,
                    type: element.conceptType?.name,
                    layer: element.conceptType?.category,
                    properties: element.properties,
                },
                refresh: true,
            });
            this.logger.log(`Indexed element: ${element.id}`);
        } catch (error) {
            this.logger.error(`Failed to index element ${element.id}`, error);
        }
    }

    async search(query: string) {
        try {
            const result = await this.client.search({
                index: 'elements',
                body: {
                    query: {
                        multi_match: {
                            query,
                            fields: ['name', 'documentation', 'properties.*'],
                        },
                    },
                },
            });
            return result.body.hits.hits.map((hit: any) => hit._source);
        } catch (error) {
            this.logger.error('Search failed', error);
            return [];
        }
    }

    async getDashboardMetrics() {
        try {
            const result = await this.client.search({
                index: 'elements',
                body: {
                    size: 0,
                    aggs: {
                        by_type: {
                            terms: { field: 'type' },
                        },
                        by_layer: {
                            terms: { field: 'layer' },
                        },
                    },
                },
            });
            return result.body.aggregations;
        } catch (error) {
            this.logger.error('Aggregation failed', error);
            return {};
        }
    }
}
