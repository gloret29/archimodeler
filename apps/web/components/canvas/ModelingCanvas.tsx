"use client";

import React, { useState, useRef, useCallback } from 'react';
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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import ArchiMateNode from './nodes/ArchiMateNode';
import ConnectionMenu from './ConnectionMenu';
import NodeContextMenu from './NodeContextMenu';
import RenameDialog from '../ui/RenameDialog';
import { getValidRelations } from '@/lib/metamodel';
import DiagramDescriber from '../ai/DiagramDescriber';

const nodeTypes = {
    archimate: ArchiMateNode,
};

const initialNodes: Node[] = [];
let id = 0;
const getId = () => `dndnode_${id++}`;

interface ModelingCanvasProps {
    packageId?: string | null;
}

export default function ModelingCanvas({ packageId }: ModelingCanvasProps) {
    const reactFlowWrapper = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);

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
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3002/model/elements/${renameDialog.elementId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });

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
            alert('Failed to rename element');
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

        if (!confirm(confirmMsg)) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3002/model/elements/${elementId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            // Remove from current view
            setNodes((nds) => nds.filter((n) => n.id !== nodeContextMenu.nodeId));
        } catch (err) {
            console.error(err);
            alert('Failed to delete element');
        }
    };

    const onConnect = useCallback(
        (params: Connection) => {
            const sourceNode = nodes.find((n) => n.id === params.source);
            const targetNode = nodes.find((n) => n.id === params.target);

            if (sourceNode && targetNode) {
                const sourceType = sourceNode.data.type as string;
                const targetType = targetNode.data.type as string;

                const validRelations = getValidRelations(sourceType, targetType);

                if (validRelations.length === 0) {
                    alert('No valid relationship allowed between these elements.');
                    return;
                }

                if (validRelations.length === 1) {
                    const relation = validRelations[0];
                    setEdges((eds) => addEdge({ ...params, label: relation, type: 'default' } as Edge, eds));
                } else {
                    // Calculate position for the menu
                    // We'll place it near the target node
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
        [nodes, setEdges, reactFlowInstance],
    );

    const onRelationSelect = (relation: string) => {
        if (connectionMenu.params) {
            setEdges((eds) => addEdge({ ...connectionMenu.params!, label: relation, type: 'default' } as Edge, eds));
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

                    // First, ensure we have a valid package ID
                    const targetPackageId = packageId || 'default-package-id';

                    const res = await fetch('http://localhost:3002/model/elements', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            name: label || type,
                            type: type,
                            layer: layer,
                            packageId: targetPackageId
                        })
                    });

                    if (res.ok) {
                        const newElement = await res.json();
                        elementId = newElement.id;
                    } else {
                        const errorText = await res.text();
                        console.error('Failed to create element. Status:', res.status, 'Response:', errorText);
                        alert(`Failed to create element: ${res.status} - ${errorText.substring(0, 200)}`);
                    }
                } catch (err) {
                    console.error('Error creating element:', err);
                    alert('Error creating element: ' + (err as Error).message);
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
        [reactFlowInstance, setNodes],
    );

    const onSave = async () => {
        const name = prompt('View Name:');
        if (!name) return;

        const content = {
            nodes,
            edges,
        };

        try {
            const token = localStorage.getItem('accessToken');
            await fetch('http://localhost:3002/model/views', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    content,
                    modelPackage: { connect: { id: packageId || 'default-package-id' } }
                })
            });
            alert('View saved!');
        } catch (err) {
            console.error(err);
            alert('Failed to save view');
        }
    };

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
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <div className="absolute top-4 right-4 z-10 flex gap-2">
                    <button
                        onClick={onSave}
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-md text-sm font-medium shadow-sm hover:bg-blue-700"
                    >
                        Save View
                    </button>
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
        </div>
    );
}
