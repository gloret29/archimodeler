import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const roles = [
        {
            name: 'Consumer',
            description: 'Lecture seule, commentaires.',
        },
        {
            name: 'Contributor',
            description: 'Édition de blocs de données spécifiques, pas de modification de structure.',
        },
        {
            name: 'Designer',
            description: 'Création et modification de modèles.',
        },
        {
            name: 'Lead Designer',
            description: 'Gestion des métamodèles et des versions.',
        },
        {
            name: 'System Administrator',
            description: 'Gestion des utilisateurs et des licences.',
        },
    ];

    for (const role of roles) {
        await prisma.role.upsert({
            where: { name: role.name },
            update: {},
            create: role,
        });
    }

    console.log('Roles seeded successfully.');

    // --- Admin User Seeding ---
    const bcrypt = require('bcrypt');
    const hashedPassword = await bcrypt.hash('admin123', 10);

    const adminRole = await prisma.role.findUnique({ where: { name: 'System Administrator' } });

    if (adminRole) {
        await prisma.user.upsert({
            where: { email: 'admin@archimodeler.com' },
            update: {},
            create: {
                email: 'admin@archimodeler.com',
                password: hashedPassword,
                name: 'Admin User',
                roles: {
                    connect: { id: adminRole.id }
                }
            }
        });
        console.log('Admin user seeded successfully.');
    }

    // --- ArchiMate 3.1 Seeding ---
    const metamodelName = "ArchiMate 3.1";
    const metamodel = await prisma.metamodel.upsert({
        where: { name: metamodelName },
        update: {},
        create: {
            name: metamodelName,
            version: "3.1",
            description: "Standard ArchiMate 3.1 Metamodel",
        },
    });

    // Concepts
    const concepts = [
        { name: "BusinessActor", category: "Business" },
        { name: "BusinessRole", category: "Business" },
        { name: "BusinessProcess", category: "Business" },
        { name: "ApplicationComponent", category: "Application" },
        { name: "ApplicationService", category: "Application" },
        { name: "Node", category: "Technology" },
        { name: "Device", category: "Technology" },
    ];

    const conceptMap = new Map<string, string>();

    for (const concept of concepts) {
        const c = await prisma.conceptType.upsert({
            where: {
                name_metamodelId: {
                    name: concept.name,
                    metamodelId: metamodel.id,
                },
            },
            update: {},
            create: {
                name: concept.name,
                category: concept.category,
                metamodelId: metamodel.id,
            },
        });
        conceptMap.set(concept.name, c.id);
    }

    // Relations
    const relations = [
        "Assignment",
        "Realization",
        "Serving",
        "Access",
        "Influence",
        "Triggering",
        "Flow",
        "Composition",
        "Aggregation",
        "Specialization",
        "Association",
    ];

    const relationMap = new Map<string, string>();

    for (const relationName of relations) {
        const r = await prisma.relationType.upsert({
            where: {
                name_metamodelId: {
                    name: relationName,
                    metamodelId: metamodel.id,
                },
            },
            update: {},
            create: {
                name: relationName,
                metamodelId: metamodel.id,
            },
        });
        relationMap.set(relationName, r.id);
    }

    // Rules (Source -> Relation -> Target)
    // This is a subset of valid ArchiMate relationships for the defined types
    const rules = [
        // Business Layer
        { source: "BusinessActor", relation: "Assignment", target: "BusinessRole" },
        { source: "BusinessRole", relation: "Triggering", target: "BusinessProcess" },
        { source: "BusinessProcess", relation: "Flow", target: "BusinessProcess" },
        { source: "BusinessProcess", relation: "Triggering", target: "BusinessProcess" },

        // Application Layer
        { source: "ApplicationComponent", relation: "Realization", target: "ApplicationService" },
        { source: "ApplicationComponent", relation: "Flow", target: "ApplicationComponent" },

        // Technology Layer
        { source: "Node", relation: "Composition", target: "Device" }, // Or Device is a Node

        // Cross-Layer
        { source: "ApplicationService", relation: "Serving", target: "BusinessProcess" },
        { source: "ApplicationService", relation: "Serving", target: "BusinessRole" },
        { source: "Node", relation: "Assignment", target: "ApplicationComponent" },
        { source: "Device", relation: "Assignment", target: "ApplicationComponent" },
    ];

    for (const rule of rules) {
        const sourceId = conceptMap.get(rule.source);
        const targetId = conceptMap.get(rule.target);
        const relationId = relationMap.get(rule.relation);

        if (sourceId && targetId && relationId) {
            await prisma.relationType.update({
                where: { id: relationId },
                data: {
                    allowedSourceTypes: {
                        connect: { id: sourceId },
                    },
                    allowedTargetTypes: {
                        connect: { id: targetId },
                    },
                },
            });
        }
    }

    console.log('ArchiMate 3.1 Metamodel seeded successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
