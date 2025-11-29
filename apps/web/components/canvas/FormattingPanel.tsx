"use client";

import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { Palette, Type, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface FormattingPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onUpdateNodes: (nodes: Node[]) => void;
    onUpdateEdges: (edges: Edge[]) => void;
    allNodes: Node[];
    allEdges: Edge[];
}

interface NodeStyle {
    backgroundColor?: string;
    borderColor?: string;
    borderWidth?: number;
    fontSize?: number;
    fontColor?: string;
    opacity?: number;
}

interface EdgeStyle {
    strokeColor?: string;
    strokeWidth?: number;
    strokeStyle?: 'solid' | 'dashed' | 'dotted';
    opacity?: number;
}

export default function FormattingPanel({
    selectedNodes,
    selectedEdges,
    onUpdateNodes,
    onUpdateEdges,
    allNodes,
    allEdges,
}: FormattingPanelProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Get current styles from first selected node/edge
    const currentNodeStyle: NodeStyle = selectedNodes[0]?.data?.style || {};
    const edgeStyle = selectedEdges[0]?.style || {};
    const currentEdgeStyle: EdgeStyle = {
        strokeColor: edgeStyle.stroke as string || '#000000',
        strokeWidth: edgeStyle.strokeWidth as number || 2,
        strokeStyle: edgeStyle.strokeDasharray 
            ? (edgeStyle.strokeDasharray === '5,5' ? 'dashed' : 'dotted')
            : 'solid',
        opacity: edgeStyle.opacity as number ?? 1,
    };

    const updateNodeStyle = (styleUpdates: Partial<NodeStyle>) => {
        const updatedNodes = allNodes.map(node => {
            if (selectedNodes.find(n => n.id === node.id)) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        style: {
                            ...(node.data?.style || {}),
                            ...styleUpdates,
                        },
                    },
                };
            }
            return node;
        });
        onUpdateNodes(updatedNodes);
    };

    const updateEdgeStyle = (styleUpdates: Partial<EdgeStyle>) => {
        const updatedEdges = allEdges.map(edge => {
            if (selectedEdges.find(e => e.id === edge.id)) {
                const currentStyle = edge.style || {};
                const newStyle: any = {
                    ...currentStyle,
                    stroke: styleUpdates.strokeColor !== undefined ? styleUpdates.strokeColor : currentStyle.stroke,
                    strokeWidth: styleUpdates.strokeWidth !== undefined ? styleUpdates.strokeWidth : currentStyle.strokeWidth,
                    opacity: styleUpdates.opacity !== undefined ? styleUpdates.opacity : currentStyle.opacity,
                };
                
                // Handle stroke style (dashed, dotted, solid)
                if (styleUpdates.strokeStyle !== undefined) {
                    if (styleUpdates.strokeStyle === 'dashed') {
                        newStyle.strokeDasharray = '5,5';
                    } else if (styleUpdates.strokeStyle === 'dotted') {
                        newStyle.strokeDasharray = '2,2';
                    } else {
                        newStyle.strokeDasharray = undefined;
                    }
                } else if (currentStyle.strokeDasharray) {
                    // Preserve existing dasharray if not updating
                    newStyle.strokeDasharray = currentStyle.strokeDasharray;
                }
                
                return {
                    ...edge,
                    style: newStyle,
                };
            }
            return edge;
        });
        onUpdateEdges(updatedEdges);
    };

    const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;

    if (!hasSelection) {
        return null;
    }

    return (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50">
            <div className="bg-background border border-border rounded-lg shadow-lg p-4 min-w-[400px]">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        Formatting
                    </h3>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <X className="h-4 w-4" /> : <Minus className="h-4 w-4" />}
                    </Button>
                </div>

                {isOpen && (
                    <div className="space-y-4">
                        {selectedNodes.length > 0 && (
                            <div className="space-y-3 border-b border-border pb-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                                    Nodes ({selectedNodes.length})
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="node-bg-color" className="text-xs">Background Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="node-bg-color"
                                                type="color"
                                                value={currentNodeStyle.backgroundColor || '#ffffff'}
                                                onChange={(e) => updateNodeStyle({ backgroundColor: e.target.value })}
                                                className="h-8 w-16 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={currentNodeStyle.backgroundColor || '#ffffff'}
                                                onChange={(e) => updateNodeStyle({ backgroundColor: e.target.value })}
                                                className="h-8 text-xs"
                                                placeholder="#ffffff"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="node-border-color" className="text-xs">Border Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="node-border-color"
                                                type="color"
                                                value={currentNodeStyle.borderColor || '#000000'}
                                                onChange={(e) => updateNodeStyle({ borderColor: e.target.value })}
                                                className="h-8 w-16 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={currentNodeStyle.borderColor || '#000000'}
                                                onChange={(e) => updateNodeStyle({ borderColor: e.target.value })}
                                                className="h-8 text-xs"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="node-font-color" className="text-xs">Text Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="node-font-color"
                                                type="color"
                                                value={currentNodeStyle.fontColor || '#000000'}
                                                onChange={(e) => updateNodeStyle({ fontColor: e.target.value })}
                                                className="h-8 w-16 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={currentNodeStyle.fontColor || '#000000'}
                                                onChange={(e) => updateNodeStyle({ fontColor: e.target.value })}
                                                className="h-8 text-xs"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="node-border-width" className="text-xs">Border Width</Label>
                                        <Input
                                            id="node-border-width"
                                            type="number"
                                            min="0"
                                            max="10"
                                            value={currentNodeStyle.borderWidth || 0}
                                            onChange={(e) => updateNodeStyle({ borderWidth: parseInt(e.target.value) || 0 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="node-font-size" className="text-xs">Font Size</Label>
                                        <Input
                                            id="node-font-size"
                                            type="number"
                                            min="8"
                                            max="24"
                                            value={currentNodeStyle.fontSize || 12}
                                            onChange={(e) => updateNodeStyle({ fontSize: parseInt(e.target.value) || 12 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="node-opacity" className="text-xs">Opacity</Label>
                                        <Input
                                            id="node-opacity"
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={currentNodeStyle.opacity ?? 1}
                                            onChange={(e) => updateNodeStyle({ opacity: parseFloat(e.target.value) || 1 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {selectedEdges.length > 0 && (
                            <div className="space-y-3">
                                <h4 className="text-xs font-semibold text-muted-foreground uppercase">
                                    Edges ({selectedEdges.length})
                                </h4>
                                
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <Label htmlFor="edge-stroke-color" className="text-xs">Stroke Color</Label>
                                        <div className="flex gap-2">
                                            <Input
                                                id="edge-stroke-color"
                                                type="color"
                                                value={currentEdgeStyle.strokeColor || '#000000'}
                                                onChange={(e) => updateEdgeStyle({ strokeColor: e.target.value })}
                                                className="h-8 w-16 p-1 cursor-pointer"
                                            />
                                            <Input
                                                type="text"
                                                value={currentEdgeStyle.strokeColor || '#000000'}
                                                onChange={(e) => updateEdgeStyle({ strokeColor: e.target.value })}
                                                className="h-8 text-xs"
                                                placeholder="#000000"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edge-stroke-width" className="text-xs">Stroke Width</Label>
                                        <Input
                                            id="edge-stroke-width"
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={currentEdgeStyle.strokeWidth || 2}
                                            onChange={(e) => updateEdgeStyle({ strokeWidth: parseInt(e.target.value) || 2 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edge-stroke-style" className="text-xs">Stroke Style</Label>
                                        <select
                                            id="edge-stroke-style"
                                            value={currentEdgeStyle.strokeStyle || 'solid'}
                                            onChange={(e) => updateEdgeStyle({ strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                                            className="h-8 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                                        >
                                            <option value="solid">Solid</option>
                                            <option value="dashed">Dashed</option>
                                            <option value="dotted">Dotted</option>
                                        </select>
                                    </div>

                                    <div className="space-y-1.5">
                                        <Label htmlFor="edge-opacity" className="text-xs">Opacity</Label>
                                        <Input
                                            id="edge-opacity"
                                            type="number"
                                            min="0"
                                            max="1"
                                            step="0.1"
                                            value={currentEdgeStyle.opacity ?? 1}
                                            onChange={(e) => updateEdgeStyle({ opacity: parseFloat(e.target.value) || 1 })}
                                            className="h-8 text-xs"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

