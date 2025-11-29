export type ConceptType =
    | 'BusinessActor'
    | 'BusinessRole'
    | 'BusinessProcess'
    | 'ApplicationComponent'
    | 'ApplicationService'
    | 'Node'
    | 'Device';

export type RelationType =
    | 'Assignment'
    | 'Realization'
    | 'Serving'
    | 'Access'
    | 'Influence'
    | 'Triggering'
    | 'Flow'
    | 'Composition'
    | 'Aggregation'
    | 'Specialization'
    | 'Association';

interface Rule {
    source: ConceptType;
    target: ConceptType;
    relations: RelationType[];
}

// Mock rules based on ArchiMate 3.1 subset
export const RELATIONSHIP_RULES: Rule[] = [
    // Business Layer
    { source: 'BusinessActor', target: 'BusinessRole', relations: ['Assignment'] },
    { source: 'BusinessRole', target: 'BusinessProcess', relations: ['Triggering', 'Assignment'] },
    { source: 'BusinessProcess', target: 'BusinessProcess', relations: ['Flow', 'Triggering', 'Composition'] },

    // Application Layer
    { source: 'ApplicationComponent', target: 'ApplicationService', relations: ['Realization'] },
    { source: 'ApplicationComponent', target: 'ApplicationComponent', relations: ['Flow', 'Composition', 'Aggregation'] },
    { source: 'ApplicationComponent', target: 'BusinessProcess', relations: ['Serving'] }, // Cross-layer

    // Technology Layer
    { source: 'Node', target: 'Device', relations: ['Composition'] },
    { source: 'Device', target: 'ApplicationComponent', relations: ['Assignment'] }, // Cross-layer
    { source: 'Node', target: 'ApplicationComponent', relations: ['Assignment'] }, // Cross-layer

    // Cross-Layer General
    { source: 'ApplicationService', target: 'BusinessProcess', relations: ['Serving'] },
    { source: 'ApplicationService', target: 'BusinessRole', relations: ['Serving'] },
];

export function getValidRelations(sourceType: string, targetType: string): RelationType[] {
    const rule = RELATIONSHIP_RULES.find(r => r.source === sourceType && r.target === targetType);
    return rule ? rule.relations : [];
}
