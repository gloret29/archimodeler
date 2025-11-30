"use client";

import { ReactNode } from 'react';
import { UserInfo } from './UserInfo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

interface PageHeaderProps {
    title: string;
    description?: string;
    actions?: ReactNode;
    className?: string;
}

export function PageHeader({ title, description, actions, className = "" }: PageHeaderProps) {
    return (
        <header className={`border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50 ${className}`}>
            <div className="container mx-auto px-6 py-4">
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <h1 className="text-2xl font-bold">{title}</h1>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {actions}
                        <NotificationCenter />
                        <UserInfo />
                    </div>
                </div>
            </div>
        </header>
    );
}

