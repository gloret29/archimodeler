"use client";

import React, { Suspense } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import ModelingCanvas from '@/components/canvas/ModelingCanvas';
import Stencil from '@/components/canvas/Stencil';
import CoachChat from '@/components/ai/CoachChat';
import { useSearchParams } from 'next/navigation';
import ModelTree from '@/components/studio/ModelTree';

import { Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/navigation';

function StudioContent() {
    const searchParams = useSearchParams();

    return (
        <div className="flex flex-col h-screen w-full overflow-hidden bg-muted/40">
            <header className="h-14 border-b border-border bg-background flex items-center px-4 justify-between shrink-0">
                <div className="flex items-center gap-4">
                    <Link href="/home">
                        <Button variant="ghost" size="icon" title="Back to Home">
                            <Home className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div className="h-6 w-px bg-border" />
                    <h1 className="font-semibold text-sm">ArchiModeler Studio</h1>
                </div>
                <div>
                    {/* Placeholder for future toolbar items */}
                </div>
            </header>
            <div className="flex flex-1 overflow-hidden">
                <Stencil />
                <main className="flex-1 relative">
                    <ModelingCanvas packageId={searchParams.get('packageId')} />
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
        <ReactFlowProvider>
            <Suspense fallback={<div className="flex h-screen w-full overflow-hidden bg-muted/40" />}>
                <StudioContent />
            </Suspense>
        </ReactFlowProvider>
    );
}
