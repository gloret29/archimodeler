"use client";

import React, { useState, useEffect } from 'react';
import {
    Layers,
    Box
} from 'lucide-react';
import { ARCHIMATE_CONCEPTS, ConceptDefinition } from '@/lib/metamodel';

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

const layerColors: Record<string, string> = {
    'Strategy': 'bg-orange-50 border-orange-200 hover:bg-orange-100',
    'Business': 'bg-yellow-50 border-yellow-200 hover:bg-yellow-100',
    'Application': 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
    'Technology': 'bg-green-50 border-green-200 hover:bg-green-100',
    'Physical': 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
    'Motivation': 'bg-purple-50 border-purple-200 hover:bg-purple-100',
    'Implementation & Migration': 'bg-pink-50 border-pink-200 hover:bg-pink-100',
    'Composite': 'bg-gray-50 border-gray-200 hover:bg-gray-100',
};

export default function Stencil() {
    const [searchTerm, setSearchTerm] = useState('');
    const [enabledConcepts, setEnabledConcepts] = useState<string[]>([]);

    useEffect(() => {
        // Fetch enabled concepts configuration
        fetch('http://localhost:3002/settings')
            .then(res => res.json())
            .then(data => {
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

    // Order layers
    const layerOrder = [
        'Strategy', 'Business', 'Application', 'Technology',
        'Physical', 'Motivation', 'Implementation & Migration', 'Composite'
    ];

    return (
        <aside className="w-72 bg-background border-r border-border h-full flex flex-col">
            <div className="p-4 border-b border-border">
                <h2 className="text-lg font-semibold flex items-center gap-2 mb-2">
                    <Layers className="w-5 h-5" />
                    Palette
                </h2>
                <input
                    type="text"
                    placeholder="Search elements..."
                    className="w-full px-3 py-1 text-sm border rounded-md bg-background text-foreground"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {layerOrder.map(layer => {
                    const items = groupedConcepts[layer];
                    if (!items || items.length === 0) return null;

                    return (
                        <div key={layer}>
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3 pl-1">{layer} Layer</h3>
                            <div className="grid grid-cols-2 gap-2">
                                {items.map((item) => {
                                    const svgFile = svgMapping[item.name];
                                    const colorClass = layerColors[layer] || 'bg-gray-50 border-gray-200';

                                    return (
                                        <div
                                            key={item.name}
                                            className={`flex flex-col items-center justify-center gap-1 p-2 rounded-md border cursor-grab transition-all ${colorClass}`}
                                            onDragStart={(event) => onDragStart(event, item.name, layer)}
                                            draggable
                                            title={item.name}
                                        >
                                            {svgFile ? (
                                                <img 
                                                    src={`/archimate-symbols/${svgFile}`} 
                                                    alt={item.name}
                                                    className="w-8 h-8 object-contain pointer-events-none select-none"
                                                />
                                            ) : (
                                                <Box className="w-6 h-6 text-gray-500" />
                                            )}
                                            <span className="text-[10px] font-medium text-center leading-tight line-clamp-2 w-full">
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