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
import { getValidRelations } from '@/lib/metamodel';
import DiagramDescriber from '../ai/DiagramDescriber';

const nodeTypes = {
    archimate: ArchiMateNode,
};

const initialNodes: Node[] = [];
let id = 0;
const getId = () => `dndnode_${id++}`;

export default function ModelingCanvas() {
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
        (event: React.DragEvent) => {
            event.preventDefault();

            if (!reactFlowWrapper.current || !reactFlowInstance) {
                return;
            }

            const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
            const dataStr = event.dataTransfer.getData('application/reactflow');

            if (!dataStr) return;

            const { type, layer, label, existingId } = JSON.parse(dataStr);

            // check if the dropped element is valid
            if (typeof type === 'undefined' || !type) {
                return;
            }

            const position = reactFlowInstance.screenToFlowPosition({
                x: event.clientX,
                y: event.clientY,
            });

            const newNode: Node = {
                id: getId(),
                type: 'archimate',
                position,
                data: {
                    label: label || `${type}`,
                    type,
                    layer,
                    elementId: existingId
                },
            };

            setNodes((nds) => nds.concat(newNode));
        },
        [reactFlowInstance, setNodes],
    );

    return (
        <div className="w-full h-full" ref={reactFlowWrapper}>
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onConnect={onConnect}
                onInit={setReactFlowInstance}
                onDrop={onDrop}
                onDragOver={onDragOver}
                nodeTypes={nodeTypes}
                fitView
            >
                <Controls />
                <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
                <div className="absolute top-4 right-4 z-10">
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
        </div>
    );
}
