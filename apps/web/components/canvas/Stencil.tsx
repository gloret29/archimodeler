"use client";

import React, { useState, useEffect } from 'react';
import {
    Layers,
    Box
} from 'lucide-react';
import { ARCHIMATE_CONCEPTS, ConceptDefinition } from '@/lib/metamodel';
import { api } from '@/lib/api/client';
import { useTranslations } from 'next-intl';

// Map ArchiMate types to their SVG filenames (same as ArchiMateNode)
const svgMapping: Record<string, string> = {
    // Strategy
    'Resource': 'Resource.svg',
    'Capability': 'Capability.svg',
    'CourseOfAction': 'Course of Action.svg',
    'ValueStream': 'Value Stream.svg',

    // Business
    'BusinessActor': 'Business Actor.svg',
    'BusinessRole': 'Business Role.svg',
    'BusinessCollaboration': 'Business Collaboration.svg',
    'BusinessInterface': 'Business Interface.svg',
    'BusinessProcess': 'Business Process.svg',
    'BusinessFunction': 'Business Function.svg',
    'BusinessInteraction': 'Business Interaction.svg',
    'BusinessEvent': 'Business Event.svg',
    'BusinessService': 'Business Service.svg',
    'BusinessObject': 'Business Object.svg',
    'Contract': 'Contract.svg',
    'Representation': 'Representation.svg',
    'Product': 'Product.svg',

    // Application
    'ApplicationComponent': 'Application Component.svg',
    'ApplicationCollaboration': 'Application Collaboration.svg',
    'ApplicationInterface': 'Application Interface.svg',
    'ApplicationFunction': 'Application Function.svg',
    'ApplicationInteraction': 'Application Interaction.svg',
    'ApplicationProcess': 'Application Process.svg',
    'ApplicationEvent': 'Application Event.svg',
    'ApplicationService': 'Application Service.svg',
    'DataObject': 'DataObject.svg',

    // Technology
    'Node': 'Node.svg',
    'Device': 'Device.svg',
    'SystemSoftware': 'System Software.svg',
    'TechnologyCollaboration': 'Technology Collaboration.svg',
    'TechnologyInterface': 'Technology Interface.svg',
    'Path': 'Path.svg',
    'CommunicationNetwork': 'Communication Network.svg',
    'TechnologyFunction': 'Technology Function.svg',
    'TechnologyProcess': 'Technology Process.svg',
    'TechnologyInteraction': 'Technology Interaction.svg',
    'TechnologyEvent': 'Technology Event.svg',
    'TechnologyService': 'Technology Service.svg',
    'Artifact': 'Artifact.svg',

    // Physical
    'Equipment': 'Equipment.svg',
    'Facility': 'Facility.svg',
    'DistributionNetwork': 'Distribution Network.svg',
    'Material': 'Material.svg',

    // Motivation
    'Stakeholder': 'Stakeholder.svg',
    'Driver': 'Driver.svg',
    'Assessment': 'Assessment.svg',
    'Goal': 'Goal.svg',
    'Outcome': 'Outcome.svg',
    'Principle': 'Principle.svg',
    'Requirement': 'Requirement.svg',
    'Constraint': 'Constraint.svg',
    'Meaning': 'Meaning.svg',
    'Value': 'Value.svg',

    // Implementation
    'WorkPackage': 'Work Package.svg',
    'Deliverable': 'Deliverable.svg',
    'ImplementationEvent': 'Implementation Event.svg',
    'Plateau': 'Plateau.svg',
    'Gap': 'Gap.svg',

    // Composite
    'Grouping': 'Grouping.svg',
    'Location': 'Location.svg',
};

// Colors that adapt to dark/light theme
const layerColors: Record<string, string> = {
    'Strategy': 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-950/50',
    'Business': 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 hover:bg-yellow-100 dark:hover:bg-yellow-950/50',
    'Application': 'bg-cyan-50 dark:bg-cyan-950/30 border-cyan-200 dark:border-cyan-800 hover:bg-cyan-100 dark:hover:bg-cyan-950/50',
    'Technology': 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-950/50',
    'Physical': 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-950/50',
    'Motivation': 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-950/50',
    'Implementation & Migration': 'bg-pink-50 dark:bg-pink-950/30 border-pink-200 dark:border-pink-800 hover:bg-pink-100 dark:hover:bg-pink-950/50',
    'Composite': 'bg-muted border-border hover:bg-muted/80',
};

export default function Stencil() {
    const t = useTranslations('Stencil');
    const [searchTerm, setSearchTerm] = useState('');
    const [enabledConcepts, setEnabledConcepts] = useState<string[]>([]);

    useEffect(() => {
        // Fetch enabled concepts configuration
        api.get('/settings')
            .then((data: any) => {
                if (Array.isArray(data)) {
                    const palette = data.find((s: any) => s.key === 'palette');
                    if (palette && palette.value) {
                        setEnabledConcepts(palette.value);
                    } else {
                        // Default: all enabled if no setting found
                        setEnabledConcepts(ARCHIMATE_CONCEPTS.map(c => c.name));
                    }
                }
            })
            .catch(err => {
                console.error("Failed to fetch palette settings:", err);
                // Fallback to all enabled
                setEnabledConcepts(ARCHIMATE_CONCEPTS.map(c => c.name));
            });
    }, []);

    const onDragStart = (event: React.DragEvent, nodeType: string, layer: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, layer }));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Filter concepts by search term AND configuration
    const filteredConcepts = ARCHIMATE_CONCEPTS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        enabledConcepts.includes(c.name)
    );

    // Group by layer
    const groupedConcepts = filteredConcepts.reduce((acc, concept) => {
        if (!acc[concept.layer]) acc[concept.layer] = [];
        acc[concept.layer]!.push(concept);
        return acc;
    }, {} as Record<string, ConceptDefinition[]>);

    // Order layers with translations
    const layerOrder = [
        { key: 'Strategy', label: t('layerStrategy') },
        { key: 'Business', label: t('layerBusiness') },
        { key: 'Application', label: t('layerApplication') },
        { key: 'Technology', label: t('layerTechnology') },
        { key: 'Physical', label: t('layerPhysical') },
        { key: 'Motivation', label: t('layerMotivation') },
        { key: 'Implementation & Migration', label: t('layerImplementationMigration') },
        { key: 'Composite', label: t('layerComposite') }
    ];

    return (
        <aside className="w-72 bg-background border-r border-border h-full flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5" />
                    {t('palette')}
                </h2>
                <input
                    type="text"
                    placeholder={t('searchElements')}
                    className="w-full px-3 py-1 text-sm border rounded-md bg-background text-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {layerOrder.map(({ key, label }) => {
                    const items = groupedConcepts[key];
                    if (!items || items.length === 0) return null;

                    return (
                        <div key={key}>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">{label}</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {items.map((item) => {
                                    const svgFile = svgMapping[item.name];
                                    const colorClass = layerColors[key] || 'bg-muted border-border hover:bg-muted/80';

                                    return (
                                        <div
                                            key={item.name}
                                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border cursor-grab transition-all ${colorClass}`}
                                            onDragStart={(event) => onDragStart(event, item.name, item.layer)}
                                            draggable
                                            title={item.name}
                                        >
                                            {svgFile ? (
                                                <img 
                                                    src={`/archimate-symbols/${svgFile}`} 
                                                    alt={item.name}
                                                    className="w-8 h-8 object-contain pointer-events-none select-none dark:invert"
                                                />
                                            ) : (
                                                <Box className="w-6 h-6 text-muted-foreground" />
                                            )}
                                            <span className="text-[10px] font-medium text-center leading-tight line-clamp-2 w-full text-foreground">
                                                {item.name.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}