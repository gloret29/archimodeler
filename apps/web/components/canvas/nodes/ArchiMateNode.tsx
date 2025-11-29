import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import {
    User, Server, Database, Box, Layers,
    Zap, Target, Flag, Shield, FileText,
    Briefcase, Cpu, HardDrive, Truck,
    GitMerge, GitCommit, Folder, MapPin,
    Activity, Anchor, Award, Book, Circle, Hexagon
} from 'lucide-react';

const layerColors: Record<string, string> = {
    'Strategy': '#ffebd9', // Orange
    'Business': '#ffffb5', // Yellow
    'Application': '#b5ffff', // Cyan
    'Technology': '#b5ffb5', // Green
    'Physical': '#ccffcc', // Emerald/Green
    'Motivation': '#e6ccff', // Purple
    'Implementation & Migration': '#ffcccc', // Pink
    'Composite': '#f0f0f0', // Grey
};

const layerBorders: Record<string, string> = {
    'Strategy': '#ff9933',
    'Business': '#e6e600',
    'Application': '#00e6e6',
    'Technology': '#00e600',
    'Physical': '#00cc66',
    'Motivation': '#9933ff',
    'Implementation & Migration': '#ff6666',
    'Composite': '#999999',
};

const icons: Record<string, any> = {
    // Strategy
    'Resource': Database,
    'Capability': Zap,
    'CourseOfAction': Activity,
    'ValueStream': GitMerge,

    // Business
    'BusinessActor': User,
    'BusinessRole': User,
    'BusinessCollaboration': User,
    'BusinessInterface': Circle,
    'BusinessProcess': Activity,
    'BusinessFunction': Box,
    'BusinessInteraction': GitMerge,
    'BusinessEvent': Flag,
    'BusinessService': Briefcase,
    'BusinessObject': FileText,
    'Contract': FileText,
    'Representation': FileText,
    'Product': Box,

    // Application
    'ApplicationComponent': Box,
    'ApplicationCollaboration': Box,
    'ApplicationInterface': Circle,
    'ApplicationFunction': Box,
    'ApplicationInteraction': GitMerge,
    'ApplicationProcess': Activity,
    'ApplicationEvent': Flag,
    'ApplicationService': Server,
    'DataObject': FileText,

    // Technology
    'Node': Server,
    'Device': HardDrive,
    'SystemSoftware': Cpu,
    'TechnologyCollaboration': Server,
    'TechnologyInterface': Circle,
    'Path': GitMerge,
    'CommunicationNetwork': GitMerge,
    'TechnologyFunction': Box,
    'TechnologyProcess': Activity,
    'TechnologyInteraction': GitMerge,
    'TechnologyEvent': Flag,
    'TechnologyService': Server,
    'Artifact': FileText,

    // Physical
    'Equipment': HardDrive,
    'Facility': Box,
    'DistributionNetwork': GitMerge,
    'Material': Box,

    // Motivation
    'Stakeholder': User,
    'Driver': Target,
    'Assessment': FileText,
    'Goal': Target,
    'Outcome': Award,
    'Principle': Shield,
    'Requirement': FileText,
    'Constraint': Shield,
    'Meaning': Book,
    'Value': Award,

    // Implementation
    'WorkPackage': Briefcase,
    'Deliverable': Box,
    'ImplementationEvent': Flag,
    'Plateau': Layers,
    'Gap': Circle,

    // Composite
    'Grouping': Folder,
    'Location': MapPin,
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
