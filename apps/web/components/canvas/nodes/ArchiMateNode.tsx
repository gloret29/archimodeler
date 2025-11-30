import React, { memo, useState, useEffect } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import Image from 'next/image';
import { api } from '@/lib/api/client';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    const { label, type, selectedBy, style, elementId, commentCount, hasUnresolvedComments } = data as { 
        label: string; 
        type: string; 
        layer: string;
        elementId?: string;
        selectedBy?: SelectedBy[];
        commentCount?: number;
        hasUnresolvedComments?: boolean;
        style?: {
            backgroundColor?: string;
            borderColor?: string;
            borderWidth?: number;
            fontSize?: number;
            fontColor?: string;
            opacity?: number;
        };
    };

    const [stereotypes, setStereotypes] = useState<Array<{ name: string }>>([]);

    // Fetch stereotypes for this element
    useEffect(() => {
        if (!elementId) return;

        const fetchStereotypes = async () => {
            try {
                const data = await api.get<Array<{ stereotype: { name: string } }>>(`/stereotypes/elements/${elementId}`);
                setStereotypes(data.map((es) => ({ name: es.stereotype.name })));
            } catch (error) {
                console.error('Failed to fetch stereotypes:', error);
            }
        };

        fetchStereotypes();

        // Listen for stereotype updates
        const handleUpdate = (event: CustomEvent) => {
            if (event.detail.elementId === elementId) {
                fetchStereotypes();
            }
        };

        window.addEventListener('element-stereotype-updated', handleUpdate as EventListener);
        return () => {
            window.removeEventListener('element-stereotype-updated', handleUpdate as EventListener);
        };
    }, [elementId]);

    const svgFile = svgMapping[type];

    // Format stereotype names
    const formatStereotypes = () => {
        if (stereotypes.length === 0) {
            return null;
        }
        return stereotypes.map(s => s.name).join(', ');
    };

    // Determine border style based on remote selection
    const isRemotelySelected = selectedBy && selectedBy.length > 0;
    const remoteColor = isRemotelySelected && selectedBy[0] ? selectedBy[0].color : undefined;
    
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
    
    // Determine text color - use custom color if provided, otherwise use theme-aware default
    const getTextColor = () => {
        if (style?.fontColor) {
            return style.fontColor;
        }
        // Default to black for light mode, white for dark mode
        // We'll use CSS variables that adapt to theme
        return undefined; // Let CSS classes handle it
    };
    
    const textStyle: React.CSSProperties = {
        fontSize: style?.fontSize !== undefined ? `${style.fontSize}px` : undefined,
        color: getTextColor(),
    };
    
    return (
        <div className="relative group">
            <div
                className={`relative min-w-[150px] min-h-[60px] flex flex-col items-center justify-center transition-all`}
                style={nodeStyle}
            >
                {/* Anchor points on all 4 sides - each position has both source and target handles */}
                {/* Top */}
                <Handle 
                    id="top-source" 
                    type="source" 
                    position={Position.Top} 
                    className="w-3 h-3 !bg-blue-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
                    isConnectable={true}
                />
                <Handle 
                    id="top-target" 
                    type="target" 
                    position={Position.Top} 
                    className="w-3 h-3 !bg-green-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ top: -6, left: '50%', transform: 'translateX(-50%)' }}
                    isConnectable={true}
                />
                {/* Right */}
                <Handle 
                    id="right-source" 
                    type="source" 
                    position={Position.Right} 
                    className="w-3 h-3 !bg-blue-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                    isConnectable={true}
                />
                <Handle 
                    id="right-target" 
                    type="target" 
                    position={Position.Right} 
                    className="w-3 h-3 !bg-green-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ right: -6, top: '50%', transform: 'translateY(-50%)' }}
                    isConnectable={true}
                />
                {/* Bottom */}
                <Handle 
                    id="bottom-source" 
                    type="source" 
                    position={Position.Bottom} 
                    className="w-3 h-3 !bg-blue-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
                    isConnectable={true}
                />
                <Handle 
                    id="bottom-target" 
                    type="target" 
                    position={Position.Bottom} 
                    className="w-3 h-3 !bg-green-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ bottom: -6, left: '50%', transform: 'translateX(-50%)' }}
                    isConnectable={true}
                />
                {/* Left */}
                <Handle 
                    id="left-source" 
                    type="source" 
                    position={Position.Left} 
                    className="w-3 h-3 !bg-blue-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
                    isConnectable={true}
                />
                <Handle 
                    id="left-target" 
                    type="target" 
                    position={Position.Left} 
                    className="w-3 h-3 !bg-green-500 opacity-40 hover:opacity-100 group-hover:opacity-100 transition-opacity z-50 !border-2 !border-white cursor-crosshair pointer-events-auto" 
                    style={{ left: -6, top: '50%', transform: 'translateY(-50%)' }}
                    isConnectable={true}
                />
                
                {svgFile ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                        <img 
                            src={`/archimate-symbols/${svgFile}`} 
                            alt={type}
                            className="w-full h-full object-contain max-w-[180px] max-h-[100px] dark:invert"
                            draggable={false}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pt-6 px-2">
                            {stereotypes.length > 0 && (
                                <span 
                                    className={`text-[10px] font-semibold text-center break-words w-full pointer-events-none select-none ${!style?.fontColor ? 'text-black dark:text-white' : ''}`}
                                    style={{
                                        ...textStyle,
                                        textShadow: !style?.fontColor 
                                            ? '0 1px 3px rgba(255, 255, 255, 0.8), 0 0 6px rgba(255, 255, 255, 0.6), -1px -1px 2px rgba(0, 0, 0, 0.3), 1px 1px 2px rgba(0, 0, 0, 0.3)' 
                                            : undefined,
                                    }}
                                >
                                    &lt;&lt;{formatStereotypes()}&gt;&gt;
                                </span>
                            )}
                            <span 
                                className={`text-xs font-medium text-center break-words w-full ${stereotypes.length > 0 ? 'line-clamp-1' : 'line-clamp-2'} pointer-events-none select-none ${!style?.fontColor ? 'text-black dark:text-white' : ''}`}
                                style={{
                                    ...textStyle,
                                    textShadow: !style?.fontColor 
                                        ? '0 1px 3px rgba(255, 255, 255, 0.8), 0 0 6px rgba(255, 255, 255, 0.6), -1px -1px 2px rgba(0, 0, 0, 0.3), 1px 1px 2px rgba(0, 0, 0, 0.3)' 
                                        : undefined,
                                }}
                            >
                                {label}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className="border-2 border-border bg-background rounded p-2 w-full h-full flex flex-col items-center justify-center">
                        {stereotypes.length > 0 && (
                            <span 
                                className={`text-[10px] font-semibold text-center break-words w-full pointer-events-none select-none opacity-80 ${!style?.fontColor ? 'text-foreground' : ''}`}
                                style={textStyle}
                            >
                                &lt;&lt;{formatStereotypes()}&gt;&gt;
                            </span>
                        )}
                        <span 
                            className={`text-xs font-medium text-center break-words w-full pointer-events-none select-none ${!style?.fontColor ? 'text-foreground' : ''}`}
                            style={textStyle}
                        >
                            {label}
                        </span>
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
            
            {/* Comment Badge */}
            {commentCount !== undefined && commentCount > 0 && (
                <div className="absolute -top-2 -right-2 z-50">
                    <Badge 
                        variant={hasUnresolvedComments ? "destructive" : "secondary"}
                        className="h-5 w-5 p-0 flex items-center justify-center rounded-full shadow-md"
                        title={`${commentCount} comment${commentCount > 1 ? 's' : ''}`}
                    >
                        <MessageSquare className="h-3 w-3" />
                    </Badge>
                </div>
            )}
        </div>
    );
};

export default memo(ArchiMateNode);