"use client";

import React, { Suspense, useEffect } from 'react';
import Stencil from '@/components/canvas/Stencil';
import CoachChat from '@/components/ai/CoachChat';
import { useSearchParams } from 'next/navigation';
import ModelTree from '@/components/studio/ModelTree';
import PropertiesPanel from '@/components/studio/PropertiesPanel';
import PackageSelector from '@/components/studio/PackageSelector';
import { useTranslations } from 'next-intl';
import { useTabsStore } from '@/store/useTabsStore';
import ViewTabs from '@/components/studio/ViewTabs';
import CollaborativeCanvas from '@/components/canvas/CollaborativeCanvas';
import ActiveUsers from '@/components/collaboration/ActiveUsers';
import { useCollaboration } from '@/hooks/useCollaboration';

import { Home, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/navigation';

function StudioContent() {
    const searchParams = useSearchParams();
    const t = useTranslations('Studio');
    const { tabs, activeTabId, addTab, addTabWithPersistence, saveActiveTab } = useTabsStore();
    const [isSaving, setIsSaving] = React.useState(false);
    const [repositoryWidth, setRepositoryWidth] = React.useState(320); // Default width: 320px (w-80)
    const [isResizing, setIsResizing] = React.useState(false);
    const [currentCanvasContent, setCurrentCanvasContent] = React.useState<{ nodes: any[]; edges: any[] } | null>(null);
    const [selectedElement, setSelectedElement] = React.useState<{ id: string; name: string; type: string } | null>(null);
    const [selectedRelationship, setSelectedRelationship] = React.useState<{ id: string; name: string; type: string } | null>(null);

    const handleElementSelect = React.useCallback((id: string, name: string, type: string) => {
        setSelectedElement({ id, name, type });
        setSelectedRelationship(null); // Deselect relationship when selecting element
    }, []);

    // Get the active tab
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const [isLoadingPackage, setIsLoadingPackage] = React.useState(false);
    const router = useRouter();

    // Handle repository resizing
    React.useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing) return;
            
            const newWidth = window.innerWidth - e.clientX;
            const minWidth = 200;
            const maxWidth = window.innerWidth * 0.6;
            
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setRepositoryWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
        };

        if (isResizing) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };
    }, [isResizing]);

    // Initialize with a tab if packageId is provided
    useEffect(() => {
        const packageId = searchParams.get('packageId');

        if (!packageId) {
            // No packageId in URL, show package selector
            setIsLoadingPackage(false);
            return;
        }

        // PackageId exists, initialize with a tab if needed
        if (tabs.length === 0) {
            addTab({
                id: `tab-${Date.now()}`,
                viewId: `view-${packageId}`,
                viewName: 'Main View',
                packageId,
                isPersisted: false,
            });
        }
    }, [searchParams, tabs.length, addTab, router]);

    // Get collaboration state for the active tab
    const currentUser = {
        id: Math.random().toString(36).substring(7),
        name: `User ${Math.floor(Math.random() * 1000)}`,
        color: '#4ECDC4',
    };

    const { users, isConnected } = useCollaboration({
        viewId: activeTab?.viewId || '',
        user: currentUser,
        onNodeChanged: () => { },
        onEdgeChanged: () => { },
    });

    const handleNewTab = async () => {
        const packageId = searchParams.get('packageId');

        if (!packageId) {
            console.error('No packageId provided in URL');
            alert('Error: No package ID found. Please open the studio with a valid package.');
            return;
        }

        try {
            await addTabWithPersistence(
                `New View ${tabs.length + 1}`,
                packageId
            );
        } catch (error: any) {
            console.error('Failed to create new view:', error);
            const errorMessage = error.message || 'Unknown error';
            alert(`Failed to create view: ${errorMessage}\n\nPlease check the console for details.`);

            // Fallback to non-persisted tab
            addTab({
                id: `tab-${Date.now()}`,
                viewId: `view-${Date.now()}`,
                viewName: `New View ${tabs.length + 1}`,
                packageId,
                isPersisted: false,
            });
        }
    };

    const handleSave = async () => {
        if (!activeTab) {
            return;
        }

        if (!activeTab.isPersisted) {
            alert('This view is not saved. Please create a new view with the + button.');
            return;
        }

        setIsSaving(true);
        try {
            // Get actual canvas content
            if (!currentCanvasContent) {
                alert('No content to save. Please add some elements to the view first.');
                setIsSaving(false);
                return;
            }

            const content = {
                nodes: currentCanvasContent.nodes,
                edges: currentCanvasContent.edges,
                savedAt: new Date().toISOString(),
            };

            console.log('Saving view with content:', {
                nodesCount: content.nodes.length,
                edgesCount: content.edges.length
            });
            await saveActiveTab(content);
            console.log('✓ View saved successfully');
            // Show success feedback (you could use a toast notification here)
        } catch (error: any) {
            console.error('Failed to save view:', error);
            alert(`Failed to save: ${error.message || 'Unknown error'}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Show package selector if no packageId is selected
    const packageId = searchParams.get('packageId');
    if (!packageId) {
        return <PackageSelector />;
    }

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-muted/40">
            <header className="h-14 border-b border-border bg-background flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/home">
                        <Button variant="ghost" size="icon" title={t('backToHome')}>
                            <Home className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-border" />
                    <h1 className="font-semibold text-sm">{t('title')}</h1>
                </div>
                <div className="flex items-center gap-2">
                    {activeTab && activeTab.isPersisted && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSave}
                            disabled={isSaving}
                            title={`Save ${activeTab.viewName}`}
                        >
                            <Save className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                        </Button>
                    )}
                    {activeTab && (
                        <ActiveUsers users={users} isConnected={isConnected} />
                    )}
                </div>
            </header>

            {/* Tab bar */}
            <ViewTabs onNewTab={handleNewTab} />

            <div className="flex flex-1 overflow-hidden">
                <Stencil />
                <main className="flex-1 relative">
                    {activeTab ? (
                        <CollaborativeCanvas
                            key={activeTab.id}
                            viewId={activeTab.viewId}
                            viewName={activeTab.viewName}
                            packageId={activeTab.packageId}
                            onContentChange={setCurrentCanvasContent}
                            onNodeClick={(nodeId, elementId, elementName, elementType) => {
                                if (elementId && nodeId) {
                                    setSelectedElement({ id: elementId, name: elementName, type: elementType });
                                    setSelectedRelationship(null); // Deselect relationship when selecting element
                                } else {
                                    // Deselect when clicking on empty canvas
                                    setSelectedElement(null);
                                }
                            }}
                            onEdgeClick={(edgeId, relationshipId, relationshipName, relationshipType) => {
                                console.log('Edge clicked:', { edgeId, relationshipId, relationshipName, relationshipType });
                                if (edgeId) {
                                    // Use edgeId as relationshipId if relationshipId is not available
                                    const id = relationshipId || edgeId;
                                    setSelectedRelationship({ id, name: relationshipName, type: relationshipType });
                                    setSelectedElement(null); // Deselect element when selecting relationship
                                } else {
                                    // Deselect when clicking on empty canvas
                                    setSelectedRelationship(null);
                                }
                            }}
                        />
                    ) : (
                        <div className="flex items-center justify-center h-full">
                            <div className="text-center space-y-4">
                                <p className="text-muted-foreground">No view open</p>
                                <Button onClick={handleNewTab}>
                                    Open a new view
                                </Button>
                            </div>
                        </div>
                    )}
                    <CoachChat />
                </main>
                {/* Resizer */}
                <div
                    className={`w-1 bg-border hover:bg-primary/50 cursor-col-resize transition-colors ${
                        isResizing ? 'bg-primary' : ''
                    }`}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        setIsResizing(true);
                    }}
                    style={{ userSelect: 'none' }}
                />
                <Suspense fallback={<div className="bg-background border-l border-border" style={{ width: `${repositoryWidth}px` }} />}>
                    <div style={{ width: `${repositoryWidth}px` }} className="bg-background border-l border-border h-full flex-shrink-0 flex flex-col">
                        <div className="flex-1 overflow-hidden">
                            <ModelTree 
                                packageId={packageId}
                                onElementSelect={handleElementSelect} 
                            />
                        </div>
                        <PropertiesPanel
                            selectedElementId={selectedElement?.id || null}
                            selectedElementName={selectedElement?.name}
                            selectedElementType={selectedElement?.type}
                            selectedRelationshipId={selectedRelationship?.id || null}
                            selectedRelationshipName={selectedRelationship?.name}
                            selectedRelationshipType={selectedRelationship?.type}
                        />
                    </div>
                </Suspense>
            </div>
        </div>
    );
}

export default function StudioPage() {
    return (
        <Suspense fallback={<div className="flex h-screen w-full overflow-hidden bg-muted/40" />}>
            <StudioContent />
        </Suspense>
    );
}
