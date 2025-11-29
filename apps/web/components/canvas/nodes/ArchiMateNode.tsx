import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { User, Server, Database, Box } from 'lucide-react';

const layerColors: Record<string, string> = {
    'Business': '#ffffb5', // Yellow
    'Application': '#b5ffff', // Cyan
    'Technology': '#b5ffb5', // Green
};

const layerBorders: Record<string, string> = {
    'Business': '#e6e600',
    'Application': '#00e6e6',
    'Technology': '#00e600',
};

const icons: Record<string, any> = {
    'BusinessActor': User,
    'BusinessRole': User,
    'BusinessProcess': Box,
    'ApplicationComponent': Box,
    'ApplicationService': Server,
    'Node': Server,
    'Device': Database,
};

const ArchiMateNode = ({ data, selected }: NodeProps) => {
    const { label, type, layer } = data as { label: string; type: string; layer: string };

    const Icon = icons[type] || Box;
    const bgColor = layerColors[layer] || '#ffffff';
    const borderColor = layerBorders[layer] || '#000000';

    return (
        <div
            className={`px-4 py-2 shadow-md rounded-md border-2 min-w-[150px] flex items-center gap-2 transition-all`}
            style={{
                backgroundColor: bgColor,
                borderColor: selected ? '#2563eb' : borderColor,
                borderStyle: 'solid',
            }}
        >
            <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-500" />
            <Icon className="w-5 h-5 text-gray-700" />
            <div className="text-sm font-medium text-gray-900">{label}</div>
            <Handle type="source" position={Position.Bottom} className="w-2 h-2 !bg-gray-500" />
        </div>
    );
};

export default memo(ArchiMateNode);
