export type LayerType =
    | 'Strategy'
    | 'Business'
    | 'Application'
    | 'Technology'
    | 'Physical'
    | 'Motivation'
    | 'Implementation & Migration'
    | 'Composite';

export interface ConceptDefinition {
    name: string;
    layer: LayerType;
    description?: string;
}

export const ARCHIMATE_CONCEPTS: ConceptDefinition[] = [
    // Strategy Layer
    { name: 'Resource', layer: 'Strategy' },
    { name: 'Capability', layer: 'Strategy' },
    { name: 'CourseOfAction', layer: 'Strategy' },
    { name: 'ValueStream', layer: 'Strategy' },

    // Business Layer
    { name: 'BusinessActor', layer: 'Business' },
    { name: 'BusinessRole', layer: 'Business' },
    { name: 'BusinessCollaboration', layer: 'Business' },
    { name: 'BusinessInterface', layer: 'Business' },
    { name: 'BusinessProcess', layer: 'Business' },
    { name: 'BusinessFunction', layer: 'Business' },
    { name: 'BusinessInteraction', layer: 'Business' },
    { name: 'BusinessEvent', layer: 'Business' },
    { name: 'BusinessService', layer: 'Business' },
    { name: 'BusinessObject', layer: 'Business' },
    { name: 'Contract', layer: 'Business' },
    { name: 'Representation', layer: 'Business' },
    { name: 'Product', layer: 'Business' },

    // Application Layer
    { name: 'ApplicationComponent', layer: 'Application' },
    { name: 'ApplicationCollaboration', layer: 'Application' },
    { name: 'ApplicationInterface', layer: 'Application' },
    { name: 'ApplicationFunction', layer: 'Application' },
    { name: 'ApplicationInteraction', layer: 'Application' },
    { name: 'ApplicationProcess', layer: 'Application' },
    { name: 'ApplicationEvent', layer: 'Application' },
    { name: 'ApplicationService', layer: 'Application' },
    { name: 'DataObject', layer: 'Application' },

    // Technology Layer
    { name: 'Node', layer: 'Technology' },
    { name: 'Device', layer: 'Technology' },
    { name: 'SystemSoftware', layer: 'Technology' },
    { name: 'TechnologyCollaboration', layer: 'Technology' },
    { name: 'TechnologyInterface', layer: 'Technology' },
    { name: 'Path', layer: 'Technology' },
    { name: 'CommunicationNetwork', layer: 'Technology' },
    { name: 'TechnologyFunction', layer: 'Technology' },
    { name: 'TechnologyProcess', layer: 'Technology' },
    { name: 'TechnologyInteraction', layer: 'Technology' },
    { name: 'TechnologyEvent', layer: 'Technology' },
    { name: 'TechnologyService', layer: 'Technology' },
    { name: 'Artifact', layer: 'Technology' },

    // Physical Layer
    { name: 'Equipment', layer: 'Physical' },
    { name: 'Facility', layer: 'Physical' },
    { name: 'DistributionNetwork', layer: 'Physical' },
    { name: 'Material', layer: 'Physical' },

    // Motivation Layer
    { name: 'Stakeholder', layer: 'Motivation' },
    { name: 'Driver', layer: 'Motivation' },
    { name: 'Assessment', layer: 'Motivation' },
    { name: 'Goal', layer: 'Motivation' },
    { name: 'Outcome', layer: 'Motivation' },
    { name: 'Principle', layer: 'Motivation' },
    { name: 'Requirement', layer: 'Motivation' },
    { name: 'Constraint', layer: 'Motivation' },
    { name: 'Meaning', layer: 'Motivation' },
    { name: 'Value', layer: 'Motivation' },

    // Implementation & Migration Layer
    { name: 'WorkPackage', layer: 'Implementation & Migration' },
    { name: 'Deliverable', layer: 'Implementation & Migration' },
    { name: 'ImplementationEvent', layer: 'Implementation & Migration' },
    { name: 'Plateau', layer: 'Implementation & Migration' },
    { name: 'Gap', layer: 'Implementation & Migration' },

    // Composite
    { name: 'Grouping', layer: 'Composite' },
    { name: 'Location', layer: 'Composite' },
];

export type ConceptType = string; // Relaxed type for now to support all strings

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
    source: string;
    target: string;
    relations: RelationType[];
}

// Simplified rules: Allow most common relationships for now to avoid blocking the user
// In a real app, this would be a full matrix
export const RELATIONSHIP_RULES: Rule[] = [
    // Default fallback rule (handled in code logic usually, but here we list specific ones)
];

export function getValidRelations(sourceType: string, targetType: string): RelationType[] {
    // For now, to support the expanded palette without writing a 1000-line matrix, 
    // we will return a default set of relationships if no specific rule is found.
    // This allows the user to model freely.

    const specificRules = RELATIONSHIP_RULES.find(r => r.source === sourceType && r.target === targetType);
    if (specificRules) return specificRules.relations;

    // Generic ArchiMate rules (simplified)
    return [
        'Association',
        'Composition',
        'Aggregation',
        'Assignment',
        'Realization',
        'Serving',
        'Access',
        'Influence',
        'Triggering',
        'Flow',
        'Specialization'
    ];
}
