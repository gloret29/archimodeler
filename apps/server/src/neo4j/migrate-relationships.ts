import { PrismaClient } from '@repo/database';
import neo4j, { Driver } from 'neo4j-driver';

/**
 * Migration script to transfer existing relationships from PostgreSQL to Neo4j
 * Run this script once to migrate existing data
 */
async function migrateRelationships() {
    const prisma = new PrismaClient();
    
    const uri = process.env.NEO4J_URI || 'bolt://localhost:7687';
    const user = process.env.NEO4J_USER || 'neo4j';
    const password = process.env.NEO4J_PASSWORD || 'password';
    
    const driver: Driver = neo4j.driver(uri, neo4j.auth.basic(user, password));
    const session = driver.session();

    try {
        console.log('Starting migration of relationships from PostgreSQL to Neo4j...');

        // First, ensure all elements exist in Neo4j
        console.log('Creating element nodes in Neo4j...');
        const elements = await prisma.element.findMany({
            include: { conceptType: true },
        });

        for (const element of elements) {
            const createElementQuery = `
                MERGE (e:Element {id: $elementId})
                SET e.name = $name,
                    e.conceptTypeId = $conceptTypeId
            `;
            await session.run(createElementQuery, {
                elementId: element.id,
                name: element.name,
                conceptTypeId: element.conceptTypeId,
            });
        }
        console.log(`Created ${elements.length} element nodes in Neo4j`);

        // Now migrate relationships
        console.log('Migrating relationships...');
        const relationships = await prisma.relationship.findMany({
            include: {
                relationType: true,
                source: true,
                target: true,
            },
        });

        let migrated = 0;
        let skipped = 0;

        for (const rel of relationships) {
            try {
                // Check if relationship already exists
                const checkQuery = `
                    MATCH ()-[r:RELATES_TO {id: $id}]->()
                    RETURN r.id as id
                `;
                const existing = await session.run(checkQuery, { id: rel.id });
                
                if (existing.records.length > 0) {
                    console.log(`Relationship ${rel.id} already exists in Neo4j, skipping...`);
                    skipped++;
                    continue;
                }

                const createRelQuery = `
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

                await session.run(createRelQuery, {
                    id: rel.id,
                    name: rel.name || null,
                    documentation: rel.documentation || null,
                    properties: rel.properties || null,
                    relationTypeId: rel.relationTypeId,
                    relationTypeName: rel.relationType.name,
                    sourceId: rel.sourceId,
                    targetId: rel.targetId,
                    modelPackageId: rel.modelPackageId,
                    validFrom: rel.validFrom.toISOString(),
                    validTo: rel.validTo ? rel.validTo.toISOString() : null,
                    versionId: rel.versionId,
                });

                migrated++;
                if (migrated % 100 === 0) {
                    console.log(`Migrated ${migrated} relationships...`);
                }
            } catch (error) {
                console.error(`Error migrating relationship ${rel.id}:`, error);
            }
        }

        console.log(`\nMigration completed!`);
        console.log(`- Migrated: ${migrated} relationships`);
        console.log(`- Skipped: ${skipped} relationships`);
        console.log(`- Total: ${relationships.length} relationships`);
    } catch (error) {
        console.error('Migration failed:', error);
        throw error;
    } finally {
        await session.close();
        await driver.close();
        await prisma.$disconnect();
    }
}

// Run migration if this file is executed directly
if (require.main === module) {
    migrateRelationships()
        .then(() => {
            console.log('Migration script completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration script failed:', error);
            process.exit(1);
        });
}

export { migrateRelationships };

