import { Injectable } from '@nestjs/common';
import { Neo4jService } from './neo4j.service';

export interface RelationshipNode {
    id: string;
    name?: string;
    documentation?: string;
    properties?: Record<string, any>;
    relationTypeId: string;
    relationTypeName: string;
    sourceId: string;
    targetId: string;
    modelPackageId: string;
    validFrom: string;
    validTo?: string;
    versionId: string;
}

@Injectable()
export class RelationshipsService {
    constructor(private neo4jService: Neo4jService) { }

    /**
     * Create a relationship in Neo4j
     */
    async createRelationship(data: {
        id: string;
        name?: string;
        documentation?: string;
        properties?: Record<string, any>;
        relationTypeId: string;
        relationTypeName: string;
        sourceId: string;
        targetId: string;
        modelPackageId: string;
        validFrom: Date;
        validTo?: Date;
        versionId: string;
    }): Promise<void> {
        const query = `
            MATCH (source:Element {id: $sourceId})
            MATCH (target:Element {id: $targetId})
            MERGE (source)-[r:RELATES_TO {
                id: $id,
                relationTypeId: $relationTypeId,
                relationTypeName: $relationTypeName,
                modelPackageId: $modelPackageId,
                versionId: $versionId
            }]->(target)
            SET r.name = $name,
                r.documentation = $documentation,
                r.properties = $properties,
                r.validFrom = $validFrom,
                r.validTo = $validTo
        `;

        await this.neo4jService.executeQuery(query, {
            id: data.id,
            name: data.name || null,
            documentation: data.documentation || null,
            properties: data.properties || null,
            relationTypeId: data.relationTypeId,
            relationTypeName: data.relationTypeName,
            sourceId: data.sourceId,
            targetId: data.targetId,
            modelPackageId: data.modelPackageId,
            validFrom: data.validFrom.toISOString(),
            validTo: data.validTo ? data.validTo.toISOString() : null,
            versionId: data.versionId,
        });
    }

    /**
     * Get a relationship by ID
     */
    async getRelationship(id: string): Promise<RelationshipNode | null> {
        const query = `
            MATCH (source:Element)-[r:RELATES_TO {id: $id}]->(target:Element)
            RETURN r.id as id,
                   r.name as name,
                   r.documentation as documentation,
                   r.properties as properties,
                   r.relationTypeId as relationTypeId,
                   r.relationTypeName as relationTypeName,
                   source.id as sourceId,
                   target.id as targetId,
                   r.modelPackageId as modelPackageId,
                   r.validFrom as validFrom,
                   r.validTo as validTo,
                   r.versionId as versionId
        `;

        const results = await this.neo4jService.executeQuery<RelationshipNode>(query, { id });
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Get all relationships for a given element (as source or target)
     */
    async getElementRelationships(elementId: string): Promise<RelationshipNode[]> {
        const query = `
            MATCH (source:Element)-[r:RELATES_TO]->(target:Element)
            WHERE source.id = $elementId OR target.id = $elementId
            RETURN r.id as id,
                   r.name as name,
                   r.documentation as documentation,
                   r.properties as properties,
                   r.relationTypeId as relationTypeId,
                   r.relationTypeName as relationTypeName,
                   source.id as sourceId,
                   target.id as targetId,
                   r.modelPackageId as modelPackageId,
                   r.validFrom as validFrom,
                   r.validTo as validTo,
                   r.versionId as versionId
        `;

        return this.neo4jService.executeQuery<RelationshipNode>(query, { elementId });
    }

    /**
     * Get relationships between two elements
     */
    async getRelationshipsBetween(sourceId: string, targetId: string): Promise<RelationshipNode[]> {
        const query = `
            MATCH (source:Element {id: $sourceId})-[r:RELATES_TO]->(target:Element {id: $targetId})
            RETURN r.id as id,
                   r.name as name,
                   r.documentation as documentation,
                   r.properties as properties,
                   r.relationTypeId as relationTypeId,
                   r.relationTypeName as relationTypeName,
                   source.id as sourceId,
                   target.id as targetId,
                   r.modelPackageId as modelPackageId,
                   r.validFrom as validFrom,
                   r.validTo as validTo,
                   r.versionId as versionId
        `;

        return this.neo4jService.executeQuery<RelationshipNode>(query, { sourceId, targetId });
    }

    /**
     * Update a relationship
     */
    async updateRelationship(id: string, data: {
        name?: string;
        documentation?: string;
        properties?: Record<string, any>;
        validTo?: Date;
    }): Promise<void> {
        const query = `
            MATCH ()-[r:RELATES_TO {id: $id}]->()
            SET r.name = COALESCE($name, r.name),
                r.documentation = COALESCE($documentation, r.documentation),
                r.properties = COALESCE($properties, r.properties),
                r.validTo = COALESCE($validTo, r.validTo)
        `;

        await this.neo4jService.executeQuery(query, {
            id,
            name: data.name !== undefined ? data.name : null,
            documentation: data.documentation !== undefined ? data.documentation : null,
            properties: data.properties !== undefined ? data.properties : null,
            validTo: data.validTo ? data.validTo.toISOString() : null,
        });
    }

    /**
     * Delete a relationship
     */
    async deleteRelationship(id: string): Promise<void> {
        const query = `
            MATCH ()-[r:RELATES_TO {id: $id}]->()
            DELETE r
        `;

        await this.neo4jService.executeQuery(query, { id });
    }

    /**
     * Ensure an Element node exists in Neo4j (called when creating/updating elements)
     */
    async ensureElementNode(elementId: string, name: string, conceptTypeId: string): Promise<void> {
        const query = `
            MERGE (e:Element {id: $elementId})
            SET e.name = $name,
                e.conceptTypeId = $conceptTypeId
        `;

        await this.neo4jService.executeQuery(query, {
            elementId,
            name,
            conceptTypeId,
        });
    }

    /**
     * Delete an Element node and all its relationships
     */
    async deleteElementNode(elementId: string): Promise<void> {
        const query = `
            MATCH (e:Element {id: $elementId})
            DETACH DELETE e
        `;

        await this.neo4jService.executeQuery(query, { elementId });
    }

    /**
     * Get all relationships for a model package
     */
    async getPackageRelationships(modelPackageId: string): Promise<RelationshipNode[]> {
        const query = `
            MATCH (source:Element)-[r:RELATES_TO {modelPackageId: $modelPackageId}]->(target:Element)
            RETURN r.id as id,
                   r.name as name,
                   r.documentation as documentation,
                   r.properties as properties,
                   r.relationTypeId as relationTypeId,
                   r.relationTypeName as relationTypeName,
                   source.id as sourceId,
                   target.id as targetId,
                   r.modelPackageId as modelPackageId,
                   r.validFrom as validFrom,
                   r.validTo as validTo,
                   r.versionId as versionId
        `;

        return this.neo4jService.executeQuery<RelationshipNode>(query, { modelPackageId });
    }
}

