"use client";

import React, { useEffect, useState, useRef } from 'react';
import {
    ChevronRight, ChevronDown, Folder, FileText,
    Layout, Box, Search, Trash2, Edit2, FolderPlus, MoreHorizontal, AlertTriangle
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuLabel,
    ContextMenuSeparator,
    ContextMenuSub,
    ContextMenuSubContent,
    ContextMenuSubTrigger,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { useTabsStore } from '@/store/useTabsStore';
import { useRepositoryStore } from '@/store/useRepositoryStore';
import { ARCHIMATE_CONCEPTS, ConceptDefinition } from '@/lib/metamodel';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { createPortal } from 'react-dom';

interface Element {
    id: string;
    name: string;
    folderId?: string | null;
    conceptType: {
        name: string;
        category: string;
    };
}

interface FolderType {
    id: string;
    name: string;
    parentId: string | null;
    modelPackageId?: string;
    children: FolderType[];
    elements: Element[];
    views: ViewType[];
}

interface ViewType {
    id: string;
    name: string;
    folderId?: string | null;
}

interface DeleteConfirmation {
    isOpen: boolean;
    viewId: string | null;
    viewName: string | null;
    position: { x: number; y: number } | null;
}

// Format ArchiMate type name for display (e.g., "BusinessActor" -> "Business Actor")
const formatConceptTypeName = (typeName: string): string => {
    return typeName.replace(/([A-Z])/g, ' $1').trim();
};

// Map ArchiMate types to their SVG filenames
const svgMapping: Record<string, string> = {
    // Strategy
    'Resource': 'Resource.svg',
    'Capability': 'Capability.svg',
    'CourseOfAction': 'Course of Action.svg',
    'ValueStream': 'Value Stream.svg',

    // Business
    'BusinessActor': 'Business Actor.svg',
    'BusinessRole': 'Business Role.svg',
    'BusinessCollaboration': 'Business Collaboration.svg',
    'BusinessInterface': 'Business Interface.svg',
    'BusinessProcess': 'Business Process.svg',
    'BusinessFunction': 'Business Function.svg',
    'BusinessInteraction': 'Business Interaction.svg',
    'BusinessEvent': 'Business Event.svg',
    'BusinessService': 'Business Service.svg',
    'BusinessObject': 'Business Object.svg',
    'Contract': 'Contract.svg',
    'Representation': 'Representation.svg',
    'Product': 'Product.svg',

    // Application
    'ApplicationComponent': 'Application Component.svg',
    'ApplicationCollaboration': 'Application Collaboration.svg',
    'ApplicationInterface': 'Application Interface.svg',
    'ApplicationFunction': 'Application Function.svg',
    'ApplicationInteraction': 'Application Interaction.svg',
    'ApplicationProcess': 'Application Process.svg',
    'ApplicationEvent': 'Application Event.svg',
    'ApplicationService': 'Application Service.svg',
    'DataObject': 'DataObject.svg',

    // Technology
    'Node': 'Node.svg',
    'Device': 'Device.svg',
    'SystemSoftware': 'System Software.svg',
    'TechnologyCollaboration': 'Technology Collaboration.svg',
    'TechnologyInterface': 'Technology Interface.svg',
    'Path': 'Path.svg',
    'CommunicationNetwork': 'Communication Network.svg',
    'TechnologyFunction': 'Technology Function.svg',
    'TechnologyProcess': 'Technology Process.svg',
    'TechnologyInteraction': 'Technology Interaction.svg',
    'TechnologyEvent': 'Technology Event.svg',
    'TechnologyService': 'Technology Service.svg',
    'Artifact': 'Artifact.svg',

    // Physical
    'Equipment': 'Equipment.svg',
    'Facility': 'Facility.svg',
    'DistributionNetwork': 'Distribution Network.svg',
    'Material': 'Material.svg',

    // Motivation
    'Stakeholder': 'Stakeholder.svg',
    'Driver': 'Driver.svg',
    'Assessment': 'Assessment.svg',
    'Goal': 'Goal.svg',
    'Outcome': 'Outcome.svg',
    'Principle': 'Principle.svg',
    'Requirement': 'Requirement.svg',
    'Constraint': 'Constraint.svg',
    'Meaning': 'Meaning.svg',
    'Value': 'Value.svg',

    // Implementation
    'WorkPackage': 'Work Package.svg',
    'Deliverable': 'Deliverable.svg',
    'ImplementationEvent': 'Implementation Event.svg',
    'Plateau': 'Plateau.svg',
    'Gap': 'Gap.svg',

    // Composite
    'Grouping': 'Grouping.svg',
    'Location': 'Location.svg',
};

export default function ModelTree() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshTrigger } = useRepositoryStore();

    const [folders, setFolders] = useState<FolderType[]>([]);
    const [elements, setElements] = useState<Element[]>([]);
    const [views, setViews] = useState<ViewType[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'repository': true,
    });
    const [searchTerm, setSearchTerm] = useState('');
    const [enabledConcepts, setEnabledConcepts] = useState<string[]>([]);
    
    const [deleteConfirmation, setDeleteConfirmation] = useState<DeleteConfirmation>({
        isOpen: false,
        viewId: null,
        viewName: null,
        position: null
    });

    const fetchData = () => {
        const token = localStorage.getItem('accessToken');
        const headers = { 'Authorization': `Bearer ${token}` };

        fetch('http://localhost:3002/model/folders', { headers })
            .then(res => res.json())
            .then(data => setFolders(data))
            .catch(console.error);

        fetch('http://localhost:3002/model/elements', { headers })
            .then(res => res.json())
            .then(data => setElements(data))
            .catch(console.error);

        fetch('http://localhost:3002/model/views', { headers })
            .then(res => res.json())
            .then(data => setViews(data))
            .catch(console.error);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, []);

    // Refresh immediately when triggered
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchData();
        }
    }, [refreshTrigger]);

    // Fetch palette configuration
    useEffect(() => {
        fetch('http://localhost:3002/settings')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    const palette = data.find((s: any) => s.key === 'palette');
                    if (palette && palette.value && Array.isArray(palette.value)) {
                        setEnabledConcepts(palette.value);
                    } else {
                        setEnabledConcepts(ARCHIMATE_CONCEPTS.map(c => c.name));
                    }
                } else {
                    setEnabledConcepts(ARCHIMATE_CONCEPTS.map(c => c.name));
                }
            })
            .catch(() => {
                setEnabledConcepts(ARCHIMATE_CONCEPTS.map(c => c.name));
            });
    }, []);

    const toggleExpand = (key: string) => {
        setExpanded(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleCreateFolder = async (parentId?: string) => {
        const name = prompt('Folder Name:');
        if (!name) return;

        try {
            await fetch('http://localhost:3002/model/folders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({
                    name,
                    parentId,
                    modelPackage: { connect: { id: 'default-package-id' } }
                })
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRenameFolder = async (folderId: string, currentName: string) => {
        const newName = prompt('New Folder Name:', currentName);
        if (!newName || newName === currentName) return;

        try {
            await fetch(`http://localhost:3002/model/folders/${folderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ name: newName })
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to rename folder');
        }
    };

    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        if (!confirm(`Delete folder "${folderName}"?`)) return;

        try {
            const res = await fetch(`http://localhost:3002/model/folders/${folderId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });

            if (!res.ok) {
                const errorData = await res.json();
                alert(`Failed to delete folder: ${errorData.message || 'Unknown error'}`);
                return;
            }

            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete folder');
        }
    };

    const handleDrop = async (e: React.DragEvent, targetFolderId: string) => {
        e.preventDefault();
        e.stopPropagation(); // Prevent bubbling to parent folders

        const elementDataStr = e.dataTransfer.getData('application/reactflow');
        const folderDataStr = e.dataTransfer.getData('application/archimodeler-folder');
        const viewDataStr = e.dataTransfer.getData('application/archimodeler-view');

        if (elementDataStr) {
            const { existingId } = JSON.parse(elementDataStr);
            if (!existingId) return;

            try {
                await fetch(`http://localhost:3002/model/elements/${existingId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ folder: { connect: { id: targetFolderId } } })
                });
                fetchData();
            } catch (err) {
                console.error(err);
            }
        } else if (folderDataStr) {
            const { folderId } = JSON.parse(folderDataStr);
            if (!folderId || folderId === targetFolderId) return; // Can't drop into self

            try {
                await fetch(`http://localhost:3002/model/folders/${folderId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ parent: { connect: { id: targetFolderId } } })
                });
                fetchData();
            } catch (err) {
                console.error(err);
            }
        } else if (viewDataStr) {
            const { viewId } = JSON.parse(viewDataStr);
            if (!viewId) return;

            try {
                await fetch(`http://localhost:3002/model/views/${viewId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                    },
                    body: JSON.stringify({ folder: { connect: { id: targetFolderId } } })
                });
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleRenameView = async (viewId: string, currentName: string) => {
        const newName = prompt('New view name:', currentName);
        if (!newName || newName === currentName) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3002/model/views/${viewId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to rename view');
        }
    };

    const initiateDeleteView = (e: React.MouseEvent, viewId: string, viewName: string) => {
        e.stopPropagation();
        const rect = (e.target as HTMLElement).getBoundingClientRect();
        setDeleteConfirmation({
            isOpen: true,
            viewId,
            viewName,
            position: { x: rect.left, y: rect.bottom + 5 }
        });
    };

    const confirmDeleteView = async () => {
        if (!deleteConfirmation.viewId) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3002/model/views/${deleteConfirmation.viewId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchData();
            
            useTabsStore.getState().removeTab(`tab-${deleteConfirmation.viewId}`);
            
        } catch (err) {
            console.error(err);
            alert('Failed to delete view');
        } finally {
            setDeleteConfirmation({ isOpen: false, viewId: null, viewName: null, position: null });
        }
    };

    const cancelDeleteView = () => {
        setDeleteConfirmation({ isOpen: false, viewId: null, viewName: null, position: null });
    };

    const handleRenameElement = async (elementId: string, currentName: string) => {
        const newName = prompt('New name:', currentName);
        if (!newName || newName === currentName) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3002/model/elements/${elementId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ name: newName })
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to rename element');
        }
    };

    const handleDeleteElement = async (elementId: string, elementName: string) => {
        if (!confirm(`Delete "${elementName}"? This action cannot be undone.`)) return;

        try {
            const token = localStorage.getItem('accessToken');
            await fetch(`http://localhost:3002/model/elements/${elementId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to delete element');
        }
    };

    const handleCreateElementInFolder = async (folderId: string, conceptType: string, layer: string, packageId?: string) => {
        const name = prompt(`Enter name for ${formatConceptTypeName(conceptType)}:`);
        if (!name) return;

        try {
            const token = localStorage.getItem('accessToken');
            const pkgId = packageId || 'default-package-id';
            
            // Expand the folder so the new element is visible
            setExpanded(prev => ({ ...prev, [folderId]: true }));
            
            // Use the simplified endpoint that handles concept type creation
            const response = await fetch('http://localhost:3002/model/elements', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name,
                    type: conceptType,
                    layer: layer,
                    packageId: pkgId,
                    folderId: folderId
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Failed to create element:', errorText);
                throw new Error('Failed to create element');
            }

            const createdElement = await response.json();
            console.log('Element created:', createdElement, 'folderId:', createdElement.folderId);

            // Small delay to ensure backend has updated
            await new Promise(resolve => setTimeout(resolve, 100));

            // Refresh data to show the new element
            fetchData();
        } catch (err) {
            console.error(err);
            alert('Failed to create element');
        }
    };

    // Group concepts by layer for context menu
    const groupedConcepts = ARCHIMATE_CONCEPTS
        .filter(c => enabledConcepts.includes(c.name))
        .reduce((acc, concept) => {
            if (!acc[concept.layer]) acc[concept.layer] = [];
            acc[concept.layer].push(concept);
            return acc;
        }, {} as Record<string, ConceptDefinition[]>);

    const layerOrder = [
        'Strategy', 'Business', 'Application', 'Technology',
        'Physical', 'Motivation', 'Implementation & Migration', 'Composite'
    ];

    const renderFolder = (folder: FolderType): React.ReactElement => {
        const isExpanded = expanded[folder.id];

        return (
            <ContextMenu key={folder.id}>
                <ContextMenuTrigger asChild>
                    <div className="ml-4">
                        <div
                            className="flex items-center gap-1 p-1.5 hover:bg-accent rounded-md cursor-pointer text-sm group"
                            onClick={() => toggleExpand(folder.id)}
                            draggable
                            onDragStart={(e) => {
                                e.stopPropagation();
                                e.dataTransfer.setData('application/archimodeler-folder', JSON.stringify({ folderId: folder.id }));
                            }}
                            onDragOver={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                            }}
                            onDrop={(e) => handleDrop(e, folder.id)}
                        >
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                    <Folder className="h-4 w-4 text-yellow-500" />
                    <span className="truncate flex-1">{folder.name}</span>

                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 bg-background/80 rounded px-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleCreateFolder(folder.id);
                            }}
                            title="New Subfolder"
                        >
                            <FolderPlus className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleRenameFolder(folder.id, folder.name);
                            }}
                            title="Rename Folder"
                        >
                            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-5 w-5"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteFolder(folder.id, folder.name);
                            }}
                            title="Delete Folder"
                        >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-l border-border ml-2 pl-2">
                        {folder.children?.map(renderFolder)}

                        {folder.views?.map((view: ViewType) => (
                            <div
                                key={view.id}
                                className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm hover:bg-accent group"
                                draggable
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.setData('application/archimodeler-view', JSON.stringify({ viewId: view.id }));
                                }}
                                onClick={() => {
                                    const packageId = searchParams.get('packageId') || 'default';
                                    useTabsStore.getState().openViewFromRepository(
                                        view.id,
                                        view.name,
                                        packageId,
                                        folder.id
                                    );
                                }}
                            >
                                <Layout className="h-3.5 w-3.5 text-primary" />
                                <span className="truncate flex-1">{view.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                    <button
                                        className="p-0.5 hover:bg-accent rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameView(view.id, view.name);
                                        }}
                                        title="Rename"
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => initiateDeleteView(e, view.id, view.name)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {folder.elements?.map((el: Element) => {
                            const svgFile = svgMapping[el.conceptType.name];
                            const formattedTypeName = formatConceptTypeName(el.conceptType.name);
                            return (
                                <Tooltip key={el.id}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-2 p-1 rounded-md hover:bg-accent cursor-grab text-sm group"
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                e.dataTransfer.setData('application/reactflow', JSON.stringify({
                                                    type: el.conceptType.name,
                                                    layer: el.conceptType.category,
                                                    label: el.name,
                                                    existingId: el.id
                                                }));
                                            }}
                                        >
                                    {svgFile ? (
                                        <img 
                                            src={`/archimate-symbols/${svgFile}`} 
                                            alt={el.conceptType.name}
                                            className="h-3.5 w-3.5 object-contain flex-shrink-0"
                                        />
                                    ) : (
                                        <Box className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="truncate flex-1">{el.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                    <button
                                        className="p-0.5 hover:bg-accent rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameElement(el.id, el.name);
                                        }}
                                        title="Rename"
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElement(el.id, el.name);
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                        <div className="space-y-1.5">
                                            <div className="font-semibold text-sm">{el.name}</div>
                                            <div className="space-y-0.5 border-t border-border/50 pt-1.5">
                                                <div className="text-xs font-medium text-foreground">{formattedTypeName}</div>
                                                <div className="text-[10px] text-muted-foreground">{el.conceptType.category}</div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                )}
                    </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64">
                    <ContextMenuItem onClick={(e) => {
                        e.stopPropagation();
                        handleCreateFolder(folder.id);
                    }}>
                        <FolderPlus className="mr-2 h-4 w-4" />
                        New Folder
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuLabel>Create ArchiMate Element</ContextMenuLabel>
                    {layerOrder.map(layer => {
                        const concepts = groupedConcepts[layer];
                        if (!concepts || concepts.length === 0) return null;
                        
                        return (
                            <ContextMenuSub key={layer}>
                                <ContextMenuSubTrigger>{layer}</ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-64">
                                    {concepts.map(concept => {
                                        const svgFile = svgMapping[concept.name];
                                        return (
                                            <ContextMenuItem
                                                key={concept.name}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCreateElementInFolder(folder.id, concept.name, concept.layer, folder.modelPackageId);
                                                }}
                                                className="flex items-center gap-2"
                                            >
                                                {svgFile ? (
                                                    <img 
                                                        src={`/archimate-symbols/${svgFile}`} 
                                                        alt={concept.name}
                                                        className="h-4 w-4 object-contain flex-shrink-0"
                                                    />
                                                ) : (
                                                    <Box className="h-4 w-4 flex-shrink-0" />
                                                )}
                                                <span>{formatConceptTypeName(concept.name)}</span>
                                            </ContextMenuItem>
                                        );
                                    })}
                                </ContextMenuSubContent>
                            </ContextMenuSub>
                        );
                    })}
                </ContextMenuContent>
            </ContextMenu>
        );
    };

    // Filter root elements: elements that are not in any folder
    // Check both folderId property and folders.elements array
    const rootElements = elements.filter((el: Element) => {
        // If element has a folderId, it's not a root element
        if (el.folderId) return false;
        // Also check if element is in any folder's elements array
        return !folders.some((f: FolderType) => f.elements?.some((fe: Element) => fe.id === el.id));
    });
    // Filter root views: views that are not in any folder
    const rootViews = views.filter((v: ViewType) => !v.folderId);
    // Filter root folders: folders that have no parent (parentId is null)
    const rootFolders = folders.filter((f: FolderType) => !f.parentId);

    return (
        <TooltipProvider>
            <aside className="w-full bg-background h-full flex flex-col relative">
                <div className="p-4 border-b border-border flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Repository</h2>
                    <Button variant="outline" size="sm" onClick={() => handleCreateFolder()}>
                        <Folder className="h-4 w-4 mr-1" /> New Folder
                    </Button>
                </div>

                <div className="p-2">
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search..."
                            className="pl-8 h-8"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1 p-2">
                    {rootFolders.map(renderFolder)}

                    <div className="mt-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Uncategorized Views</h3>
                        {rootViews.map((view: ViewType) => (
                            <div
                                key={view.id}
                                className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm hover:bg-accent group ml-2"
                                draggable
                                onDragStart={(e) => {
                                    e.stopPropagation();
                                    e.dataTransfer.setData('application/archimodeler-view', JSON.stringify({ viewId: view.id }));
                                }}
                                onClick={() => {
                                    const packageId = searchParams.get('packageId') || 'default';
                                    useTabsStore.getState().openViewFromRepository(
                                        view.id,
                                        view.name,
                                        packageId,
                                        undefined // No folder
                                    );
                                }}
                            >
                                <Layout className="h-3.5 w-3.5 text-primary" />
                                <span className="truncate flex-1">{view.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                    <button
                                        className="p-0.5 hover:bg-accent rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameView(view.id, view.name);
                                        }}
                                        title="Rename"
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => initiateDeleteView(e, view.id, view.name)}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4">
                        <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Uncategorized Elements</h3>
                        {rootElements.map((el: Element) => {
                            const svgFile = svgMapping[el.conceptType.name];
                            const formattedTypeName = formatConceptTypeName(el.conceptType.name);
                            return (
                                <Tooltip key={el.id}>
                                    <TooltipTrigger asChild>
                                        <div
                                            className="flex items-center gap-2 p-1 rounded-md hover:bg-accent cursor-grab text-sm ml-2 group"
                                            draggable
                                            onDragStart={(e) => {
                                                e.stopPropagation();
                                                e.dataTransfer.setData('application/reactflow', JSON.stringify({
                                                    type: el.conceptType.name,
                                                    layer: el.conceptType.category,
                                                    label: el.name,
                                                    existingId: el.id
                                                }));
                                            }}
                                        >
                                    {svgFile ? (
                                        <img 
                                            src={`/archimate-symbols/${svgFile}`} 
                                            alt={el.conceptType.name}
                                            className="h-3.5 w-3.5 object-contain flex-shrink-0"
                                        />
                                    ) : (
                                        <Box className="h-3.5 w-3.5 text-muted-foreground flex-shrink-0" />
                                    )}
                                    <span className="truncate flex-1">{el.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                    <button
                                        className="p-0.5 hover:bg-accent rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameElement(el.id, el.name);
                                        }}
                                        title="Rename"
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElement(el.id, el.name);
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3 text-destructive" />
                                    </button>
                                </div>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent side="right" className="max-w-xs">
                                        <div className="space-y-1.5">
                                            <div className="font-semibold text-sm">{el.name}</div>
                                            <div className="space-y-0.5 border-t border-border/50 pt-1.5">
                                                <div className="text-xs font-medium text-foreground">{formattedTypeName}</div>
                                                <div className="text-[10px] text-muted-foreground">{el.conceptType.category}</div>
                                            </div>
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            );
                        })}
                    </div>
                </ScrollArea>
            </aside>

            {/* Custom Modal Portal for Delete Confirmation */}
            {deleteConfirmation.isOpen && deleteConfirmation.position && (
                createPortal(
                    <div 
                        className="fixed inset-0 z-50 flex items-start justify-start" 
                        onClick={cancelDeleteView}
                    >
                        {/* Invisible backdrop to capture outside clicks */}
                        <div className="absolute inset-0 bg-transparent" />
                        
                        {/* Modal positioned near the click */}
                        <div 
                            className="relative z-50 bg-popover text-popover-foreground rounded-md shadow-md border border-border p-4 w-[300px] animate-in fade-in zoom-in-95 duration-100"
                            style={{
                                top: Math.min(deleteConfirmation.position.y, window.innerHeight - 200), // Prevent going off-screen bottom
                                left: Math.min(deleteConfirmation.position.x - 150, window.innerWidth - 310), // Center horizontally around click, prevent off-screen right
                            }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-destructive font-semibold">
                                    <AlertTriangle className="h-4 w-4" />
                                    <span>Delete View?</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    Are you sure you want to delete <strong>{deleteConfirmation.viewName}</strong>? 
                                    <br/>
                                    This will NOT remove the elements from the repository.
                                </p>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="outline" size="sm" onClick={cancelDeleteView}>
                                        Cancel
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={confirmDeleteView}>
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            )}
        </TooltipProvider>
    );
}