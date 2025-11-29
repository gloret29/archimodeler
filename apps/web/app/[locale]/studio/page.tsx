"use client";

import React, { Suspense, useEffect } from 'react';
import Stencil from '@/components/canvas/Stencil';
import CoachChat from '@/components/ai/CoachChat';
import { useSearchParams } from 'next/navigation';
import ModelTree from '@/components/studio/ModelTree';
import { useTranslations } from 'next-intl';
import { useTabsStore } from '@/store/useTabsStore';
import ViewTabs from '@/components/studio/ViewTabs';
import CollaborativeCanvas from '@/components/canvas/CollaborativeCanvas';
import ActiveUsers from '@/components/collaboration/ActiveUsers';
import { useCollaboration } from '@/hooks/useCollaboration';

import { Home, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useRouter } from '@/navigation';

function StudioContent() {
    const searchParams = useSearchParams();
    const t = useTranslations('Studio');
    const { tabs, activeTabId, addTab, addTabWithPersistence, saveActiveTab } = useTabsStore();
    const [isSaving, setIsSaving] = React.useState(false);

    // Get the active tab
    const activeTab = tabs.find((tab) => tab.id === activeTabId);
    const [isLoadingPackage, setIsLoadingPackage] = React.useState(false);
    const router = useRouter();

    // Initialize with a tab if packageId is provided, or fetch/create default package
    useEffect(() => {
        const packageId = searchParams.get('packageId');

        if (!packageId) {
            // No packageId in URL, fetch or create a default package
            setIsLoadingPackage(true);
            const token = localStorage.getItem('accessToken');

            fetch('http://localhost:3002/model/packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            })
                .then(res => res.json())
                .then(packages => {
                    if (packages && packages.length > 0) {
                        // Use the first available package
                        const defaultPackage = packages[0];
                        router.push(`/studio?packageId=${defaultPackage.id}`);
                    } else {
                        // Create a default package
                        return fetch('http://localhost:3002/model/packages', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${token}`
                            },
                            body: JSON.stringify({
                                name: 'Default Package',
                                description: 'Automatically created default package'
                            })
                        })
                            .then(res => res.json())
                            .then(newPackage => {
                                router.push(`/studio?packageId=${newPackage.id}`);
                            });
                    }
                })
                .catch(err => {
                    console.error('Failed to fetch/create package:', err);
                    alert('Failed to initialize workspace. Please try again or contact support.');
                })
                .finally(() => {
                    setIsLoadingPackage(false);
                });
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
            // TODO: Get actual canvas content from React Flow
            const content = {
                nodes: [],
                edges: [],
                savedAt: new Date().toISOString(),
            };

            await saveActiveTab(content);
        } catch (error: any) {
            console.error('Failed to save view:', error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    // Show loading state while initializing workspace
    if (isLoadingPackage) {
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
                </header>
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-center space-y-4">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                        <p className="text-muted-foreground">Initializing workspace...</p>
                    </div>
                </div>
            </div>
        );
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
                <Suspense fallback={<div className="w-80 bg-background border-l border-border" />}>
                    <ModelTree />
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
