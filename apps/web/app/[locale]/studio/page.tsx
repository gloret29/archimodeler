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
import { useCollaborationGraphQL } from '@/hooks/useCollaborationGraphQL';
import { useChatNotificationsGraphQL } from '@/hooks/useChatNotificationsGraphQL';
import { useChatContext } from '@/contexts/ChatContext';
import { UserChatGraphQL } from '@/components/collaboration/UserChatGraphQL';
import { API_CONFIG } from '@/lib/api/config';
import { useDialog } from '@/contexts/DialogContext';

import { Home, Save, Package, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/navigation';
import { UserInfo } from '@/components/common/UserInfo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import FormattingPanel from '@/components/canvas/FormattingPanel';
import { Node, Edge } from '@xyflow/react';
import { useToast } from '@/components/ui/use-toast-simple';

/**
 * Composant principal de la page Studio.
 * 
 * Gère l'interface complète du studio de modélisation incluant :
 * - Gestion des onglets de vues
 * - Canvas collaboratif
 * - Repository et palette
 * - Panneaux de propriétés et commentaires
 * - Sauvegarde avec raccourci CTRL+S
 * 
 * @component StudioContent
 * @returns {JSX.Element} Le composant Studio complet
 */
function StudioContent() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get('packageId');
    const t = useTranslations('Studio');
    const router = useRouter();
    const { alert, prompt } = useDialog();
    const { toast } = useToast();
    const { tabs, activeTabId, addTab, addTabWithPersistence, saveActiveTab, markTabAsModified, markTabAsSaved } = useTabsStore();
    const [isSaving, setIsSaving] = React.useState(false);
    const [repositoryWidth, setRepositoryWidth] = React.useState(320); // Default width: 320px (w-80)
    const [isResizing, setIsResizing] = React.useState(false);
    const [currentCanvasContent, setCurrentCanvasContent] = React.useState<{ nodes: any[]; edges: any[] } | null>(null);
    const [selectedElement, setSelectedElement] = React.useState<{ id: string; name: string; type: string } | null>(null);
    const [selectedRelationship, setSelectedRelationship] = React.useState<{ id: string; name: string; type: string } | null>(null);
    const [selectedNodes, setSelectedNodes] = React.useState<any[]>([]);
    const [selectedEdges, setSelectedEdges] = React.useState<any[]>([]);
    const canvasSetNodesRef = React.useRef<((nodes: Node[]) => void) | null>(null);
    const canvasSetEdgesRef = React.useRef<((edges: Edge[]) => void) | null>(null);
    const restoreSelectionRef = React.useRef<(() => void) | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const isInitialLoadRef = React.useRef<boolean>(true);
    const lastContentRef = React.useRef<string>('');
    const handleSaveRef = React.useRef<(() => Promise<void>) | null>(null);

    // Check authentication FIRST, before rendering anything
    React.useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/';
            return;
        }
        setIsAuthenticated(true);
    }, []);

    const handleElementSelect = React.useCallback((id: string, name: string, type: string) => {
        setSelectedElement({ id, name, type });
        setSelectedRelationship(null); // Deselect relationship when selecting element
    }, []);

    // Get the active tab
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const [isLoadingPackage, setIsLoadingPackage] = React.useState(false);

    // Reset initial load flag when active tab changes
    React.useEffect(() => {
        if (activeTab) {
            isInitialLoadRef.current = true;
            lastContentRef.current = ''; // Reset content comparison
            // Reset after a short delay to allow initial content to load
            const timer = setTimeout(() => {
                isInitialLoadRef.current = false;
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [activeTab?.id]);

    // Handle content change with memoization
    const handleContentChange = React.useCallback((content: { nodes: any[]; edges: any[] }) => {
        // Create a stable string representation to compare
        const contentString = JSON.stringify({
            nodes: content.nodes.map(n => ({ id: n.id, position: n.position, data: n.data })),
            edges: content.edges.map(e => ({ id: e.id, source: e.source, target: e.target }))
        });
        
        // Only update if content actually changed
        if (contentString !== lastContentRef.current) {
            lastContentRef.current = contentString;
            setCurrentCanvasContent(content);
            // Mark tab as modified when content changes (but not on initial load)
            if (activeTab?.isPersisted && !isInitialLoadRef.current) {
                markTabAsModified(activeTab.id);
            }
        }
    }, [activeTab?.id, activeTab?.isPersisted, markTabAsModified]);

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
                isModified: false,
            });
        }
    }, [searchParams, tabs.length, addTab, router]);

    // Get collaboration state for the active tab
    const [currentUser, setCurrentUser] = React.useState<{ id: string; name: string; color: string } | null>(null);
    const { chatTarget, isChatOpen, closeChat } = useChatContext();

    // Fetch current user info
    React.useEffect(() => {
        const fetchCurrentUser = async () => {
            try {
                const token = API_CONFIG.getAuthToken();
                if (!token) {
                    console.warn('No access token found');
                    return;
                }

                const res = await API_CONFIG.fetch('/users/me');
                if (res.ok) {
                    const user = await res.json();
                    // Generate a color based on user ID for consistency
                    const colors = ['#4ECDC4', '#45B7D1', '#FF6B6B', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
                    const colorIndex = parseInt(user.id.slice(-1), 16) % colors.length;
                    setCurrentUser({
                        id: user.id,
                        name: user.name || user.email || 'User',
                        color: colors[colorIndex] ?? colors[0] ?? '#4ECDC4',
                    });
                } else if (res.status === 401) {
                    console.error('Unauthorized - token may be expired');
                    localStorage.removeItem('accessToken');
                    router.push('/');
                }
            } catch (error) {
                console.error('Failed to fetch current user:', error);
                // Don't set a fallback user - collaboration requires a valid authenticated user
                setCurrentUser(null);
            }
        };
        fetchCurrentUser();
    }, [router]);

    const { users, isConnected, notifyViewSaved } = useCollaborationGraphQL({
        viewId: activeTab?.viewId || '',
        user: currentUser && currentUser.name && currentUser.name !== 'User' && currentUser.id
            ? currentUser 
            : { id: '', name: '', color: '#4ECDC4' },
        onNodeChanged: () => { },
        onEdgeChanged: () => { },
    });

    // Enable chat notifications
    useChatNotificationsGraphQL({
        currentUser,
        enabled: !!currentUser && !!activeTab,
        activeUsers: users,
    });

    const handleNewTab = async () => {
        const packageId = searchParams.get('packageId');

        if (!packageId) {
            console.error('No packageId provided in URL');
            await alert({
                title: t('error') || 'Error',
                message: t('noPackageId'),
                type: 'error',
            });
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
            await alert({
                title: t('error') || 'Error',
                message: t('failedToCreateView', { error: errorMessage }),
                type: 'error',
            });

            // Fallback to non-persisted tab
            addTab({
                id: `tab-${Date.now()}`,
                viewId: `view-${Date.now()}`,
                viewName: `New View ${tabs.length + 1}`,
                packageId,
                isPersisted: false,
                isModified: false,
            });
        }
    };

    const handleSave = React.useCallback(async () => {
        if (!activeTab) {
            return;
        }

        if (!activeTab.isPersisted) {
            await alert({
                title: t('warning') || 'Warning',
                message: t('viewNotSaved'),
                type: 'warning',
            });
            return;
        }

        setIsSaving(true);
        try {
            // Get actual canvas content
            if (!currentCanvasContent) {
                await alert({
                    title: t('warning') || 'Warning',
                    message: t('noContentToSave'),
                    type: 'warning',
                });
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
            
            // Show success toast
            toast({
                title: t('viewSaved') || 'View saved!',
                description: activeTab.viewName || '',
            });
            
            // Notify other users via WebSocket
            if (currentUser && notifyViewSaved) {
                notifyViewSaved({
                    id: currentUser.id,
                    name: currentUser.name,
                });
            }
        } catch (error: any) {
            console.error('Failed to save view:', error);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToSave', { error: error.message || 'Unknown error' }),
                type: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    }, [activeTab, currentCanvasContent, saveActiveTab, currentUser, notifyViewSaved, alert, t, toast]);

    // Keep handleSave ref up to date
    React.useEffect(() => {
        handleSaveRef.current = handleSave;
    }, [handleSave]);

    // Handle CTRL+S keyboard shortcut for saving
    React.useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            // Check for CTRL+S (Windows/Linux) or CMD+S (Mac)
            if ((event.ctrlKey || event.metaKey) && event.key === 's') {
                event.preventDefault(); // Prevent browser's default save dialog
                if (activeTab && !isSaving && handleSaveRef.current) {
                    handleSaveRef.current();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [activeTab?.id, isSaving]);

    const handleSaveAs = async () => {
        if (!activeTab || !packageId) {
            return;
        }

        // Get actual canvas content
        if (!currentCanvasContent) {
            await alert({
                title: t('warning') || 'Warning',
                message: t('noContentToSave'),
                type: 'warning',
            });
            return;
        }

        const newName = await prompt({
            title: t('saveAsTitle') || 'Save View As',
            label: t('saveAsLabel') || 'New View Name',
            placeholder: t('saveAsPlaceholder') || 'Enter new view name',
            defaultValue: `${activeTab.viewName} (Copy)`,
            required: true,
        });

        if (!newName || !newName.trim()) {
            return;
        }

        setIsSaving(true);
        try {
            const content = {
                nodes: currentCanvasContent.nodes,
                edges: currentCanvasContent.edges,
                savedAt: new Date().toISOString(),
            };

            // Create new view with the new name
            const newTab = await addTabWithPersistence(newName.trim(), packageId, activeTab.folderId);
            
            // Save content to the new view
            const { viewsApi } = await import('@/lib/api/views');
            await viewsApi.update(newTab.viewId, { content });
            
            console.log('✓ View saved as:', newName);
            
            // Notify other users via WebSocket
            if (currentUser && notifyViewSaved) {
                notifyViewSaved({
                    id: currentUser.id,
                    name: currentUser.name,
                });
            }
        } catch (error: any) {
            console.error('Failed to save view as:', error);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToSave', { error: error.message || 'Unknown error' }),
                type: 'error',
            });
        } finally {
            setIsSaving(false);
        }
    };

    // Check authentication synchronously before rendering (client-side only)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/';
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-muted-foreground">{t('redirectingToLogin')}</p>
                    </div>
                </div>
            );
        }
    }

    // Don't render anything until we've checked authentication
    if (isAuthenticated === null) {
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-muted-foreground">{t('checkingAuth')}</p>
                    </div>
                </div>
            );
    }

    // Show package selector if no packageId is selected
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
                            title={t('saveView', { viewName: activeTab.viewName })}
                        >
                            <Save className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                        </Button>
                    )}
                    {activeTab && (
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={handleSaveAs}
                            disabled={isSaving}
                            title={t('saveAs') || 'Save As'}
                        >
                            <Copy className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                        </Button>
                    )}
                    {activeTab && currentUser && (
                        <ActiveUsers users={users} isConnected={isConnected} currentUser={currentUser} />
                    )}
                    <NotificationCenter />
                    <UserInfo />
                </div>
            </header>

            {/* Tab bar */}
            <ViewTabs onNewTab={handleNewTab} />

            {/* Formatting Toolbar */}
                        {currentCanvasContent && canvasSetNodesRef.current && canvasSetEdgesRef.current && (
                            <FormattingPanel
                                selectedNodes={selectedNodes}
                                selectedEdges={selectedEdges}
                                onUpdateNodes={(nodes) => {
                                    if (canvasSetNodesRef.current) {
                                        canvasSetNodesRef.current(nodes);
                                    }
                                    setCurrentCanvasContent({ nodes, edges: currentCanvasContent.edges });
                                }}
                                onUpdateEdges={(edges) => {
                                    if (canvasSetEdgesRef.current) {
                                        canvasSetEdgesRef.current(edges);
                                    }
                                    setCurrentCanvasContent({ nodes: currentCanvasContent.nodes, edges });
                                }}
                                allNodes={currentCanvasContent.nodes}
                                allEdges={currentCanvasContent.edges}
                                onMaintainSelection={() => {
                                    if (restoreSelectionRef.current) {
                                        restoreSelectionRef.current();
                                    }
                                }}
                            />
                        )}

            <div className="flex flex-1 overflow-hidden">
                <Stencil />
                <main className="flex-1 relative">
                    {activeTab ? (
                        <CollaborativeCanvas
                            key={activeTab.id}
                            viewId={activeTab.viewId}
                            viewName={activeTab.viewName}
                            packageId={activeTab.packageId}
                            currentUser={currentUser}
                            onContentChange={handleContentChange}
                            onViewSaved={(savedBy) => {
                                // Mark tab as saved for all users
                                markTabAsSaved(activeTab.id);
                            }}
                            onSelectionChange={(selectedNodes, selectedEdges) => {
                                setSelectedNodes(selectedNodes);
                                setSelectedEdges(selectedEdges);
                            }}
                            onSetNodesAndEdges={(setNodes, setEdges) => {
                                canvasSetNodesRef.current = setNodes;
                                canvasSetEdgesRef.current = setEdges;
                            }}
                            onRestoreSelection={(restoreFn) => {
                                restoreSelectionRef.current = restoreFn;
                            }}
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
                            <p className="text-muted-foreground">{t('noViewOpen')}</p>
                            <Button onClick={handleNewTab}>
                                {t('openNewView')}
                            </Button>
                        </div>
                        </div>
                    )}
                    <CoachChat sidebarWidth={repositoryWidth} />
                </main>
                
                {/* Global Chat Dialog */}
                {currentUser && chatTarget && (
                    <UserChatGraphQL
                        currentUser={currentUser}
                        targetUser={{ id: chatTarget.id, name: chatTarget.name, color: chatTarget.color }}
                        isOpen={isChatOpen}
                        onClose={closeChat}
                    />
                )}
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
                                onRelationshipSelect={(relationshipId, relationshipName, relationshipType) => {
                                    setSelectedRelationship({ id: relationshipId, name: relationshipName, type: relationshipType });
                                    setSelectedElement(null); // Deselect element when selecting relationship
                                }}
                            />
                        </div>
                        <PropertiesPanel
                            selectedElementId={selectedElement?.id || null}
                            selectedElementName={selectedElement?.name}
                            selectedElementType={selectedElement?.type}
                            selectedRelationshipId={selectedRelationship?.id || null}
                            selectedRelationshipName={selectedRelationship?.name}
                            selectedRelationshipType={selectedRelationship?.type}
                            currentUserId={currentUser?.id}
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
