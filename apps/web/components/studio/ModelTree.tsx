"use client";

import React, { useEffect, useState } from 'react';
import {
    ChevronRight, ChevronDown, Folder, FileText,
    Layout, Box, Search, MoreHorizontal
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useRouter, useSearchParams } from 'next/navigation';

interface ModelPackage {
    id: string;
    name: string;
    status: string;
}

interface Element {
    id: string;
    name: string;
    conceptType: {
        name: string;
        category: string; // Layer
    };
}

export default function ModelTree() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPackageId = searchParams.get('packageId');

    const [packages, setPackages] = useState<ModelPackage[]>([]);
    const [elements, setElements] = useState<Element[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'views': true,
        'repository': true,
    });
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        // Fetch Packages
        fetch('http://localhost:3002/model/packages', { headers })
            .then(res => res.json())
            .then(data => setPackages(data))
            .catch(console.error);

        // Fetch Elements
        fetch('http://localhost:3002/model/elements', { headers })
            .then(res => res.json())
            .then(data => setElements(data))
            .catch(console.error);
    }, []);

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    // Group elements by Layer
    const elementsByLayer = elements.reduce((acc, el) => {
        const layer = el.conceptType?.category || 'Uncategorized';
        if (!acc[layer]) acc[layer] = [];
        acc[layer].push(el);
        return acc;
    }, {} as Record<string, Element[]>);

    const filteredPackages = packages.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <aside className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold mb-2">Model Explorer</h2>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <ScrollArea className="flex-1 p-2">
                {/* Views Section */}
                <div className="mb-4">
                    <div
                        className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-md cursor-pointer font-medium text-sm"
                        onClick={() => toggleExpand('views')}
                    >
                        {expanded['views'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Folder className="h-4 w-4 text-blue-500" />
                        <span>Views</span>
                    </div>

                    {expanded['views'] && (
                        <div className="ml-6 space-y-1 mt-1">
                            {filteredPackages.map(pkg => (
                                <div
                                    key={pkg.id}
                                    className={`flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm ${currentPackageId === pkg.id ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100'}`}
                                    onClick={() => router.push(`/studio?packageId=${pkg.id}`)}
                                >
                                    <Layout className="h-3.5 w-3.5" />
                                    <span className="truncate">{pkg.name}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <Separator className="my-2" />

                {/* Repository Section */}
                <div>
                    <div
                        className="flex items-center gap-1 p-2 hover:bg-gray-100 rounded-md cursor-pointer font-medium text-sm"
                        onClick={() => toggleExpand('repository')}
                    >
                        {expanded['repository'] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        <Folder className="h-4 w-4 text-orange-500" />
                        <span>Repository</span>
                    </div>

                    {expanded['repository'] && (
                        <div className="ml-4 mt-1 space-y-2">
                            {Object.entries(elementsByLayer).sort().map(([layer, items]) => {
                                const layerKey = `layer-${layer}`;
                                const isLayerExpanded = expanded[layerKey];
                                const filteredItems = items.filter(i => i.name.toLowerCase().includes(searchTerm.toLowerCase()));

                                if (searchTerm && filteredItems.length === 0) return null;

                                return (
                                    <div key={layer}>
                                        <div
                                            className="flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded-md cursor-pointer text-xs font-semibold text-gray-500 uppercase tracking-wider"
                                            onClick={() => toggleExpand(layerKey)}
                                        >
                                            {isLayerExpanded ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
                                            {layer}
                                        </div>

                                        {isLayerExpanded && (
                                            <div className="ml-4 border-l border-gray-200 pl-2 space-y-1">
                                                {filteredItems.map(el => (
                                                    <div
                                                        key={el.id}
                                                        className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-grab text-sm group"
                                                        draggable
                                                        onDragStart={(e) => {
                                                            e.dataTransfer.setData('application/reactflow', JSON.stringify({
                                                                type: el.conceptType.name,
                                                                layer: el.conceptType.category,
                                                                label: el.name,
                                                                existingId: el.id // Pass ID to link to existing element
                                                            }));
                                                            e.dataTransfer.effectAllowed = 'copy';
                                                        }}
                                                    >
                                                        <Box className="h-3.5 w-3.5 text-gray-400" />
                                                        <span className="truncate">{el.name}</span>
                                                        <MoreHorizontal className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-100 text-gray-400" />
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </aside>
    );
}
