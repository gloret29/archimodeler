"use client";

import React, { useState } from 'react';
import { useTabsStore, ViewTab } from '@/store/useTabsStore';
import { X, Plus, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import RenameTabDialog from './RenameTabDialog';
import { useTranslations } from 'next-intl';
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuTrigger,
} from "@/components/ui/context-menu";

interface ViewTabsProps {
    onNewTab?: () => void;
}

export default function ViewTabs({ onNewTab }: ViewTabsProps) {
    const t = useTranslations('Studio');
    const { tabs, activeTabId, setActiveTab, removeTab, updateTabName } = useTabsStore();
    const [renameDialogOpen, setRenameDialogOpen] = useState(false);
    const [tabToRename, setTabToRename] = useState<ViewTab | null>(null);

    const handleRename = (tabId: string, currentName: string) => {
        const tab = tabs.find(t => t.id === tabId);
        if (tab) {
            setTabToRename(tab);
            setRenameDialogOpen(true);
        }
    };

    const handleRenameConfirm = (newName: string) => {
        if (tabToRename) {
            updateTabName(tabToRename.id, newName);
            setTabToRename(null);
        }
    };

    if (tabs.length === 0) {
        return null;
    }

    return (
        <>
            <div className="flex items-center gap-1 bg-muted/50 border-b border-border px-2 h-10 overflow-x-auto">
                {tabs.map((tab) => (
                    <ContextMenu key={tab.id}>
                        <ContextMenuTrigger>
                            <div
                                className={cn(
                                    "group flex items-center gap-2 px-3 py-1.5 rounded-t-md border border-b-0 cursor-pointer transition-colors min-w-[120px] max-w-[200px]",
                                    activeTabId === tab.id
                                        ? "bg-background border-border"
                                        : "bg-muted/30 border-transparent hover:bg-muted/60"
                                )}
                                onClick={() => setActiveTab(tab.id)}
                                onDoubleClick={() => handleRename(tab.id, tab.viewName)}
                            >
                                <span className="text-sm font-medium truncate flex-1 flex items-center gap-1.5">
                                    <span className="truncate">{tab.viewName}</span>
                                    {tab.isModified && (
                                        <span 
                                            className="h-2 w-2 rounded-full bg-orange-500 flex-shrink-0 animate-pulse" 
                                            title={t('modified')}
                                            aria-label="Modified"
                                        />
                                    )}
                                </span>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeTab(tab.id);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 hover:bg-accent rounded p-0.5 transition-opacity"
                                    title={t('closeTab')}
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent>
                            <ContextMenuItem onClick={() => handleRename(tab.id, tab.viewName)}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                {t('rename')}
                            </ContextMenuItem>
                            <ContextMenuItem
                                onClick={() => removeTab(tab.id)}
                                className="text-destructive focus:text-destructive"
                            >
                                <X className="h-4 w-4 mr-2" />
                                {t('close')}
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                ))}

                {onNewTab && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onNewTab}
                        className="h-8 w-8 p-0 ml-1"
                        title={t('newView')}
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
            </div>

            <RenameTabDialog
                open={renameDialogOpen}
                currentName={tabToRename?.viewName || ''}
                onOpenChange={setRenameDialogOpen}
                onRename={handleRenameConfirm}
            />
        </>
    );
}
