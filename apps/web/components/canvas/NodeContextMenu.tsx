"use client";

import React from 'react';
import { Edit2, Trash2, X } from 'lucide-react';

interface NodeContextMenuProps {
    position: { x: number; y: number };
    nodeData: {
        label: string;
        elementId?: string;
    };
    onRename: () => void;
    onRemoveFromView: () => void;
    onDeleteFromRepository: () => void;
    onClose: () => void;
}

export default function NodeContextMenu({
    position,
    nodeData,
    onRename,
    onRemoveFromView,
    onDeleteFromRepository,
    onClose
}: NodeContextMenuProps) {
    return (
        <>
            {/* Backdrop to close menu */}
            <div
                className="fixed inset-0 z-40"
                onClick={onClose}
            />

            {/* Context Menu */}
            <div
                className="fixed z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 min-w-[200px]"
                style={{
                    left: `${position.x}px`,
                    top: `${position.y}px`,
                }}
            >
                <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100">
                    {nodeData.label}
                </div>

                <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                        onRename();
                        onClose();
                    }}
                >
                    <Edit2 className="h-4 w-4 text-gray-600" />
                    Rename
                </button>

                <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-gray-100 flex items-center gap-2"
                    onClick={() => {
                        onRemoveFromView();
                        onClose();
                    }}
                >
                    <X className="h-4 w-4 text-orange-600" />
                    Remove from View
                </button>

                <div className="border-t border-gray-100 my-1" />

                <button
                    className="w-full px-3 py-2 text-sm text-left hover:bg-red-50 flex items-center gap-2 text-red-600"
                    onClick={() => {
                        onDeleteFromRepository();
                        onClose();
                    }}
                >
                    <Trash2 className="h-4 w-4" />
                    Delete from Repository
                </button>
            </div>
        </>
    );
}
