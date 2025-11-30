"use client";

import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, Node, Edge, NodeChange, EdgeChange, useReactFlow } from '@xyflow/react';
import ModelingCanvas from '@/components/canvas/ModelingCanvas';
import { useCollaboration, User } from '@/hooks/useCollaboration';
import CollaborativeCursors from '@/components/collaboration/CollaborativeCursors';
import { api } from '@/lib/api/client';

interface CollaborativeCanvasProps {
    viewId: string;
    viewName: string;
    packageId: string | null;
    currentUser?: User | null;
    onContentChange?: (content: { nodes: Node[]; edges: Edge[] }) => void;
    onNodeClick?: (nodeId: string, elementId: string | undefined, elementName: string, elementType: string) => void;
    onEdgeClick?: (edgeId: string, relationshipId: string | undefined, relationshipName: string, relationshipType: string) => void;
    onViewSaved?: (savedBy: { id: string; name: string }) => void;
    onSelectionChange?: (selectedNodes: Node[], selectedEdges: Edge[]) => void;
    onSetNodesAndEdges?: (setNodes: (nodes: Node[]) => void, setEdges: (edges: Edge[]) => void) => void;
    onRestoreSelection?: (restoreFn: () => void) => void;
}

// Generate a random color for the user
function generateUserColor(): string {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
        '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
        '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
    ];
    return colors[Math.floor(Math.random() * colors.length)] || '#4ECDC4';
}

export default function CollaborativeCanvas({
    viewId,
    viewName,
    packageId,
    currentUser: propCurrentUser,
    onContentChange,
    onNodeClick,
    onEdgeClick,
    onViewSaved,
    onSelectionChange,
    onSetNodesAndEdges,
    onRestoreSelection
}: CollaborativeCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState<Node>([]);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState<Edge>([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Use provided user or create a fallback (should not happen in production)
    const currentUser = useMemo<User | null>(() => {
        if (propCurrentUser && propCurrentUser.id && propCurrentUser.name) {
            // Generate color based on user ID for consistency
            const colors = [
                '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A',
                '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2',
                '#F8B739', '#52B788', '#E76F51', '#2A9D8F'
            ];
            const colorIndex = parseInt(propCurrentUser.id.slice(-1), 16) % colors.length;
            return {
                id: propCurrentUser.id,
                name: propCurrentUser.name,
                color: propCurrentUser.color ?? colors[colorIndex] ?? '#4ECDC4',
            };
        }
        return null;
    }, [propCurrentUser]);

    // Fetch initial view data
    useEffect(() => {
        if (!viewId) return;

        setIsLoaded(false); // Reset loaded state on view change

        const fetchView = async () => {
            try {
                const viewData = await api.get<{ content?: string }>(`/model/views/${viewId}`);
                if (viewData && viewData.content) {
                    console.log('Loading view content:', viewData.content);
                    // Restore nodes and edges
                    const content = typeof viewData.content === 'string' 
                        ? JSON.parse(viewData.content) 
                        : viewData.content;
                        
                    if (content.nodes) {
                        console.log('Restoring nodes:', content.nodes.length);
                        setNodes(content.nodes);
                    }
                    if (content.edges) {
                        console.log('Restoring edges:', content.edges.length);
                        setEdges(content.edges);
                    }
                } else {
                    console.log('View has no content');
                }
            } catch (error) {
                console.error('Failed to fetch view:', error);
            } finally {
                setIsLoaded(true); // Mark as loaded regardless of success
            }
        };

        fetchView();
    }, [viewId, setNodes, setEdges]);

    // Only initialize collaboration AFTER initial data is loaded
    // This prevents race conditions where socket events overwrite initial load or vice-versa
    const collaborationEnabled = isLoaded && !!viewId;

    // Flag to prevent broadcasting changes that come from remote users
    const isApplyingRemoteChangeRef = useRef(false);
    // Ref to store current nodes for broadcasting
    const nodesRef = useRef<Node[]>(nodes);
    const edgesRef = useRef<Edge[]>(edges);

    // Update refs when nodes/edges change
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);

    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);

    // State for save notification
    const [saveNotification, setSaveNotification] = useState<{ savedBy: { id: string; name: string } } | null>(null);

    const {
        users,
        cursors,
        selections,
        isConnected,
        updateCursor,
        updateNode,
        updateEdge,
        deleteNode,
        deleteEdge,
        updateSelection,
    } = useCollaboration({
        viewId: collaborationEnabled && currentUser ? viewId : '', // Don't connect if not enabled or no user
        user: currentUser || { id: '', name: '', color: '#4ECDC4' }, // Fallback user (will be rejected by server)
        onViewSaved: (data) => {
            // Show notification
            setSaveNotification({ savedBy: data.savedBy });
            // Hide after 5 seconds
            setTimeout(() => {
                setSaveNotification(null);
            }, 5000);
            // Call parent callback if provided
            if (onViewSaved) {
                onViewSaved(data.savedBy);
            }
        },
        onNodeChanged: (data) => {
            // This callback is only called for remote changes (filtered in useCollaboration)
            isApplyingRemoteChangeRef.current = true;
            setNodes((nds) => {
                const nodeExists = nds.some((n) => n.id === data.node.id);
                if (nodeExists) {
                    const existingNode = nds.find((n) => n.id === data.node.id);
                    // Only update if position or data actually changed
                    if (existingNode && (
                        existingNode.position.x !== data.node.position?.x ||
                        existingNode.position.y !== data.node.position?.y ||
                        JSON.stringify(existingNode.data) !== JSON.stringify(data.node.data)
                    )) {
                        return nds.map((n) => (n.id === data.node.id ? data.node : n));
                    }
                    return nds;
                }
                return [...nds, data.node];
            });
            // Reset flag after state update
            setTimeout(() => {
                isApplyingRemoteChangeRef.current = false;
            }, 100);
        },
        onEdgeChanged: (data) => {
            // This callback is only called for remote changes (filtered in useCollaboration)
            isApplyingRemoteChangeRef.current = true;
            setEdges((eds) => {
                const edgeExists = eds.some((e) => e.id === data.edge.id);
                if (edgeExists) {
                    return eds.map((e) => (e.id === data.edge.id ? data.edge : e));
                }
                return [...eds, data.edge];
            });
            // Reset flag after state update
            setTimeout(() => {
                isApplyingRemoteChangeRef.current = false;
            }, 100);
        },
        onNodeDeleted: (data) => {
            // This callback is only called for remote changes (filtered in useCollaboration)
            isApplyingRemoteChangeRef.current = true;
            setNodes((nds) => nds.filter((n) => n.id !== data.nodeId));
            setTimeout(() => {
                isApplyingRemoteChangeRef.current = false;
            }, 100);
        },
        onEdgeDeleted: (data) => {
            // This callback is only called for remote changes (filtered in useCollaboration)
            isApplyingRemoteChangeRef.current = true;
            setEdges((eds) => eds.filter((e) => e.id !== data.edgeId));
            setTimeout(() => {
                isApplyingRemoteChangeRef.current = false;
            }, 100);
        },
    });

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            // Apply changes locally first
            onNodesChangeInternal(changes);

            // Broadcast changes only if they come from local user (not from remote sync)
            if (isConnected && !isApplyingRemoteChangeRef.current) {
                // Process changes immediately using the current nodes state
                // We'll use a small delay to ensure React Flow has processed the change
                requestAnimationFrame(() => {
                    if (!isApplyingRemoteChangeRef.current && isConnected) {
                        // Get the latest nodes from ref (should be updated by now)
                        const currentNodes = nodesRef.current;
                        
                        changes.forEach((change) => {
                            if (change.type === 'position' || change.type === 'dimensions') {
                                // For position changes, use the position from the change directly
                                if (change.type === 'position' && change.position) {
                                    const node = currentNodes.find((n) => n.id === change.id);
                                    if (node) {
                                        const updatedNode = {
                                            ...node,
                                            position: change.position,
                                        };
                                        updateNode(updatedNode);
                                    } else {
                                        // If node not found yet, try again after a short delay
                                        setTimeout(() => {
                                            const delayedNode = nodesRef.current.find((n) => n.id === change.id);
                                            if (delayedNode) {
                                                const updatedNode = {
                                                    ...delayedNode,
                                                    position: change.position,
                                                };
                                                updateNode(updatedNode);
                                            }
                                        }, 100);
                                    }
                                }
                            } else if (change.type === 'remove') {
                                deleteNode(change.id);
                            }
                        });
                    }
                });
            }
        },
        [onNodesChangeInternal, updateNode, deleteNode, isConnected]
    );

    // Broadcast selection changes
    useEffect(() => {
        if (!isConnected) return;

        const selectedNodes = nodes.filter((n) => n.selected).map((n) => n.id);
        updateSelection(selectedNodes);
    }, [nodes, isConnected, updateSelection]);

    const onEdgesChange = useCallback(
        (changes: EdgeChange[]) => {
            onEdgesChangeInternal(changes);

            if (isConnected) {
                changes.forEach((change) => {
                    if (change.type === 'remove') {
                        deleteEdge(change.id);
                    }
                });
            }
        },
        [onEdgesChangeInternal, deleteEdge, isConnected]
    );

    const handleSetNodes = useCallback((value: React.SetStateAction<Node[]>) => {
        setNodes((prevNodes) => {
            const newNodes = typeof value === 'function' ? (value as any)(prevNodes) : value;
            
            // Only broadcast if change comes from local user (not from remote sync)
            if (isConnected && !isApplyingRemoteChangeRef.current) {
                // Find added nodes
                const addedNodes = newNodes.filter((n: Node) => !prevNodes.some((pn: Node) => pn.id === n.id));
                addedNodes.forEach((node: Node) => {
                    updateNode(node);
                });

                // Find modified nodes
                newNodes.forEach((newNode: Node) => {
                    const prevNode = prevNodes.find((pn: Node) => pn.id === newNode.id);
                    if (prevNode && (
                        prevNode.position.x !== newNode.position.x || 
                        prevNode.position.y !== newNode.position.y ||
                        JSON.stringify(prevNode.data) !== JSON.stringify(newNode.data)
                    )) {
                         updateNode(newNode);
                    }
                });
            }

            return newNodes;
        });
    }, [setNodes, updateNode, isConnected]);

    const handleSetEdges = useCallback((value: React.SetStateAction<Edge[]>) => {
        setEdges((prevEdges) => {
            const newEdges = typeof value === 'function' ? (value as any)(prevEdges) : value;
            
            // Only broadcast if change comes from local user (not from remote sync)
            if (isConnected && !isApplyingRemoteChangeRef.current) {
                const addedEdges = newEdges.filter((e: Edge) => !prevEdges.some((pe: Edge) => pe.id === e.id));
                addedEdges.forEach((edge: Edge) => {
                    updateEdge(edge);
                });
            }

            return newEdges;
        });
    }, [setEdges, updateEdge, isConnected]);

    // Track React Flow instance for coordinate conversion
    const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
    const lastCursorUpdateRef = useRef<{ x: number; y: number } | null>(null);

    // Expose setters to parent (using refs to avoid infinite loops)
    const onSetNodesAndEdgesRef = useRef(onSetNodesAndEdges);
    const handleSetNodesRef = useRef(handleSetNodes);
    const handleSetEdgesRef = useRef(handleSetEdges);
    const hasExposedSettersRef = useRef(false);
    
    useEffect(() => {
        onSetNodesAndEdgesRef.current = onSetNodesAndEdges;
        handleSetNodesRef.current = handleSetNodes;
        handleSetEdgesRef.current = handleSetEdges;
        
        // Only expose setters once to avoid infinite loops
        if (!hasExposedSettersRef.current && onSetNodesAndEdgesRef.current) {
            hasExposedSettersRef.current = true;
            onSetNodesAndEdgesRef.current(
                (nodes: Node[]) => handleSetNodesRef.current(nodes),
                (edges: Edge[]) => handleSetEdgesRef.current(edges)
            );
        }
    }, [onSetNodesAndEdges, handleSetNodes, handleSetEdges]);

    useEffect(() => {
        if (!isConnected || !reactFlowInstance) return;

        const handleMouseMove = (e: MouseEvent) => {
            if (canvasRef.current) {
                // Get React Flow viewport element
                const reactFlowPane = canvasRef.current.querySelector('.react-flow__pane') as HTMLElement;
                if (reactFlowPane) {
                    const rect = reactFlowPane.getBoundingClientRect();
                    // Check if mouse is within the pane bounds
                    if (
                        e.clientX >= rect.left &&
                        e.clientX <= rect.right &&
                        e.clientY >= rect.top &&
                        e.clientY <= rect.bottom
                    ) {
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        // Convert screen coordinates to flow coordinates (accounting for zoom and pan)
                        const flowPosition = reactFlowInstance.screenToFlowPosition({ x, y });
                        
                        // Throttle cursor updates (only send if position changed significantly)
                        const lastPos = lastCursorUpdateRef.current;
                        if (!lastPos || 
                            Math.abs(lastPos.x - flowPosition.x) > 5 || 
                            Math.abs(lastPos.y - flowPosition.y) > 5) {
                            lastCursorUpdateRef.current = { x: flowPosition.x, y: flowPosition.y };
                            updateCursor({
                                x: flowPosition.x,
                                y: flowPosition.y,
                            });
                        }
                    }
                }
            }
        };

        // Use document to catch mouse movements even outside the canvas
        document.addEventListener('mousemove', handleMouseMove);
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
        };
    }, [updateCursor, isConnected, reactFlowInstance]);

    const nodesWithSelection = useMemo(() => {
        if (!currentUser) return nodes;
        
        return nodes.map(node => {
            const selectedBy: { name: string; color: string }[] = [];
            
            users.forEach(user => {
                if (user.id === currentUser.id) return;
                
                const userSelection = selections[user.id];
                if (userSelection && userSelection.includes(node.id)) {
                    selectedBy.push({ name: user.name, color: user.color });
                }
            });
            
            if (selectedBy.length > 0) {
                 return {
                     ...node,
                     draggable: false,
                     data: {
                         ...node.data,
                         selectedBy
                     }
                 };
            }
            
            return node;
        });
    }, [nodes, users, selections, currentUser]);

    // Notify parent of content changes
    const lastContentRef = useRef<string>('');
    
    useEffect(() => {
        if (onContentChange && isLoaded) {
            // Clean nodes and edges before sending (remove React Flow internal properties)
            const cleanNodes = nodes.map(({ selected, ...node }) => {
                const { selectedBy, ...cleanData } = node.data || {};
                return {
                    ...node,
                    selected: undefined, // Remove selection state for persistence
                    data: cleanData
                };
            });
            const cleanEdges = edges.map(({ selected, ...edge }) => ({
                ...edge,
                selected: undefined // Remove selection state for persistence
            }));
            
            // Create a stable string representation to compare
            const contentString = JSON.stringify({
                nodes: cleanNodes.map(n => ({ id: n.id, position: n.position, data: n.data })),
                edges: cleanEdges.map(e => ({ id: e.id, source: e.source, target: e.target }))
            });
            
            // Only call onContentChange if content actually changed
            if (contentString !== lastContentRef.current) {
                lastContentRef.current = contentString;
                onContentChange({ nodes: cleanNodes, edges: cleanEdges });
            }
        }
    }, [nodes, edges, onContentChange, isLoaded]);

    // Show loading indicator or placeholder until view data is fetched
    if (!isLoaded) {
        return (
            <div className="w-full h-full flex items-center justify-center bg-muted/10">
                <div className="flex flex-col items-center gap-2">
                    <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
                    <p className="text-sm text-muted-foreground">Loading view...</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={canvasRef} className="relative h-full w-full">
            <ReactFlowProvider>
                <ModelingCanvas 
                    packageId={packageId}
                    viewName={viewName}
                    nodes={nodesWithSelection}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    setNodes={handleSetNodes}
                    setEdges={handleSetEdges}
                    onNodeClick={onNodeClick}
                    onEdgeClick={onEdgeClick}
                    onReactFlowInit={setReactFlowInstance}
                    onSelectionChange={onSelectionChange}
                />
            </ReactFlowProvider>

            {isConnected && reactFlowInstance && currentUser && (
                <CollaborativeCursors 
                    users={users.filter(u => u.id !== currentUser.id)} 
                    cursors={cursors}
                    reactFlowInstance={reactFlowInstance}
                />
            )}
            
            {/* Save notification */}
            {saveNotification && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-50 transition-opacity duration-300">
                    <div className="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-sm font-medium">
                            Vue sauvegardée par {saveNotification.savedBy.name}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}