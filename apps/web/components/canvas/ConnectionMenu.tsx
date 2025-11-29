import React from 'react';
import { RelationType } from '@/lib/metamodel';

interface ConnectionMenuProps {
    position: { x: number; y: number };
    relations: RelationType[];
    onSelect: (relation: RelationType) => void;
    onClose: () => void;
}

export default function ConnectionMenu({ position, relations, onSelect, onClose }: ConnectionMenuProps) {
    return (
        <div
            className="fixed z-50 bg-white rounded-md shadow-lg border border-gray-200 py-1 min-w-[150px]"
            style={{
                left: position.x,
                top: position.y,
            }}
        >
            <div className="px-3 py-2 text-xs font-semibold text-gray-500 border-b border-gray-100 mb-1">
                Create Relation
            </div>
            {relations.map((relation) => (
                <button
                    key={relation}
                    className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                    onClick={() => onSelect(relation)}
                >
                    {relation}
                </button>
            ))}
            <div className="border-t border-gray-100 mt-1 pt-1">
                <button
                    className="w-full text-left px-3 py-2 text-xs text-red-500 hover:bg-red-50"
                    onClick={onClose}
                >
                    Cancel
                </button>
            </div>
        </div>
    );
}
