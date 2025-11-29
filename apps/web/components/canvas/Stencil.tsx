"use client";

import React, { useEffect, useState } from 'react';
import { User, Server, Database, Box, Layers } from 'lucide-react';

// Mock data until API is ready
const MOCK_CONCEPTS = [
    { name: "BusinessActor", category: "Business" },
    { name: "BusinessRole", category: "Business" },
    { name: "BusinessProcess", category: "Business" },
    { name: "ApplicationComponent", category: "Application" },
    { name: "ApplicationService", category: "Application" },
    { name: "Node", category: "Technology" },
    { name: "Device", category: "Technology" },
];

const icons: Record<string, any> = {
    'BusinessActor': User,
    'BusinessRole': User,
    'BusinessProcess': Box,
    'ApplicationComponent': Box,
    'ApplicationService': Server,
    'Node': Server,
    'Device': Database,
};

const layerColors: Record<string, string> = {
    'Business': 'bg-yellow-100 border-yellow-300 text-yellow-900',
    'Application': 'bg-cyan-100 border-cyan-300 text-cyan-900',
    'Technology': 'bg-green-100 border-green-300 text-green-900',
};

export default function Stencil() {
    const [concepts, setConcepts] = useState(MOCK_CONCEPTS);

    const onDragStart = (event: React.DragEvent, nodeType: string, layer: string) => {
        event.dataTransfer.setData('application/reactflow', JSON.stringify({ type: nodeType, layer }));
        event.dataTransfer.effectAllowed = 'move';
    };

    // Group by layer
    const groupedConcepts = concepts.reduce((acc, concept) => {
        if (!acc[concept.category]) acc[concept.category] = [];
        acc[concept.category]!.push(concept);
        return acc;
    }, {} as Record<string, typeof concepts>);

    return (
        <aside className="w-64 bg-white border-r border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Layers className="w-5 h-5" />
                    Palette
                </h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {Object.entries(groupedConcepts).map(([layer, items]) => (
                    <div key={layer}>
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">{layer} Layer</h3>
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
                ))}
            </div>
        </aside>
    );
}
