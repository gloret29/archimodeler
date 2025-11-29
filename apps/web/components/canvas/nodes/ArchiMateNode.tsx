import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Image from 'next/image';

// Map ArchiMate types to their SVG filenames
const svgMapping: Record<string, string> = {
    // Strategy
    'Resource': 'Resource.svg',
    'Capability': 'Capability.svg',
    'CourseOfAction': 'Course of Action.svg',
    'ValueStream': 'Value Stream.svg',

    // Business
    'BusinessActor': 'Business Actor.svg',
    'BusinessRole': 'Business Role.svg',
    'BusinessCollaboration': 'Business Collaboration.svg',
    'BusinessInterface': 'Business Interface.svg',
    'BusinessProcess': 'Business Process.svg',
    'BusinessFunction': 'Business Function.svg',
    'BusinessInteraction': 'Business Interaction.svg',
    'BusinessEvent': 'Business Event.svg',
    'BusinessService': 'Business Service.svg',
    'BusinessObject': 'Business Object.svg',
    'Contract': 'Contract.svg',
    'Representation': 'Representation.svg',
    'Product': 'Product.svg',

    // Application
    'ApplicationComponent': 'Application Component.svg',
    'ApplicationCollaboration': 'Application Collaboration.svg',
    'ApplicationInterface': 'Application Interface.svg',
    'ApplicationFunction': 'Application Function.svg',
    'ApplicationInteraction': 'Application Interaction.svg',
    'ApplicationProcess': 'Application Process.svg',
    'ApplicationEvent': 'Application Event.svg',
    'ApplicationService': 'Application Service.svg',
    'DataObject': 'DataObject.svg',

    // Technology
    'Node': 'Node.svg',
    'Device': 'Device.svg',
    'SystemSoftware': 'System Software.svg',
    'TechnologyCollaboration': 'Technology Collaboration.svg',
    'TechnologyInterface': 'Technology Interface.svg',
    'Path': 'Path.svg',
    'CommunicationNetwork': 'Communication Network.svg',
    'TechnologyFunction': 'Technology Function.svg',
    'TechnologyProcess': 'Technology Process.svg',
    'TechnologyInteraction': 'Technology Interaction.svg',
    'TechnologyEvent': 'Technology Event.svg',
    'TechnologyService': 'Technology Service.svg',
    'Artifact': 'Artifact.svg',

    // Physical
    'Equipment': 'Equipment.svg',
    'Facility': 'Facility.svg',
    'DistributionNetwork': 'Distribution Network.svg',
    'Material': 'Material.svg',

    // Motivation
    'Stakeholder': 'Stakeholder.svg',
    'Driver': 'Driver.svg',
    'Assessment': 'Assessment.svg',
    'Goal': 'Goal.svg',
    'Outcome': 'Outcome.svg',
    'Principle': 'Principle.svg',
    'Requirement': 'Requirement.svg',
    'Constraint': 'Constraint.svg',
    'Meaning': 'Meaning.svg',
    'Value': 'Value.svg',

    // Implementation
    'WorkPackage': 'Work Package.svg',
    'Deliverable': 'Deliverable.svg',
    'ImplementationEvent': 'Implementation Event.svg',
    'Plateau': 'Plateau.svg',
    'Gap': 'Gap.svg',

    // Composite
    'Grouping': 'Grouping.svg',
    'Location': 'Location.svg',
};

interface SelectedBy {
    name: string;
    color: string;
}

const ArchiMateNode = ({ data, selected }: NodeProps) => {
    const { label, type, selectedBy, style } = data as { 
        label: string; 
        type: string; 
        layer: string;
        selectedBy?: SelectedBy[];
        style?: {
            backgroundColor?: string;
            borderColor?: string;
            borderWidth?: number;
            fontSize?: number;
            fontColor?: string;
            opacity?: number;
        };
    };

    const svgFile = svgMapping[type];

    // Determine border style based on remote selection
    const isRemotelySelected = selectedBy && selectedBy.length > 0;
    const remoteColor = isRemotelySelected ? selectedBy[0].color : undefined;
    
    // Apply custom styles
    const nodeStyle: React.CSSProperties = {
        filter: selected 
            ? 'drop-shadow(0 0 4px #2563eb)' 
            : isRemotelySelected 
                ? `drop-shadow(0 0 4px ${remoteColor})` 
                : 'drop-shadow(0 1px 2px rgb(0 0 0 / 0.1))',
        backgroundColor: style?.backgroundColor,
        borderColor: style?.borderColor,
        borderWidth: style?.borderWidth !== undefined ? `${style.borderWidth}px` : undefined,
        borderStyle: style?.borderWidth !== undefined ? 'solid' : undefined,
        opacity: style?.opacity !== undefined ? style.opacity : 1,
    };
    
    const textStyle: React.CSSProperties = {
        fontSize: style?.fontSize !== undefined ? `${style.fontSize}px` : undefined,
        color: style?.fontColor,
    };
    
    return (
        <div className="relative group">
            <div
                className={`relative min-w-[150px] min-h-[60px] flex flex-col items-center justify-center transition-all`}
                style={nodeStyle}
            >
                {/* Anchor points on all 4 sides */}
                <Handle type="target" position={Position.Top} className="w-2 h-2 !bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity z-50" />
                <Handle type="source" position={Position.Right} className="w-2 h-2 !bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity z-50" />
                <Handle type="target" position={Position.Bottom} className="w-2 h-2 !bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity z-50" />
                <Handle type="source" position={Position.Left} className="w-2 h-2 !bg-gray-500 opacity-0 group-hover:opacity-100 transition-opacity z-50" />
                
                {svgFile ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={`/archimate-symbols/${svgFile}`} 
                            alt={type}
                            className="w-full h-full object-contain max-w-[180px] max-h-[100px]"
                            draggable={false}
                        />
                        <div className="absolute inset-0 flex items-center justify-center pt-6 px-2">
                            <span 
                                className="text-xs font-medium text-center break-words w-full line-clamp-2 pointer-events-none select-none"
                                style={textStyle}
                            >
                                {label}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-gray-400 bg-white rounded p-2 w-full h-full flex items-center justify-center">
                        {label}
                    </div>
                )}
            </div>
            
            {/* Remote Selection Badges */}
            {isRemotelySelected && (
                <div className="absolute -top-6 right-0 flex gap-1 z-50">
                    {selectedBy.map((user, i) => (
                        <div 
                            key={i}
                            className="px-1.5 py-0.5 rounded text-[10px] text-white font-bold shadow-sm whitespace-nowrap"
                            style={{ backgroundColor: user.color }}
                        >
                            {user.name}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default memo(ArchiMateNode);