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
import { useChatNotifications } from '@/hooks/useChatNotifications';
import { useChatContext } from '@/contexts/ChatContext';
import { UserChat } from '@/components/collaboration/UserChat';

import { Home, Save, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/navigation';

function StudioContent() {
    const searchParams = useSearchParams();
    const packageId = searchParams.get('packageId');
    const t = useTranslations('Studio');
    const router = useRouter();
    const { tabs, activeTabId, addTab, addTabWithPersistence, saveActiveTab, markTabAsModified } = useTabsStore();
    const [isSaving, setIsSaving] = React.useState(false);
    const [repositoryWidth, setRepositoryWidth] = React.useState(320); // Default width: 320px (w-80)
    const [isResizing, setIsResizing] = React.useState(false);
    const [currentCanvasContent, setCurrentCanvasContent] = React.useState<{ nodes: any[]; edges: any[] } | null>(null);
    const [selectedElement, setSelectedElement] = React.useState<{ id: string; name: string; type: string } | null>(null);
    const [selectedRelationship, setSelectedRelationship] = React.useState<{ id: string; name: string; type: string } | null>(null);
    const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null);
    const isInitialLoadRef = React.useRef<boolean>(true);
    const lastContentRef = React.useRef<string>('');

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
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    console.warn('No access token found');
                    return;
                }

                const res = await fetch('http://localhost:3002/users/me', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const user = await res.json();
                    // Generate a color based on user ID for consistency
                    const colors = ['#4ECDC4', '#45B7D1', '#FF6B6B', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
                    const colorIndex = parseInt(user.id.slice(-1), 16) % colors.length;
                    setCurrentUser({
                        id: user.id,
                        name: user.name || user.email || 'User',
                        color: colors[colorIndex],
                    });
                } else if (res.status === 401) {
                    console.error('Unauthorized - token may be expired');
                    localStorage.removeItem('accessToken');
                    router.push('/');
                }
            } catch (error) {
                console.error('Failed to fetch current user:', error);
                // Fallback to random user
                setCurrentUser({
                    id: Math.random().toString(36).substring(7),
                    name: 'User',
                    color: '#4ECDC4',
                });
            }
        };
        fetchCurrentUser();
    }, [router]);

    const { users, isConnected } = useCollaboration({
        viewId: activeTab?.viewId || '',
        user: currentUser && currentUser.name && currentUser.name !== 'User' 
            ? currentUser 
            : currentUser || { id: '', name: 'User', color: '#4ECDC4' },
        onNodeChanged: () => { },
        onEdgeChanged: () => { },
    });

    // Enable chat notifications
    useChatNotifications({
        currentUser,
        enabled: !!currentUser && !!activeTab,
        activeUsers: users,
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
                isModified: false,
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

    // Check authentication synchronously before rendering (client-side only)
    if (typeof window !== 'undefined') {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/';
            return (
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <p className="text-muted-foreground">Redirecting to login...</p>
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
                    <p className="text-muted-foreground">Checking authentication...</p>
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
                            title={`Save ${activeTab.viewName}`}
                        >
                            <Save className={`h-5 w-5 ${isSaving ? 'animate-pulse' : ''}`} />
                        </Button>
                    )}
                    {activeTab && currentUser && (
                        <ActiveUsers users={users} isConnected={isConnected} currentUser={currentUser} />
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
                            onContentChange={handleContentChange}
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
                
                {/* Global Chat Dialog */}
                {currentUser && chatTarget && (
                    <UserChat
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
