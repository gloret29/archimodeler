"use client";

import React, { useState, useRef, useCallback, Dispatch, SetStateAction, useEffect } from 'react';
import {
    ReactFlow,
    ReactFlowProvider,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Edge,
    Node,
    BackgroundVariant,
    OnNodesChange,
    OnEdgesChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ArchiMateNode from './nodes/ArchiMateNode';
import ConnectionMenu from './ConnectionMenu';
import NodeContextMenu from './NodeContextMenu';
import RenameDialog from '../ui/RenameDialog';
import FormattingPanel from './FormattingPanel';
import StereotypePanel from './StereotypePanel';
import LayoutOrganizer from './LayoutOrganizer';
import ExportButton from './ExportButton';
import { getValidRelations } from '@/lib/metamodel';
import DiagramDescriber from '../ai/DiagramDescriber';
import { useDialog } from '@/contexts/DialogContext';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';

const nodeTypes = {
    archimate: ArchiMateNode,
};

const initialNodes: Node[] = [];
let id = 0;
const getId = () => `dndnode_${id++}`;

export interface ModelingCanvasProps {
    packageId?: string | null;
    viewName?: string;
    // Controlled state props
    nodes?: Node[];
    edges?: Edge[];
    onNodesChange?: OnNodesChange;
    onEdgesChange?: OnEdgesChange;
    setNodes?: Dispatch<SetStateAction<Node[]>>;
    setEdges?: Dispatch<SetStateAction<Edge[]>>;
    onNodeClick?: (nodeId: string, elementId: string | undefined, elementName: string, elementType: string) => void;
    onEdgeClick?: (edgeId: string, relationshipId: string | undefined, relationshipName: string, relationshipType: string) => void;
    onReactFlowInit?: (instance: any) => void;
    onSelectionChange?: (selectedNodes: Node[], selectedEdges: Edge[]) => void;
    onRestoreSelection?: (restoreFn: () => void) => void;
}

export default function ModelingCanvas({
    packageId,
    viewName,
    nodes: controlledNodes,
    edges: controlledEdges,
    onNodesChange: controlledOnNodesChange,
    onEdgesChange: controlledOnEdgesChange,
    setNodes: controlledSetNodes,
    setEdges: controlledSetEdges,
    onNodeClick,
    onEdgeClick,
    onReactFlowInit,
    onSelectionChange,
    onRestoreSelection,
}: ModelingCanvasProps) {
    const { alert, confirm, prompt: promptDialog } = useDialog();
    const t = useTranslations('Canvas');
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    
    // Internal state (used if not controlled)
    const [internalNodes, setInternalNodes, onInternalNodesChange] = useNodesState(initialNodes);
    const [internalEdges, setInternalEdges, onInternalEdgesChange] = useEdgesState<Edge>([]);

    // Determine whether to use controlled or internal state
    const isControlled = controlledNodes !== undefined && controlledEdges !== undefined;
    
    const nodes = isControlled ? controlledNodes : internalNodes;
    const edges = isControlled ? controlledEdges : internalEdges;
    const onNodesChange = isControlled ? controlledOnNodesChange : onInternalNodesChange;
    const onEdgesChange = isControlled ? controlledOnEdgesChange : onInternalEdgesChange;
    
    // For setNodes/setEdges, we need to handle both cases carefully
    // Since useNodesState returns a setter that accepts functional updates, we need to match that if possible
    // However, passing setters directly is tricky with hooks.
    // Let's define helper setters.
    const setNodes = useCallback((action: SetStateAction<Node[]>) => {
        if (isControlled && controlledSetNodes) {
            controlledSetNodes(action);
        } else {
            setInternalNodes(action);
        }
    }, [isControlled, controlledSetNodes, setInternalNodes]);

    const setEdges = useCallback((action: SetStateAction<Edge[]>) => {
        if (isControlled && controlledSetEdges) {
            controlledSetEdges(action);
        } else {
            setInternalEdges(action);
        }
    }, [isControlled, controlledSetEdges, setInternalEdges]);

    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const [selectedNodes, setSelectedNodes] = useState<Node[]>([]);
    const [selectedEdges, setSelectedEdges] = useState<Edge[]>([]);
    const lastSelectedNodeRef = useRef<string | null>(null);
    const lastSelectedEdgeRef = useRef<string | null>(null);
    const onNodeClickRef = useRef(onNodeClick);
    const onEdgeClickRef = useRef(onEdgeClick);
    const preservedSelectionRef = useRef<{ nodes: Node[]; edges: Edge[] }>({ nodes: [], edges: [] });
    
    // Update refs when callbacks change
    useEffect(() => {
        onNodeClickRef.current = onNodeClick;
        onEdgeClickRef.current = onEdgeClick;
    }, [onNodeClick, onEdgeClick]);

    // Function to restore selection
    const restoreSelection = useCallback(() => {
        if (reactFlowInstance && preservedSelectionRef.current.nodes.length > 0) {
            const nodeIds = preservedSelectionRef.current.nodes.map(n => n.id);
            const currentNodes = isControlled ? controlledNodes : internalNodes;
            const updatedNodes = currentNodes.map((n) => ({
                ...n,
                selected: nodeIds.includes(n.id),
            }));
            setNodes(updatedNodes);
        }
        if (reactFlowInstance && preservedSelectionRef.current.edges.length > 0) {
            const edgeIds = preservedSelectionRef.current.edges.map(e => e.id);
            const currentEdges = isControlled ? controlledEdges : internalEdges;
            const updatedEdges = currentEdges.map((e) => ({
                ...e,
                selected: edgeIds.includes(e.id),
            }));
            setEdges(updatedEdges);
        }
    }, [reactFlowInstance, isControlled, controlledNodes, internalNodes, controlledEdges, internalEdges, setNodes, setEdges]);

    // Expose restore function to parent
    useEffect(() => {
        if (onRestoreSelection) {
            onRestoreSelection(restoreSelection);
        }
    }, [onRestoreSelection, restoreSelection]);

    const [connectionMenu, setConnectionMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        params: Connection | null;
        relations: string[];
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        params: null,
        relations: [],
    });

    const [nodeContextMenu, setNodeContextMenu] = useState<{
        isOpen: boolean;
        position: { x: number; y: number };
        nodeId: string | null;
        nodeData: any;
    }>({
        isOpen: false,
        position: { x: 0, y: 0 },
        nodeId: null,
        nodeData: null,
    });

    const [renameDialog, setRenameDialog] = useState<{
        isOpen: boolean;
        nodeId: string | null;
        currentName: string;
        elementId: string | null;
    }>({
        isOpen: false,
        nodeId: null,
        currentName: '',
        elementId: null,
    });

    const onNodeContextMenu = useCallback((event: React.MouseEvent, node: Node) => {
        event.preventDefault();
        setNodeContextMenu({
            isOpen: true,
            position: { x: event.clientX, y: event.clientY },
            nodeId: node.id,
            nodeData: node.data,
        });
    }, []);


    const onNodeDoubleClick = useCallback((event: React.MouseEvent, node: Node) => {
        const elementId = node.data?.elementId;
        if (!elementId || typeof elementId !== 'string') return;

        setRenameDialog({
            isOpen: true,
            nodeId: node.id,
            currentName: String(node.data?.label || ''),
            elementId: elementId,
        });
    }, []);

    const handleNodeClick = useCallback((event: React.MouseEvent, node: Node) => {
        if (onNodeClick) {
            const elementId = node.data?.elementId;
            const elementName = (node.data?.label as string) || node.id;
            const elementType = (node.data?.type as string) || 'Unknown';
            onNodeClick(node.id, elementId as string | undefined, elementName, elementType);
        }
    }, [onNodeClick]);

    const handleEdgeClick = useCallback((event: React.MouseEvent, edge: Edge) => {
        if (onEdgeClick) {
            const relationshipId = edge.data?.relationshipId;
            const relationshipName = (edge.label as string) || (edge.data?.name as string) || edge.id;
            const relationshipType = (edge.data?.type as string) || (edge.label as string) || 'Unknown';
            onEdgeClick(edge.id, relationshipId as string | undefined, relationshipName, relationshipType);
        }
    }, [onEdgeClick]);

    const handleRenameNode = async () => {
        const elementId = nodeContextMenu.nodeData?.elementId;
        if (!nodeContextMenu.nodeId || !elementId || typeof elementId !== 'string') return;

        setRenameDialog({
            isOpen: true,
            nodeId: nodeContextMenu.nodeId,
            currentName: String(nodeContextMenu.nodeData?.label || ''),
            elementId: elementId,
        });
    };

    const handleRenameConfirm = async (newName: string) => {
        if (!renameDialog.elementId || !renameDialog.nodeId) return;

        try {
            await api.put(`/model/elements/${renameDialog.elementId}`, { name: newName });

            // Update node label locally
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === renameDialog.nodeId
                        ? { ...n, data: { ...n.data, label: newName } }
                        : n
                )
            );
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToRenameElement'),
                type: 'error',
            });
        } finally {
            setRenameDialog({ isOpen: false, nodeId: null, currentName: '', elementId: null });
        }
    };

    const handleRemoveFromView = () => {
        if (!nodeContextMenu.nodeId) return;
        setNodes((nds) => nds.filter((n) => n.id !== nodeContextMenu.nodeId));
    };

    const handleDeleteFromRepository = async () => {
        const elementId = nodeContextMenu.nodeData?.elementId;
        if (!nodeContextMenu.nodeId || !elementId || typeof elementId !== 'string') return;

        // TODO: Fetch views using this element
        const confirmMsg = `Delete "${nodeContextMenu.nodeData?.label || 'element'}" from repository?\n\nThis will remove it from all views. This action cannot be undone.`;

        const confirmed = await confirm({
            title: t('delete') || 'Delete',
            description: confirmMsg,
            variant: 'destructive',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/model/elements/${elementId}`);

            // Remove from current view
            setNodes((nds) => nds.filter((n) => n.id !== nodeContextMenu.nodeId));
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToDeleteElement'),
                type: 'error',
            });
        }
    };

    const isValidConnection = useCallback((connection: Connection | Edge) => {
        let sourceId: string;
        let targetId: string;
        
        if ('source' in connection && 'target' in connection) {
            // It's a Connection or Edge - both have source and target
            sourceId = connection.source;
            targetId = connection.target;
        } else {
            return false;
        }
        
        const sourceNode = nodes.find((n) => n.id === sourceId);
        const targetNode = nodes.find((n) => n.id === targetId);
        if (!sourceNode || !targetNode) return false;

        const sourceType = sourceNode.data.type as string;
        const targetType = targetNode.data.type as string;
        
        const valid = getValidRelations(sourceType, targetType);
        return valid.length > 0;
    }, [nodes]);

    const onConnect = useCallback(
        async (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const targetNode = nodes.find((n) => n.id === params.target);

            if (sourceNode && targetNode) {
                const sourceType = sourceNode.data.type as string;
                const targetType = targetNode.data.type as string;

                const validRelations = getValidRelations(sourceType, targetType);

                if (validRelations.length === 0) {
                    await alert({
                        title: t('error') || 'Error',
                        message: t('noValidRelationship'),
                        type: 'warning',
                    });
                    return;
                }

                // Prevent duplicates for single relation case
                if (validRelations.length === 1) {
                    const relation = validRelations[0];
                    
                    const duplicate = edges.find(
                        (e) => e.source === params.source && e.target === params.target && e.label === relation
                    );
                    
                    if (duplicate) {
                        await alert({
                            title: t('warning') || 'Warning',
                            message: t('relationshipExists'),
                            type: 'warning',
                        });
                        return;
                    }

                    setEdges((eds) => addEdge({ ...params, label: relation, type: 'default' } as Edge, eds));
                } else {
                    // Calculate position for the menu
                    const position = reactFlowInstance.flowToScreenPosition({
                        x: targetNode.position.x + (targetNode.measured?.width ?? 150) / 2,
                        y: targetNode.position.y + (targetNode.measured?.height ?? 50) / 2,
                    });

                    setConnectionMenu({
                        isOpen: true,
                        position,
                        params,
                        relations: validRelations,
                    });
                }
            }
        },
        [nodes, edges, setEdges, reactFlowInstance, alert, t],
    );

    const onRelationSelect = async (relation: string) => {
        if (connectionMenu.params) {
            // Check for duplicates in menu selection
            const duplicate = edges.find(
                (e) => e.source === connectionMenu.params!.source && 
                       e.target === connectionMenu.params!.target && 
                       e.label === relation
            );
            
            if (duplicate) {
                await alert({
                    title: t('warning') || 'Warning',
                    message: t('relationshipExists'),
                    type: 'warning',
                });
            } else {
                setEdges((eds) => addEdge({ ...connectionMenu.params!, label: relation, type: 'default' } as Edge, eds));
            }
        }
        setConnectionMenu((prev) => ({ ...prev, isOpen: false }));
    };

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        async (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) {
                return;
            }

            const dataStr = event.dataTransfer.getData('application/reactflow');
            if (!dataStr) return;

            const { type, layer, label, existingId } = JSON.parse(dataStr);

            if (!type) return;

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            let elementId = existingId;

            // If it's a new element (from Stencil), create it in the backend
            if (!elementId) {
                try {
                    const token = localStorage.getItem('accessToken');

                    // Ensure we have a valid package ID
                    if (!packageId) {
                        await alert({
                            title: t('error') || 'Error',
                            message: t('noPackageSelected'),
                            type: 'error',
                        });
                        return;
                    }

                    const newElement = await api.post('/model/elements', {
                        name: label || type,
                        type: type,
                        layer: layer,
                        packageId: packageId
                    });
                    elementId = (newElement as { id: string }).id;
                } catch (err) {
                    console.error('Error creating element:', err);
                    await alert({
                        title: t('error') || 'Error',
                        message: t('errorCreatingElement', { error: (err as Error).message }),
                        type: 'error',
                    });
                }
            }

            const newNode: Node = {
                id: getId(),
                type: 'archimate',
                position,
                data: {
                    label: label || `${type}`,
                    type,
                    layer,
                    elementId: elementId // Store the real backend ID
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes, packageId],
    );

    const onSave = async () => {
        const name = await promptDialog({
            title: t('newView') || 'New View',
            label: 'View Name',
            placeholder: 'View Name',
            required: true,
        });
        if (!name) return;

        const content = {
            nodes,
            edges,
        };

        try {
            await api.post('/model/views', {
                name,
                content,
                modelPackage: { connect: { id: packageId } }
            });
            await alert({
                title: t('success') || 'Success',
                message: t('viewSaved'),
                type: 'success',
            });
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToSaveView'),
                type: 'error',
            });
        }
    };

    const handleSelectionChange = useCallback(({ nodes: selectedNodes, edges: selectedEdges }: { nodes: Node[]; edges: Edge[] }) => {
        // Preserve selection for restoration
        preservedSelectionRef.current = { nodes: selectedNodes, edges: selectedEdges };
        
        // Only update state if selection actually changed
        setSelectedNodes((prev) => {
            if (prev.length === selectedNodes.length && 
                prev.every((n, i) => n.id === selectedNodes[i]?.id)) {
                return prev; // No change
            }
            return selectedNodes;
        });
        setSelectedEdges((prev) => {
            if (prev.length === selectedEdges.length && 
                prev.every((e, i) => e.id === selectedEdges[i]?.id)) {
                return prev; // No change
            }
            return selectedEdges;
        });
        
        // If an edge is selected, trigger onEdgeClick (only if different from last selection)
        if (selectedEdges.length > 0 && selectedNodes.length === 0) { 
            const edge = selectedEdges[0];
            if (edge && lastSelectedEdgeRef.current !== edge.id && onEdgeClickRef.current) {
                lastSelectedEdgeRef.current = edge.id;
                lastSelectedNodeRef.current = null;
                const relationshipId = edge.data?.relationshipId;
                const relationshipName = (edge.label as string) || (edge.data?.name as string) || edge.id;
                const relationshipType = (edge.data?.type as string) || (edge.label as string) || 'Unknown';
                onEdgeClickRef.current(edge.id, relationshipId as string | undefined, relationshipName, relationshipType);
            }
        }
        // If a node is selected, trigger onNodeClick (only if different from last selection)
        else if (selectedNodes.length > 0 && selectedEdges.length === 0) {
            const node = selectedNodes[0];
            if (node && lastSelectedNodeRef.current !== node.id && onNodeClickRef.current) {
                lastSelectedNodeRef.current = node.id;
                lastSelectedEdgeRef.current = null;
                const elementId = node.data?.elementId;
                const elementName = (node.data?.label as string) || node.id;
                const elementType = (node.data?.type as string) || 'Unknown';
                onNodeClickRef.current(node.id, elementId as string | undefined, elementName, elementType);
            }
        }
        // If nothing is selected, reset refs
        else if (selectedNodes.length === 0 && selectedEdges.length === 0) {
            lastSelectedNodeRef.current = null;
            lastSelectedEdgeRef.current = null;
        }
        
        // Notify parent of selection change
        if (onSelectionChange) {
            onSelectionChange(selectedNodes, selectedEdges);
        }
    }, [onSelectionChange]); // Include onSelectionChange in dependencies

    return (
        <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onNodeContextMenu={onNodeContextMenu}
                onNodeDoubleClick={onNodeDoubleClick}
                onNodeClick={handleNodeClick}
                onEdgeClick={handleEdgeClick}
                onPaneClick={() => {
                    // Deselect element/relationship when clicking on empty canvas
                    if (onNodeClick) {
                        onNodeClick('', undefined, '', '');
                    }
                    if (onEdgeClick) {
                        onEdgeClick('', undefined, '', '');
                    }
                }}
                onInit={(instance) => {
                    setReactFlowInstance(instance);
                    if (onReactFlowInit) {
                        onReactFlowInit(instance);
                    }
                }}
                onDrop={onDrop}
                onDragOver={onDragOver}
                isValidConnection={isValidConnection}
                nodeTypes={nodeTypes}
                onSelectionChange={handleSelectionChange}
                fitView
            >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <ExportButton
                        reactFlowInstance={reactFlowInstance}
                        viewName={viewName}
                        reactFlowWrapper={reactFlowWrapper}
                    />
                    <LayoutOrganizer
                        nodes={nodes}
                        edges={edges}
                        onUpdateNodes={setNodes}
                    />
                    <DiagramDescriber nodes={nodes} edges={edges} />
                </div>
            </ReactFlow>
            {connectionMenu.isOpen && (
                <ConnectionMenu
                    position={connectionMenu.position}
                    relations={connectionMenu.relations as any}
                    onSelect={onRelationSelect}
                    onClose={() => setConnectionMenu((prev) => ({ ...prev, isOpen: false }))}
                />
            )}
            {nodeContextMenu.isOpen && (
                <NodeContextMenu
                    position={nodeContextMenu.position}
                    nodeData={nodeContextMenu.nodeData}
                    onRename={handleRenameNode}
                    onRemoveFromView={handleRemoveFromView}
                    onDeleteFromRepository={handleDeleteFromRepository}
                    onClose={() => setNodeContextMenu((prev) => ({ ...prev, isOpen: false }))}
                />
            )}
            {renameDialog.isOpen && (
                <RenameDialog
                    isOpen={renameDialog.isOpen}
                    currentName={renameDialog.currentName}
                    onConfirm={handleRenameConfirm}
                    onCancel={() => setRenameDialog({ isOpen: false, nodeId: null, currentName: '', elementId: null })}
                />
            )}
            <StereotypePanel
                selectedNodes={selectedNodes}
                selectedEdges={selectedEdges}
                onUpdate={() => {
                    // Trigger a refresh if needed
                }}
            />
        </div>
    );
}