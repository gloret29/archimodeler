"use client";

import React, { Suspense } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import ModelingCanvas from '@/components/canvas/ModelingCanvas';
import Stencil from '@/components/canvas/Stencil';
import CoachChat from '@/components/ai/CoachChat';
import { useSearchParams } from 'next/navigation';
import ModelTree from '@/components/studio/ModelTree';

function StudioContent() {
    const searchParams = useSearchParams();

    return (
        <>
            <Stencil />
            <main className="flex-1 relative">
                <ModelingCanvas packageId={searchParams.get('packageId')} />
                <CoachChat />
            </main>
            <Suspense fallback={<div className="w-80 bg-white border-l border-gray-200" />}>
                <ModelTree />
            </Suspense>
        </>
    );
}

export default function StudioPage() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50">
            <ReactFlowProvider>
                <Suspense fallback={<div className="flex h-screen w-full overflow-hidden bg-gray-50" />}>
                    <StudioContent />
                </Suspense>
            </ReactFlowProvider>
        </div>
    );
}
