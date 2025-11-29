import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import neo4j, { Driver, Session } from 'neo4j-driver';

@Injectable()
export class Neo4jService implements OnModuleInit, OnModuleDestroy {
    private driver: Driver;

    constructor() {
        const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
        const user = process.env.NEO4J_USER || 'neo4j';
        const password = process.env.NEO4J_PASSWORD || 'password';

        this.driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    }

    async onModuleInit() {
        try {
            await this.driver.verifyConnectivity();
            console.log('Neo4j connection established');
        } catch (error) {
            console.error('Failed to connect to Neo4j:', error);
            console.warn('Neo4j is not available. The application will continue but Neo4j features will not work.');
            // Don't throw error to allow app to start without Neo4j
        }
    }

    async onModuleDestroy() {
        await this.driver.close();
    }

    getDriver(): Driver {
        return this.driver;
    }

    getSession(): Session {
        return this.driver.session();
    }

    async executeQuery<T = any>(query: string, params?: Record<string, any>): Promise<T[]> {
        const session = this.getSession();
        try {
            const result = await session.run(query, params);
            return result.records.map(record => {
                const obj: any = {};
                record.keys.forEach(key => {
                    obj[key] = record.get(key);
                });
                return obj as T;
            });
        } finally {
            await session.close();
        }
    }
}

