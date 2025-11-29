"use client";

import React, { useEffect, useMemo, useRef, useCallback, useState } from 'react';
import { ReactFlowProvider, useNodesState, useEdgesState, Node, Edge, NodeChange, EdgeChange } from '@xyflow/react';
import ModelingCanvas from '@/components/canvas/ModelingCanvas';
import { useCollaboration, User } from '@/hooks/useCollaboration';
import CollaborativeCursors from '@/components/collaboration/CollaborativeCursors';

interface CollaborativeCanvasProps {
    viewId: string;
    viewName: string;
    packageId: string | null;
    onContentChange?: (content: { nodes: Node[]; edges: Edge[] }) => void;
    onNodeClick?: (nodeId: string, elementId: string | undefined, elementName: string, elementType: string) => void;
    onEdgeClick?: (edgeId: string, relationshipId: string | undefined, relationshipName: string, relationshipType: string) => void;
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
    onContentChange,
    onNodeClick,
    onEdgeClick
}: CollaborativeCanvasProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const [nodes, setNodes, onNodesChangeInternal] = useNodesState([]);
    const [edges, setEdges, onEdgesChangeInternal] = useEdgesState([]);
    const [isLoaded, setIsLoaded] = useState(false);

    // Create user object (in a real app, this would come from auth)
    const currentUser = useMemo<User>(() => ({
        id: Math.random().toString(36).substring(7),
        name: `User ${Math.floor(Math.random() * 1000)}`, // Replace with actual user name
        color: generateUserColor(),
    }), []);

    // Fetch initial view data
    useEffect(() => {
        if (!viewId) return;

        setIsLoaded(false); // Reset loaded state on view change

        const fetchView = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                const res = await fetch(`http://localhost:3002/model/views/${viewId}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (res.ok) {
                    const text = await res.text();
                    if (!text) {
                        setIsLoaded(true);
                        return; 
                    }
                    
                    const viewData = JSON.parse(text);
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
        viewId: collaborationEnabled ? viewId : '', // Don't connect if not enabled
        user: currentUser,
        onNodeChanged: (data) => {
            if (data.userId === currentUser.id) return;
            
            setNodes((nds) => {
                const nodeExists = nds.some((n) => n.id === data.node.id);
                if (nodeExists) {
                    return nds.map((n) => (n.id === data.node.id ? data.node : n));
                }
                return [...nds, data.node];
            });
        },
        onEdgeChanged: (data) => {
            if (data.userId === currentUser.id) return;
            
            setEdges((eds) => {
                const edgeExists = eds.some((e) => e.id === data.edge.id);
                if (edgeExists) {
                    return eds.map((e) => (e.id === data.edge.id ? data.edge : e));
                }
                return [...eds, data.edge];
            });
        },
        onNodeDeleted: (data) => {
            if (data.userId === currentUser.id) return;
            setNodes((nds) => nds.filter((n) => n.id !== data.nodeId));
        },
        onEdgeDeleted: (data) => {
            if (data.userId === currentUser.id) return;
            setEdges((eds) => eds.filter((e) => e.id !== data.edgeId));
        },
    });

    const onNodesChange = useCallback(
        (changes: NodeChange[]) => {
            // Apply changes locally
            onNodesChangeInternal(changes);

            // Broadcast changes
            if (isConnected) {
                changes.forEach((change) => {
                    if (change.type === 'position' || change.type === 'dimensions') {
                        const node = nodes.find((n) => n.id === change.id);
                        if (node) {
                            const updatedNode = { ...node };
                            if (change.type === 'position' && change.position) {
                                updatedNode.position = change.position;
                            }
                            updateNode(updatedNode);
                        }
                    } else if (change.type === 'remove') {
                        deleteNode(change.id);
                    }
                });
            }
        },
        [nodes, onNodesChangeInternal, updateNode, deleteNode, isConnected]
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
            
            if (isConnected) {
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
            
            if (isConnected) {
                const addedEdges = newEdges.filter((e: Edge) => !prevEdges.some((pe: Edge) => pe.id === e.id));
                addedEdges.forEach((edge: Edge) => {
                    updateEdge(edge);
                });
            }

            return newEdges;
        });
    }, [setEdges, updateEdge, isConnected]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (canvasRef.current && isConnected) {
                const rect = canvasRef.current.getBoundingClientRect();
                updateCursor({
                    x: e.clientX - rect.left,
                    y: e.clientY - rect.top,
                });
            }
        };

        const canvas = canvasRef.current;
        if (canvas) {
            canvas.addEventListener('mousemove', handleMouseMove);
            return () => {
                canvas.removeEventListener('mousemove', handleMouseMove);
            };
        }
    }, [updateCursor, isConnected]);

    const nodesWithSelection = useMemo(() => {
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
    }, [nodes, users, selections, currentUser.id]);

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
                />
            </ReactFlowProvider>

            {isConnected && (
                <CollaborativeCursors users={users} cursors={cursors} />
            )}
        </div>
    );
}