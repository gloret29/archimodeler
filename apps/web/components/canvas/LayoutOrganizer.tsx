"use client";

import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { Layout, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface LayoutOrganizerProps {
    nodes: Node[];
    edges: Edge[];
    onUpdateNodes: (nodes: Node[]) => void;
}

type LayoutType = 'circular' | 'hierarchical' | 'grid' | 'force-directed';

export default function LayoutOrganizer({
    nodes,
    edges,
    onUpdateNodes,
}: LayoutOrganizerProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    const applyLayout = (layoutType: LayoutType) => {
        if (nodes.length === 0) return;

        let newNodes: Node[] = [];

        switch (layoutType) {
            case 'circular':
                newNodes = applyCircularLayout(nodes);
                break;
            case 'hierarchical':
                newNodes = applyHierarchicalLayout(nodes, edges);
                break;
            case 'grid':
                newNodes = applyGridLayout(nodes);
                break;
            case 'force-directed':
                newNodes = applyForceDirectedLayout(nodes, edges);
                break;
        }

        onUpdateNodes(newNodes);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                >
                    <Layout className="h-4 w-4" />
                    Auto Layout
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-56" align="end">
                <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Layout Options
                    </div>
                    <button
                        onClick={() => applyLayout('circular')}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                    >
                        Circular
                    </button>
                    <button
                        onClick={() => applyLayout('hierarchical')}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                    >
                        Hierarchical
                    </button>
                    <button
                        onClick={() => applyLayout('grid')}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                    >
                        Grid
                    </button>
                    <button
                        onClick={() => applyLayout('force-directed')}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                    >
                        Force-Directed
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

// Circular Layout: Arrange nodes in a circle
function applyCircularLayout(nodes: Node[]): Node[] {
    const centerX = 400;
    const centerY = 400;
    const radius = Math.max(200, nodes.length * 30);
    const angleStep = (2 * Math.PI) / nodes.length;

    return nodes.map((node, index) => {
        const angle = index * angleStep;
        const x = centerX + radius * Math.cos(angle);
        const y = centerY + radius * Math.sin(angle);

        return {
            ...node,
            position: { x, y },
        };
    });
}

// Hierarchical Layout: Arrange nodes in layers based on their connections
function applyHierarchicalLayout(nodes: Node[], edges: Edge[]): Node[] {
    // Build adjacency lists
    const inDegree = new Map<string, number>();
    const children = new Map<string, string[]>();

    nodes.forEach(node => {
        inDegree.set(node.id, 0);
        children.set(node.id, []);
    });

    edges.forEach(edge => {
        const source = edge.source;
        const target = edge.target;
        
        inDegree.set(target, (inDegree.get(target) || 0) + 1);
        children.get(source)?.push(target);
    });

    // Find root nodes (nodes with no incoming edges)
    const roots = nodes.filter(node => (inDegree.get(node.id) || 0) === 0);

    // If no roots, use first node as root
    if (roots.length === 0 && nodes.length > 0) {
        roots.push(nodes[0]);
    }

    // Assign levels using BFS
    const level = new Map<string, number>();
    const queue: { node: Node; level: number }[] = roots.map(node => ({ node, level: 0 }));

    roots.forEach(node => level.set(node.id, 0));

    while (queue.length > 0) {
        const { node, level: currentLevel } = queue.shift()!;
        const nodeChildren = children.get(node.id) || [];

        nodeChildren.forEach(childId => {
            if (!level.has(childId)) {
                level.set(childId, currentLevel + 1);
                const childNode = nodes.find(n => n.id === childId);
                if (childNode) {
                    queue.push({ node: childNode, level: currentLevel + 1 });
                }
            }
        });
    }

    // Group nodes by level
    const nodesByLevel = new Map<number, Node[]>();
    nodes.forEach(node => {
        const nodeLevel = level.get(node.id) || 0;
        if (!nodesByLevel.has(nodeLevel)) {
            nodesByLevel.set(nodeLevel, []);
        }
        nodesByLevel.get(nodeLevel)!.push(node);
    });

    // Position nodes
    const nodeWidth = 180;
    const nodeHeight = 100;
    const horizontalSpacing = 250;
    const verticalSpacing = 200;
    const startX = 100;
    const startY = 100;

    const updatedNodes: Node[] = [];

    nodesByLevel.forEach((levelNodes, levelIndex) => {
        const levelWidth = levelNodes.length * horizontalSpacing;
        const startXLevel = startX + (Math.max(...Array.from(nodesByLevel.keys()).map(l => nodesByLevel.get(l)!.length)) * horizontalSpacing - levelWidth) / 2;

        levelNodes.forEach((node, index) => {
            const x = startXLevel + index * horizontalSpacing;
            const y = startY + levelIndex * verticalSpacing;

            updatedNodes.push({
                ...node,
                position: { x, y },
            });
        });
    });

    // Handle nodes that weren't assigned a level
    nodes.forEach(node => {
        if (!level.has(node.id)) {
            updatedNodes.push({
                ...node,
                position: { x: startX, y: startY + (nodesByLevel.size) * verticalSpacing },
            });
        }
    });

    return updatedNodes;
}

// Grid Layout: Arrange nodes in a grid
function applyGridLayout(nodes: Node[]): Node[] {
    const cols = Math.ceil(Math.sqrt(nodes.length));
    const nodeWidth = 180;
    const nodeHeight = 100;
    const horizontalSpacing = 250;
    const verticalSpacing = 200;
    const startX = 100;
    const startY = 100;

    return nodes.map((node, index) => {
        const row = Math.floor(index / cols);
        const col = index % cols;
        const x = startX + col * horizontalSpacing;
        const y = startY + row * verticalSpacing;

        return {
            ...node,
            position: { x, y },
        };
    });
}

// Force-Directed Layout: Simple spring-based layout
function applyForceDirectedLayout(nodes: Node[], edges: Edge[]): Node[] {
    const iterations = 100;
    const k = Math.sqrt((400 * 400) / nodes.length); // Optimal distance
    const repulsionStrength = k * k;
    const attractionStrength = 0.01;

    // Initialize positions randomly if not set
    let positions = new Map<string, { x: number; y: number }>();
    nodes.forEach(node => {
        positions.set(node.id, {
            x: node.position?.x || Math.random() * 800,
            y: node.position?.y || Math.random() * 600,
        });
    });

    // Build adjacency list
    const neighbors = new Map<string, string[]>();
    nodes.forEach(node => neighbors.set(node.id, []));
    edges.forEach(edge => {
        neighbors.get(edge.source)?.push(edge.target);
        neighbors.get(edge.target)?.push(edge.source);
    });

    // Run force-directed iterations
    for (let iter = 0; iter < iterations; iter++) {
        const forces = new Map<string, { x: number; y: number }>();
        nodes.forEach(node => forces.set(node.id, { x: 0, y: 0 }));

        // Repulsion forces between all pairs
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const node1 = nodes[i];
                const node2 = nodes[j];
                const pos1 = positions.get(node1.id)!;
                const pos2 = positions.get(node2.id)!;

                const dx = pos1.x - pos2.x;
                const dy = pos1.y - pos2.y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;

                const force = repulsionStrength / (distance * distance);
                const fx = (dx / distance) * force;
                const fy = (dy / distance) * force;

                forces.get(node1.id)!.x += fx;
                forces.get(node1.id)!.y += fy;
                forces.get(node2.id)!.x -= fx;
                forces.get(node2.id)!.y -= fy;
            }
        }

        // Attraction forces between connected nodes
        edges.forEach(edge => {
            const pos1 = positions.get(edge.source)!;
            const pos2 = positions.get(edge.target)!;

            const dx = pos2.x - pos1.x;
            const dy = pos2.y - pos1.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            const force = attractionStrength * (distance - k);
            const fx = (dx / distance) * force;
            const fy = (dy / distance) * force;

            forces.get(edge.source)!.x += fx;
            forces.get(edge.source)!.y += fy;
            forces.get(edge.target)!.x -= fx;
            forces.get(edge.target)!.y -= fy;
        });

        // Update positions with cooling factor
        const cooling = 0.95;
        const maxMovement = 10;
        nodes.forEach(node => {
            const force = forces.get(node.id)!;
            const magnitude = Math.sqrt(force.x * force.x + force.y * force.y);
            const limitedMagnitude = Math.min(magnitude, maxMovement);
            const scale = magnitude > 0 ? limitedMagnitude / magnitude : 0;

            const pos = positions.get(node.id)!;
            pos.x += force.x * scale * cooling;
            pos.y += force.y * scale * cooling;
        });
    }

    // Return updated nodes
    return nodes.map(node => {
        const pos = positions.get(node.id)!;
        return {
            ...node,
            position: { x: pos.x, y: pos.y },
        };
    });
}

