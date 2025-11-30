"use client";

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
    ChevronRight, ChevronDown, Folder, FileText,
    Layout, Box, Search, Trash2, Edit2, FolderPlus, MoreHorizontal, AlertTriangle, GitBranch
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api/client';
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
import { useTranslations } from 'next-intl';
import { useDialog } from '@/contexts/DialogContext';
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

interface ModelTreeProps {
    packageId: string | null;
    onElementSelect?: (elementId: string, elementName: string, elementType: string) => void;
    onRelationshipSelect?: (relationshipId: string, relationshipName: string, relationshipType: string) => void;
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

interface Relationship {
    id: string;
    name?: string | null;
    relationType: {
        name: string;
    };
    source: {
        id: string;
        name: string;
    };
    target: {
        id: string;
        name: string;
    };
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

function ModelTree({ packageId, onElementSelect, onRelationshipSelect }: ModelTreeProps) {
const t = useTranslations('ModelTree');
    const router = useRouter();
    const searchParams = useSearchParams();
    const { refreshTrigger } = useRepositoryStore();
    const { alert, confirm, prompt: promptDialog } = useDialog();

    const [folders, setFolders] = useState<FolderType[]>([]);
    const [elements, setElements] = useState<Element[]>([]);
    const [views, setViews] = useState<ViewType[]>([]);
    const [relationships, setRelationships] = useState<Relationship[]>([]);
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

    const fetchData = useCallback(() => {
        if (!packageId) {
            setFolders([]);
            setElements([]);
            setViews([]);
            setRelationships([]);
            return;
        }

        // Fetch folders filtered by packageId
        api.get(`/model/packages/${packageId}/folders`)
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setFolders(data);
                }
            })
            .catch(console.error);

        // Fetch elements filtered by packageId
        api.get(`/model/packages/${packageId}/elements`)
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setElements(data);
                }
            })
            .catch(console.error);

        // Fetch views filtered by packageId
        api.get(`/model/packages/${packageId}/views`)
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setViews(data);
                }
            })
            .catch(console.error);

        // Fetch relationships filtered by packageId
        api.get(`/model/relationships?packageId=${packageId}`)
            .then((data: any) => {
                if (Array.isArray(data)) {
                    setRelationships(data);
                }
            })
            .catch(console.error);
    }, [packageId]);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
    }, [fetchData]);

    // Refresh immediately when triggered
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchData();
        }
    }, [refreshTrigger]);

    // Fetch palette configuration
    useEffect(() => {
        api.get('/settings')
            .then((data: any) => {
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
        const name = await promptDialog({
            title: t('newFolder'),
            label: t('newFolder'),
            placeholder: t('newFolder'),
            required: true,
        });
        if (!name) return;

        try {
            await api.post('/model/folders', {
                name,
                parentId,
                modelPackage: { connect: { id: packageId || 'default-package-id' } }
            });
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    const handleRenameFolder = async (folderId: string, currentName: string) => {
        const newName = await promptDialog({
            title: t('rename'),
            label: t('newFolder'),
            defaultValue: currentName,
            required: true,
        });
        if (!newName || newName === currentName) return;

        try {
            await api.put(`/model/folders/${folderId}`, { name: newName });
            fetchData();
        } catch (err: any) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to rename folder',
                type: 'error',
            });
        }
    };

    const handleDeleteFolder = async (folderId: string, folderName: string) => {
        const confirmed = await confirm({
            title: t('deleteFolder'),
            description: t('confirmDelete', { name: folderName }) + ' ' + t('thisActionCannotBeUndone'),
            variant: 'destructive',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/model/folders/${folderId}`);
            fetchData();
        } catch (err: any) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: `Failed to delete folder: ${err.message || 'Unknown error'}`,
                type: 'error',
            });
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
                await api.put(`/model/elements/${existingId}`, {
                    folder: { connect: { id: targetFolderId } }
                });
                fetchData();
            } catch (err) {
                console.error(err);
            }
        } else if (folderDataStr) {
            const { folderId } = JSON.parse(folderDataStr);
            if (!folderId || folderId === targetFolderId) return; // Can't drop into self

            try {
                await api.put(`/model/folders/${folderId}`, {
                    parent: { connect: { id: targetFolderId } }
                });
                fetchData();
            } catch (err) {
                console.error(err);
            }
        } else if (viewDataStr) {
            const { viewId } = JSON.parse(viewDataStr);
            if (!viewId) return;

            try {
                await api.put(`/model/views/${viewId}`, {
                    folder: { connect: { id: targetFolderId } }
                });
                fetchData();
            } catch (err) {
                console.error(err);
            }
        }
    };

    const handleRenameView = async (viewId: string, currentName: string) => {
        const newName = await promptDialog({
            title: t('rename'),
            label: t('newView'),
            defaultValue: currentName,
            required: true,
        });
        if (!newName || newName === currentName) return;

        try {
            await api.put(`/model/views/${viewId}`, { name: newName });
            fetchData();
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to rename view',
                type: 'error',
            });
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
            await api.delete(`/model/views/${deleteConfirmation.viewId}`);
            fetchData();
            
            useTabsStore.getState().removeTab(`tab-${deleteConfirmation.viewId}`);
            
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to delete view',
                type: 'error',
            });
        } finally {
            setDeleteConfirmation({ isOpen: false, viewId: null, viewName: null, position: null });
        }
    };

    const cancelDeleteView = () => {
        setDeleteConfirmation({ isOpen: false, viewId: null, viewName: null, position: null });
    };

    const handleRenameElement = async (elementId: string, currentName: string) => {
        const newName = await promptDialog({
            title: t('rename'),
            label: t('rename'),
            defaultValue: currentName,
            required: true,
        });
        if (!newName || newName === currentName) return;

        try {
            await api.put(`/model/elements/${elementId}`, {
                name: newName
            });
            fetchData();
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to rename element',
                type: 'error',
            });
        }
    };

    const handleDeleteElement = async (elementId: string, elementName: string) => {
        const confirmed = await confirm({
            title: t('deleteElement'),
            description: t('confirmDelete', { name: elementName }) + ' ' + t('thisActionCannotBeUndone'),
            variant: 'destructive',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/model/elements/${elementId}`);
            fetchData();
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to delete element',
                type: 'error',
            });
        }
    };

    const handleDeleteRelationship = async (relationshipId: string, relationshipName: string) => {
        const confirmed = await confirm({
            title: t('delete') || 'Delete',
            description: t('confirmDelete', { name: relationshipName }) + ' ' + t('thisActionCannotBeUndone'),
            variant: 'destructive',
        });
        if (!confirmed) return;

        try {
            await api.delete(`/model/relationships/${relationshipId}`);
            fetchData();
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to delete relationship',
                type: 'error',
            });
        }
    };

    const handleCreateElementInFolder = async (folderId: string, conceptType: string, layer: string) => {
        if (!packageId) {
            await alert({
                title: t('error') || 'Error',
                message: 'No package selected',
                type: 'error',
            });
            return;
        }

        const name = await promptDialog({
            title: t('newElement'),
            label: `Enter name for ${formatConceptTypeName(conceptType)}`,
            placeholder: formatConceptTypeName(conceptType),
            required: true,
        });
        if (!name) return;

        try {
            const token = localStorage.getItem('accessToken');
            const pkgId = packageId;
            
            // Expand the folder so the new element is visible
            setExpanded(prev => ({ ...prev, [folderId]: true }));
            
            // Use the simplified endpoint that handles concept type creation
            const createdElement = await api.post('/model/elements', {
                name,
                type: conceptType,
                layer: layer,
                packageId: pkgId,
                folderId: folderId
            });
            console.log('Element created:', createdElement, 'folderId:', (createdElement as { folderId?: string }).folderId);

            // Small delay to ensure backend has updated
            await new Promise(resolve => setTimeout(resolve, 100));

            // Refresh data to show the new element
            fetchData();
        } catch (err) {
            console.error(err);
            await alert({
                title: t('error') || 'Error',
                message: 'Failed to create element',
                type: 'error',
            });
        }
    };

    // Group concepts by layer for context menu
    const groupedConcepts = ARCHIMATE_CONCEPTS
        .filter(c => enabledConcepts.includes(c.name))
        .reduce((acc, concept) => {
            if (!acc[concept.layer]) acc[concept.layer] = [];
            const layerArray = acc[concept.layer];
            if (layerArray) {
                layerArray.push(concept);
            }
            return acc;
        }, {} as Record<string, ConceptDefinition[]>);

    // Layer order with translations
    const layerOrder = [
        { key: 'Strategy', label: t('layerStrategy') },
        { key: 'Business', label: t('layerBusiness') },
        { key: 'Application', label: t('layerApplication') },
        { key: 'Technology', label: t('layerTechnology') },
        { key: 'Physical', label: t('layerPhysical') },
        { key: 'Motivation', label: t('layerMotivation') },
        { key: 'Implementation & Migration', label: t('layerImplementationMigration') },
        { key: 'Composite', label: t('layerComposite') }
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
                            title={t('newFolder')}
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
                            title={t('rename')}
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
                            title={t('delete')}
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
                                        title={t('rename')}
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => initiateDeleteView(e, view.id, view.name)}
                                        title={t('delete')}
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onElementSelect?.(el.id, el.name, el.conceptType.name);
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
                                        title={t('rename')}
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElement(el.id, el.name);
                                        }}
                                        title={t('delete')}
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
                        {t('newFolder')}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuLabel>{t('newElement')}</ContextMenuLabel>
                    {layerOrder.map(({ key, label }) => {
                        const concepts = groupedConcepts[key];
                        if (!concepts || concepts.length === 0) return null;
                        
                        return (
                            <ContextMenuSub key={key}>
                                <ContextMenuSubTrigger>{label}</ContextMenuSubTrigger>
                                <ContextMenuSubContent className="w-64">
                                    {concepts.map(concept => {
                                        const svgFile = svgMapping[concept.name];
                                        return (
                                            <ContextMenuItem
                                                key={concept.name}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleCreateElementInFolder(folder.id, concept.name, concept.layer);
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
                    <h2 className="text-lg font-semibold">{t('repository')}</h2>
                    <Button variant="outline" size="sm" onClick={() => handleCreateFolder()}>
                        <Folder className="h-4 w-4 mr-1" /> {t('newFolder')}
                    </Button>
                </div>

                <div className="p-2">
                    <div className="relative mb-2">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder={t('search')}
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
                                        title={t('rename')}
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => initiateDeleteView(e, view.id, view.name)}
                                        title={t('delete')}
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
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onElementSelect?.(el.id, el.name, el.conceptType.name);
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
                                        title={t('rename')}
                                    >
                                        <Edit2 className="h-3 w-3 text-muted-foreground" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElement(el.id, el.name);
                                        }}
                                        title={t('delete')}
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

                    {relationships.length > 0 && (
                        <div className="mt-4">
                            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 px-2">Relations</h3>
                            {relationships.map((rel: Relationship) => {
                                const relationshipName = rel.name || `${rel.source.name} → ${rel.target.name}`;
                                const formattedTypeName = formatConceptTypeName(rel.relationType.name);
                                return (
                                    <Tooltip key={rel.id}>
                                        <TooltipTrigger asChild>
                                            <div
                                                className="flex items-center gap-2 p-1 rounded-md hover:bg-accent cursor-pointer text-sm ml-2 group"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRelationshipSelect?.(rel.id, relationshipName, rel.relationType.name);
                                                }}
                                            >
                                                <GitBranch className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                                                <span className="truncate flex-1">{relationshipName}</span>
                                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                                    <button
                                                        className="p-0.5 hover:bg-destructive/10 rounded"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRelationship(rel.id, relationshipName);
                                                        }}
                                                        title={t('delete')}
                                                    >
                                                        <Trash2 className="h-3 w-3 text-destructive" />
                                                    </button>
                                                </div>
                                            </div>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="max-w-xs">
                                            <div className="space-y-1.5">
                                                <div className="font-semibold text-sm">{relationshipName}</div>
                                                <div className="space-y-0.5 border-t border-border/50 pt-1.5">
                                                    <div className="text-xs font-medium text-foreground">{formattedTypeName}</div>
                                                    <div className="text-[10px] text-muted-foreground">
                                                        {rel.source.name} → {rel.target.name}
                                                    </div>
                                                </div>
                                            </div>
                                        </TooltipContent>
                                    </Tooltip>
                                );
                            })}
                        </div>
                    )}
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
                                    <span>{t('deleteView')}</span>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    {t('confirmDelete', { name: deleteConfirmation.viewName || '' })} 
                                    <br/>
                                    {t('thisActionCannotBeUndone')}
                                </p>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button variant="outline" size="sm" onClick={cancelDeleteView}>
                                        {t('cancel')}
                                    </Button>
                                    <Button variant="destructive" size="sm" onClick={confirmDeleteView}>
                                        {t('deleteConfirm')}
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

export default React.memo(ModelTree);