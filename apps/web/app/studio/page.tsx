"use client";

import React from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import ModelingCanvas from '@/components/canvas/ModelingCanvas';
import Stencil from '@/components/canvas/Stencil';
import CoachChat from '@/components/ai/CoachChat';

import ModelTree from '@/components/studio/ModelTree';

import { Suspense } from 'react';

export default function StudioPage() {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-gray-50">
            <ReactFlowProvider>
                <Stencil />
                <main className="flex-1 relative">
                    <ModelingCanvas />
                    <CoachChat />
                </main>
                <Suspense fallback={<div className="w-80 bg-white border-l border-gray-200" />}>
                    <ModelTree />
                </Suspense>
            </ReactFlowProvider>
        </div>
    );
}
