"use client";

import React from 'react';
import { Node, Edge } from '@xyflow/react';
import { Type, Minus, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useTranslations } from 'next-intl';

interface FormattingPanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onUpdateNodes: (nodes: Node[]) => void;
    onUpdateEdges: (edges: Edge[]) => void;
    allNodes: Node[];
    allEdges: Edge[];
    onMaintainSelection?: () => void;
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
    onMaintainSelection,
}: FormattingPanelProps) {
    const t = useTranslations('Canvas');
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

    const hasNodesSelection = selectedNodes.length > 0;
    const hasEdgesSelection = selectedEdges.length > 0;
    const hasSelection = hasNodesSelection || hasEdgesSelection;

    // Store selection to restore it if lost
    const selectionRef = React.useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
    const isInteractingRef = React.useRef(false);
    
    React.useEffect(() => {
        selectionRef.current = { nodes: selectedNodes, edges: selectedEdges };
    }, [selectedNodes, selectedEdges]);

    // Monitor selection and restore if lost during toolbar interaction
    React.useEffect(() => {
        if (isInteractingRef.current && (selectedNodes.length === 0 && selectedEdges.length === 0) && 
            (selectionRef.current.nodes.length > 0 || selectionRef.current.edges.length > 0)) {
            // Selection was lost during toolbar interaction, restore it
            if (onMaintainSelection) {
                setTimeout(() => {
                    onMaintainSelection();
                    isInteractingRef.current = false;
                }, 10);
            }
        }
    }, [selectedNodes, selectedEdges, onMaintainSelection]);

    // Prevent clicks from propagating to React Flow (which would deselect)
    const handleToolbarInteraction = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        // Mark that we're interacting with toolbar
        isInteractingRef.current = true;
        // Maintain selection when interacting with toolbar
        if (onMaintainSelection && (selectionRef.current.nodes.length > 0 || selectionRef.current.edges.length > 0)) {
            // Use setTimeout to restore selection after React Flow processes the click
            setTimeout(() => {
                onMaintainSelection();
            }, 10);
        }
    };

    return (
        <div 
            className="border-b border-border bg-background px-3 py-1.5 flex items-center gap-1 relative z-50"
            onMouseDown={handleToolbarInteraction}
            onClick={handleToolbarInteraction}
            onContextMenu={(e) => e.preventDefault()}
            style={{ pointerEvents: 'auto' }}
        >
            {/* Font/Text Group - Only for Nodes */}
            <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={!hasNodesSelection}
                    title={t('fontSize')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Type className="h-4 w-4 mr-1" />
                    <Input
                        type="number"
                        min="8"
                        max="24"
                        value={currentNodeStyle.fontSize || 12}
                        onChange={(e) => updateNodeStyle({ fontSize: parseInt(e.target.value) || 12 })}
                        className="h-5 w-10 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                        disabled={!hasNodesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>
            </div>

            {/* Colors Group */}
            <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1.5">
                {/* Text Color - Only for Nodes */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 relative"
                    disabled={!hasNodesSelection}
                    title={t('textColor')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasNodesSelection) {
                            document.getElementById('node-font-color-picker')?.click();
                        }
                    }}
                >
                    <Type className="h-4 w-4" />
                    <div
                        className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-3 h-0.5"
                        style={{ backgroundColor: currentNodeStyle.fontColor || '#000000' }}
                    />
                    <Input
                        id="node-font-color-picker"
                        type="color"
                        value={currentNodeStyle.fontColor || '#000000'}
                        onChange={(e) => updateNodeStyle({ fontColor: e.target.value })}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        disabled={!hasNodesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>

                {/* Background Color - Only for Nodes */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 relative"
                    disabled={!hasNodesSelection}
                    title={t('backgroundColor')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasNodesSelection) {
                            document.getElementById('node-bg-color-picker')?.click();
                        }
                    }}
                >
                    <div
                        className="w-4 h-4 border border-border rounded"
                        style={{ backgroundColor: currentNodeStyle.backgroundColor || '#ffffff' }}
                    />
                    <Input
                        id="node-bg-color-picker"
                        type="color"
                        value={currentNodeStyle.backgroundColor || '#ffffff'}
                        onChange={(e) => updateNodeStyle({ backgroundColor: e.target.value })}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        disabled={!hasNodesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>

                {/* Border Color - Only for Nodes */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 relative"
                    disabled={!hasNodesSelection}
                    title={t('borderColor')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasNodesSelection) {
                            document.getElementById('node-border-color-picker')?.click();
                        }
                    }}
                >
                    <div
                        className="w-4 h-4 border-2 rounded"
                        style={{ borderColor: currentNodeStyle.borderColor || '#000000' }}
                    />
                    <Input
                        id="node-border-color-picker"
                        type="color"
                        value={currentNodeStyle.borderColor || '#000000'}
                        onChange={(e) => updateNodeStyle({ borderColor: e.target.value })}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        disabled={!hasNodesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>

                {/* Stroke Color - Only for Edges */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 relative"
                    disabled={!hasEdgesSelection}
                    title={t('strokeColor')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (hasEdgesSelection) {
                            document.getElementById('edge-stroke-color-picker')?.click();
                        }
                    }}
                >
                    <Minus className="h-4 w-4" />
                    <div
                        className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-3 h-0.5"
                        style={{ backgroundColor: currentEdgeStyle.strokeColor || '#000000' }}
                    />
                    <Input
                        id="edge-stroke-color-picker"
                        type="color"
                        value={currentEdgeStyle.strokeColor || '#000000'}
                        onChange={(e) => updateEdgeStyle({ strokeColor: e.target.value })}
                        className="absolute opacity-0 w-0 h-0 pointer-events-none"
                        disabled={!hasEdgesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>
            </div>

            {/* Border/Stroke Style Group */}
            <div className="flex items-center gap-0.5 border-r border-border pr-1.5 mr-1.5">
                {/* Border Width - Only for Nodes */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={!hasNodesSelection}
                    title={t('borderWidth')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Input
                        type="number"
                        min="0"
                        max="10"
                        value={currentNodeStyle.borderWidth || 0}
                        onChange={(e) => updateNodeStyle({ borderWidth: parseInt(e.target.value) || 0 })}
                        className="h-5 w-10 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                        disabled={!hasNodesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                        placeholder={t('zero')}
                    />
                    <span className="text-xs ml-1">px</span>
                </Button>

                {/* Stroke Width - Only for Edges */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={!hasEdgesSelection}
                    title={t('strokeWidth')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Minus className="h-3 w-3 mr-1" />
                    <Input
                        type="number"
                        min="1"
                        max="10"
                        value={currentEdgeStyle.strokeWidth || 2}
                        onChange={(e) => updateEdgeStyle({ strokeWidth: parseInt(e.target.value) || 2 })}
                        className="h-5 w-10 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                        disabled={!hasEdgesSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>

                {/* Stroke Style - Only for Edges */}
                <select
                    value={currentEdgeStyle.strokeStyle || 'solid'}
                    onChange={(e) => updateEdgeStyle({ strokeStyle: e.target.value as 'solid' | 'dashed' | 'dotted' })}
                    className="h-7 px-2 text-xs rounded-md border border-input bg-background disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={!hasEdgesSelection}
                    title={t('strokeStyle')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <option value="solid">{t('solid')}</option>
                    <option value="dashed">{t('dashed')}</option>
                    <option value="dotted">{t('dotted')}</option>
                </select>
            </div>

            {/* Opacity Group */}
            <div className="flex items-center gap-0.5">
                <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2"
                    disabled={!hasSelection}
                    title={t('opacity')}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <Circle className="h-3 w-3 mr-1" />
                    <Input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={hasNodesSelection ? (currentNodeStyle.opacity ?? 1) : (currentEdgeStyle.opacity ?? 1)}
                        onChange={(e) => {
                            const value = parseFloat(e.target.value) || 1;
                            if (hasNodesSelection) {
                                updateNodeStyle({ opacity: value });
                            }
                            if (hasEdgesSelection) {
                                updateEdgeStyle({ opacity: value });
                            }
                        }}
                        className="h-5 w-10 text-xs border-0 bg-transparent p-0 focus-visible:ring-0"
                        disabled={!hasSelection}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    />
                </Button>
            </div>
        </div>
    );
}
