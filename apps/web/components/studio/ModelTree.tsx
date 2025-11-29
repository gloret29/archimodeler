"use client";

import React, { useEffect, useState } from 'react';
import {
    ChevronRight, ChevronDown, Folder, FileText,
    Layout, Box, Search, Trash2, Edit2, FolderPlus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useRouter, useSearchParams } from 'next/navigation';

interface Element {
    id: string;
    name: string;
    conceptType: {
        name: string;
        category: string;
    };
}

interface FolderType {
    id: string;
    name: string;
    parentId: string | null;
    children: FolderType[];
    elements: Element[];
    views: ViewType[];
}

interface ViewType {
    id: string;
    name: string;
}

export default function ModelTree() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [folders, setFolders] = useState<FolderType[]>([]);
    const [elements, setElements] = useState<Element[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({
        'repository': true,
    });
    const [searchTerm, setSearchTerm] = useState('');

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
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 5000);
        return () => clearInterval(interval);
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
        }
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

    const renderFolder = (folder: FolderType): React.ReactElement => {
        const isExpanded = expanded[folder.id];

        return (
            <div key={folder.id} className="ml-4">
                <div
                    className="flex items-center gap-1 p-1.5 hover:bg-gray-100 rounded-md cursor-pointer text-sm group"
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
                    {isExpanded ? <ChevronDown className="h-4 w-4 text-gray-500" /> : <ChevronRight className="h-4 w-4 text-gray-500" />}
                    <Folder className="h-4 w-4 text-yellow-500" />
                    <span className="truncate flex-1">{folder.name}</span>

                    <div className="opacity-0 group-hover:opacity-100 flex gap-1 bg-white/80 rounded px-1">
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
                            <FolderPlus className="h-3.5 w-3.5 text-blue-600" />
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
                            <Edit2 className="h-3.5 w-3.5 text-gray-600" />
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
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                    </div>
                </div>

                {isExpanded && (
                    <div className="border-l border-gray-200 ml-2 pl-2">
                        {folder.children?.map(renderFolder)}

                        {folder.views?.map((view: ViewType) => (
                            <div
                                key={view.id}
                                className="flex items-center gap-2 p-1.5 rounded-md cursor-pointer text-sm hover:bg-gray-100"
                                onClick={() => router.push(`/studio?viewId=${view.id}`)}
                            >
                                <Layout className="h-3.5 w-3.5 text-blue-500" />
                                <span className="truncate">{view.name}</span>
                            </div>
                        ))}

                        {folder.elements?.map((el: Element) => (
                            <div
                                key={el.id}
                                className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-grab text-sm group"
                                draggable
                                onDragStart={(e) => {
                                    e.dataTransfer.setData('application/reactflow', JSON.stringify({
                                        type: el.conceptType.name,
                                        layer: el.conceptType.category,
                                        label: el.name,
                                        existingId: el.id
                                    }));
                                }}
                            >
                                <Box className="h-3.5 w-3.5 text-gray-400" />
                                <span className="truncate flex-1">{el.name}</span>
                                <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                    <button
                                        className="p-0.5 hover:bg-gray-200 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameElement(el.id, el.name);
                                        }}
                                        title="Rename"
                                    >
                                        <Edit2 className="h-3 w-3 text-gray-600" />
                                    </button>
                                    <button
                                        className="p-0.5 hover:bg-red-100 rounded"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteElement(el.id, el.name);
                                        }}
                                        title="Delete"
                                    >
                                        <Trash2 className="h-3 w-3 text-red-600" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const rootElements = elements.filter((el: Element) => !folders.some((f: FolderType) => f.elements?.some((fe: Element) => fe.id === el.id)));

    return (
        <aside className="w-80 bg-white border-l border-gray-200 h-full flex flex-col">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
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
                {folders.map(renderFolder)}

                <div className="mt-4">
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 px-2">Uncategorized Elements</h3>
                    {rootElements.map((el: Element) => (
                        <div
                            key={el.id}
                            className="flex items-center gap-2 p-1 rounded-md hover:bg-gray-100 cursor-grab text-sm ml-2 group"
                            draggable
                            onDragStart={(e) => {
                                e.dataTransfer.setData('application/reactflow', JSON.stringify({
                                    type: el.conceptType.name,
                                    layer: el.conceptType.category,
                                    label: el.name,
                                    existingId: el.id
                                }));
                            }}
                        >
                            <Box className="h-3.5 w-3.5 text-gray-400" />
                            <span className="truncate flex-1">{el.name}</span>
                            <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                                <button
                                    className="p-0.5 hover:bg-gray-200 rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRenameElement(el.id, el.name);
                                    }}
                                    title="Rename"
                                >
                                    <Edit2 className="h-3 w-3 text-gray-600" />
                                </button>
                                <button
                                    className="p-0.5 hover:bg-red-100 rounded"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteElement(el.id, el.name);
                                    }}
                                    title="Delete"
                                >
                                    <Trash2 className="h-3 w-3 text-red-600" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </aside>
    );
}
