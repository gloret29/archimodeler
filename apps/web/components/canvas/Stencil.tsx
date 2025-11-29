"use client";

import React, { useState } from 'react';
import {
    User, Server, Database, Box, Layers,
    Zap, Target, Flag, Shield, FileText,
    Briefcase, Cpu, HardDrive, Truck,
    GitMerge, GitCommit, Folder, MapPin,
    Activity, Anchor, Award, Book, Circle, Hexagon
} from 'lucide-react';
import { ARCHIMATE_CONCEPTS, ConceptDefinition } from '@/lib/metamodel';

const icons: Record<string, any> = {
    // Strategy
    'Resource': Database,
    'Capability': Zap,
    'CourseOfAction': Activity,
    'ValueStream': GitMerge,

    // Business
    'BusinessActor': User,
    'BusinessRole': User,
    'BusinessCollaboration': User,
    'BusinessInterface': Circle,
    'BusinessProcess': Activity,
    'BusinessFunction': Box,
    'BusinessInteraction': GitMerge,
    'BusinessEvent': Flag,
    'BusinessService': Briefcase,
    'BusinessObject': FileText,
    'Contract': FileText,
    'Representation': FileText,
    'Product': Box,

    // Application
    'ApplicationComponent': Box,
    'ApplicationCollaboration': Box,
    'ApplicationInterface': Circle,
    'ApplicationFunction': Box,
    'ApplicationInteraction': GitMerge,
    'ApplicationProcess': Activity,
    'ApplicationEvent': Flag,
    'ApplicationService': Server,
    'DataObject': FileText,

    // Technology
    'Node': Server,
    'Device': HardDrive,
    'SystemSoftware': Cpu,
    'TechnologyCollaboration': Server,
    'TechnologyInterface': Circle,
    'Path': GitMerge,
    'CommunicationNetwork': GitMerge,
    'TechnologyFunction': Box,
    'TechnologyProcess': Activity,
    'TechnologyInteraction': GitMerge,
    'TechnologyEvent': Flag,
    'TechnologyService': Server,
    'Artifact': FileText,

    // Physical
    'Equipment': HardDrive,
    'Facility': Box,
    'DistributionNetwork': GitMerge,
    'Material': Box,

    // Motivation
    'Stakeholder': User,
    'Driver': Target,
    'Assessment': FileText,
    'Goal': Target,
    'Outcome': Award,
    'Principle': Shield,
    'Requirement': FileText,
    'Constraint': Shield,
    'Meaning': Book,
    'Value': Award,

    // Implementation
    'WorkPackage': Briefcase,
    'Deliverable': Box,
    'ImplementationEvent': Flag,
    'Plateau': Layers,
    'Gap': Circle,

    // Composite
    'Grouping': Folder,
    'Location': MapPin,
};

const layerColors: Record<string, string> = {
    'Strategy': 'bg-orange-100 border-orange-300 text-orange-900',
    'Business': 'bg-yellow-100 border-yellow-300 text-yellow-900',
    'Application': 'bg-cyan-100 border-cyan-300 text-cyan-900',
    'Technology': 'bg-green-100 border-green-300 text-green-900',
    'Physical': 'bg-emerald-100 border-emerald-300 text-emerald-900',
    'Motivation': 'bg-purple-100 border-purple-300 text-purple-900',
    'Implementation & Migration': 'bg-pink-100 border-pink-300 text-pink-900',
    'Composite': 'bg-gray-100 border-gray-300 text-gray-900',
};

export default function Stencil() {
    const [searchTerm, setSearchTerm] = useState('');

    const onDragStart = (event: React.DragEvent, nodeType: string, layer: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, layer }));
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredConcepts = ARCHIMATE_CONCEPTS.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <aside className="w-64 bg-background border-r border-border h-full flex flex-col">
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
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{layer} Layer</h3>
                            <div className="space-y-2">
                                {items.map((item) => {
                                    const Icon = icons[item.name] || Box;
                                    const colorClass = layerColors[layer] || 'bg-gray-100 border-gray-300';

                                    return (
                                        <div
                                            key={item.name}
                                            className={`flex items-center gap-3 p-3 rounded-md border cursor-grab hover:shadow-sm transition-all ${colorClass}`}
                                            onDragStart={(event) => onDragStart(event, item.name, layer)}
                                            draggable
                                        >
                                            <Icon className="w-4 h-4" />
                                            <span className="text-sm font-medium">{item.name}</span>
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
