import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { IDataSource } from '../interfaces/data-source.interface';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ServiceNowConnector implements IDataSource {
    private readonly logger = new Logger(ServiceNowConnector.name);

    constructor(private readonly httpService: HttpService) { }

    async fetch(config: any): Promise<any[]> {
        const { url, username, password, table, query } = config;

        if (!url || !username || !password || !table) {
            this.logger.error('Missing configuration for ServiceNow connector');
            return [];
        }

        try {
            const response = await firstValueFrom(
                this.httpService.get(`${url}/api/now/table/${table}`, {
                    params: { sysparm_query: query },
                    auth: { username, password },
                })
            );
            return response.data.result;
        } catch (error) {
            this.logger.error('Failed to fetch data from ServiceNow', error);
            // Return mock data if connection fails for demo purposes
            if (process.env.NODE_ENV !== 'production') {
                this.logger.warn('Returning mock data for development');
                return [
                    { sys_id: '1', name: 'SAP ERP', install_status: 'Installed' },
                    { sys_id: '2', name: 'Salesforce CRM', install_status: 'Installed' },
                    { sys_id: '3', name: 'Legacy HR System', install_status: 'Retired' },
                ];
            }
            throw error;
        }
    }

    map(data: any[], mapping: any): any[] {
        return data.map(item => {
            const mappedItem: any = {};
            for (const [targetField, sourceField] of Object.entries(mapping)) {
                mappedItem[targetField] = item[sourceField as string];
            }
            // Preserve external ID
            mappedItem.externalId = item.sys_id;
            return mappedItem;
        });
    }
}
