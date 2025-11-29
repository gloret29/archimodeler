"use client";

import React from 'react';
import { ReactFlowInstance, Node, Edge } from '@xyflow/react';
import { Download, ChevronDown, Clipboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import html2canvas from 'html2canvas';

interface ExportButtonProps {
    reactFlowInstance: ReactFlowInstance | null;
    viewName?: string;
    reactFlowWrapper?: React.RefObject<HTMLDivElement>;
}

export default function ExportButton({ reactFlowInstance, viewName = 'view', reactFlowWrapper }: ExportButtonProps) {
    const [isOpen, setIsOpen] = React.useState(false);

    // Helper function to capture canvas with CSS color fixes
    const captureCanvas = async (element: HTMLElement) => {
        // Suppress console errors for unsupported CSS color functions BEFORE html2canvas runs
        const originalError = console.error;
        const originalWarn = console.warn;
        
        const errorFilter = (...args: any[]) => {
            const message = args[0]?.toString() || '';
            if (message.includes('lab') || message.includes('oklch') || 
                message.includes('color function') || message.includes('unsupported color') ||
                message.includes('Attempting to parse')) {
                return;
            }
            originalError.apply(console, args);
        };
        
        const warnFilter = (...args: any[]) => {
            const message = args[0]?.toString() || '';
            if (message.includes('lab') || message.includes('oklch') || 
                message.includes('color function') || message.includes('unsupported color') ||
                message.includes('Attempting to parse')) {
                return;
            }
            originalWarn.apply(console, args);
        };
        
        // Override console methods
        console.error = errorFilter;
        console.warn = warnFilter;

        try {
            // Create a clone with all computed styles as inline styles
            const clone = element.cloneNode(true) as HTMLElement;
            clone.style.position = 'absolute';
            clone.style.left = '-9999px';
            clone.style.top = '0';
            clone.style.width = element.offsetWidth + 'px';
            clone.style.height = element.offsetHeight + 'px';
            
            // Remove all class attributes to prevent CSS parsing
            const removeClasses = (el: Element) => {
                if (el instanceof HTMLElement) {
                    el.removeAttribute('class');
                }
                Array.from(el.children).forEach(removeClasses);
            };
            removeClasses(clone);
            
            document.body.appendChild(clone);

            // Apply computed RGB colors to all elements in the clone
            const walkOriginal = (original: Element, cloned: Element) => {
                try {
                    const computed = window.getComputedStyle(original);
                    const clonedEl = cloned as HTMLElement;
                    
                    // Copy all computed styles as inline styles (already in RGB)
                    clonedEl.style.backgroundColor = computed.backgroundColor;
                    clonedEl.style.color = computed.color;
                    clonedEl.style.borderColor = computed.borderColor;
                    clonedEl.style.borderWidth = computed.borderWidth;
                    clonedEl.style.borderStyle = computed.borderStyle;
                    clonedEl.style.width = computed.width;
                    clonedEl.style.height = computed.height;
                    clonedEl.style.padding = computed.padding;
                    clonedEl.style.margin = computed.margin;
                    clonedEl.style.fontSize = computed.fontSize;
                    clonedEl.style.fontFamily = computed.fontFamily;
                    clonedEl.style.fontWeight = computed.fontWeight;
                    clonedEl.style.display = computed.display;
                    clonedEl.style.position = computed.position;
                    clonedEl.style.left = computed.left;
                    clonedEl.style.top = computed.top;
                    clonedEl.style.transform = computed.transform;
                    clonedEl.style.opacity = computed.opacity;
                } catch (e) {
                    // Ignore errors
                }

                // Recursively process children
                const originalChildren = Array.from(original.children);
                const clonedChildren = Array.from(cloned.children);
                
                for (let i = 0; i < originalChildren.length && i < clonedChildren.length; i++) {
                    walkOriginal(originalChildren[i], clonedChildren[i]);
                }
            };

            walkOriginal(element, clone);

            // Capture with html2canvas
            const canvas = await html2canvas(clone, {
                backgroundColor: '#ffffff',
                scale: 2,
                useCORS: true,
                logging: false,
                allowTaint: false,
            });
            
            // Cleanup
            document.body.removeChild(clone);
            
            // Restore console functions
            console.error = originalError;
            console.warn = originalWarn;
            
            return canvas;
        } catch (error) {
            // Restore console functions on error
            console.error = originalError;
            console.warn = originalWarn;
            
            // Cleanup on error
            const clone = document.body.querySelector('[style*="left: -9999px"]') as HTMLElement;
            if (clone && clone.parentNode) {
                document.body.removeChild(clone);
            }
            throw error;
        }
    };

    const exportToSVG = () => {
        if (!reactFlowInstance) {
            alert('Canvas not ready');
            return;
        }

        try {
            const nodes = reactFlowInstance.getNodes();
            const edges = reactFlowInstance.getEdges();

            if (nodes.length === 0) {
                alert('No elements to export');
                return;
            }

            // Calculate the bounding box of all nodes
            let minX = Infinity;
            let minY = Infinity;
            let maxX = -Infinity;
            let maxY = -Infinity;

            nodes.forEach(node => {
                const x = node.position.x;
                const y = node.position.y;
                const width = node.width || 150;
                const height = node.height || 60;

                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x + width);
                maxY = Math.max(maxY, y + height);
            });

            // Add padding
            const padding = 50;
            minX -= padding;
            minY -= padding;
            maxX += padding;
            maxY += padding;

            const width = maxX - minX;
            const height = maxY - minY;

            // Create SVG manually
            let svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
  <defs>
    <style>
      .node-text { font-family: Arial, sans-serif; font-size: 12px; }
      .edge-path { fill: none; stroke: #333; stroke-width: 2; }
    </style>
  </defs>
  <g transform="translate(${-minX}, ${-minY})">`;

            // Add edges first (so they appear behind nodes)
            edges.forEach(edge => {
                const sourceNode = nodes.find(n => n.id === edge.source);
                const targetNode = nodes.find(n => n.id === edge.target);
                
                if (sourceNode && targetNode) {
                    const sx = sourceNode.position.x + (sourceNode.width || 150) / 2;
                    const sy = sourceNode.position.y + (sourceNode.height || 60) / 2;
                    const tx = targetNode.position.x + (targetNode.width || 150) / 2;
                    const ty = targetNode.position.y + (targetNode.height || 60) / 2;
                    
                    svgContent += `
    <line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" class="edge-path" />`;
                    
                    if (edge.label) {
                        const midX = (sx + tx) / 2;
                        const midY = (sy + ty) / 2;
                        svgContent += `
    <text x="${midX}" y="${midY}" class="node-text" text-anchor="middle" dy="5">${edge.label}</text>`;
                    }
                }
            });

            // Add nodes
            nodes.forEach(node => {
                const x = node.position.x;
                const y = node.position.y;
                const width = node.width || 150;
                const height = node.height || 60;
                const label = node.data?.label || node.id;
                
                // Node rectangle
                svgContent += `
    <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="white" stroke="#333" stroke-width="2" rx="4" />`;
                
                // Node label
                svgContent += `
    <text x="${x + width / 2}" y="${y + height / 2}" class="node-text" text-anchor="middle" dy="5">${label}</text>`;
            });

            svgContent += `
  </g>
</svg>`;

            // Create blob and download
            const blob = new Blob([svgContent], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${viewName}.svg`;
            link.click();
            URL.revokeObjectURL(url);

            setIsOpen(false);
        } catch (error) {
            console.error('Failed to export SVG:', error);
            alert('Failed to export SVG');
        }
    };

    const exportToPNG = async () => {
        if (!reactFlowInstance || !reactFlowWrapper?.current) {
            alert('Canvas not ready');
            return;
        }

        try {
            const nodes = reactFlowInstance.getNodes();
            
            if (nodes.length === 0) {
                alert('No elements to export');
                return;
            }

            // Find the React Flow viewport element
            const reactFlowViewport = reactFlowWrapper.current.querySelector('.react-flow__viewport');
            if (!reactFlowViewport) {
                throw new Error('React Flow viewport not found');
            }

            // Use html2canvas to capture the viewport
            const canvas = await html2canvas(reactFlowViewport as HTMLElement, {
                backgroundColor: '#ffffff',
                scale: 2, // Higher quality
                useCORS: true,
                logging: false,
                onclone: (clonedDoc) => {
                    // Fix CSS color functions that html2canvas doesn't support
                    // Convert lab(), oklch(), etc. to RGB
                    const allElements = clonedDoc.querySelectorAll('*');
                    allElements.forEach((el) => {
                        const htmlEl = el as HTMLElement;
                        const computedStyle = window.getComputedStyle(htmlEl);
                        
                        // Get computed colors and apply them directly
                        try {
                            const color = computedStyle.color;
                            const bgColor = computedStyle.backgroundColor;
                            const borderColor = computedStyle.borderColor;
                            
                            // Only override if the computed style is valid
                            if (color && !color.includes('lab') && !color.includes('oklch')) {
                                htmlEl.style.color = color;
                            }
                            if (bgColor && !bgColor.includes('lab') && !bgColor.includes('oklch')) {
                                htmlEl.style.backgroundColor = bgColor;
                            }
                            if (borderColor && !borderColor.includes('lab') && !borderColor.includes('oklch')) {
                                htmlEl.style.borderColor = borderColor;
                            }
                        } catch (e) {
                            // Ignore errors for elements that can't have styles
                        }
                    });
                },
            });

            // Convert to blob and download
            canvas.toBlob((blob) => {
                if (!blob) {
                    throw new Error('Failed to create blob');
                }

                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `${viewName}.png`;
                link.click();
                URL.revokeObjectURL(url);
            }, 'image/png');

            setIsOpen(false);
        } catch (error) {
            console.error('Failed to export PNG:', error);
            alert('Failed to export PNG: ' + (error as Error).message);
        }
    };

    const copyToClipboard = async () => {
        if (!reactFlowInstance || !reactFlowWrapper?.current) {
            alert('Canvas not ready');
            return;
        }

        try {
            const nodes = reactFlowInstance.getNodes();
            
            if (nodes.length === 0) {
                alert('No elements to copy');
                return;
            }

            // Find the React Flow viewport element
            const reactFlowViewport = reactFlowWrapper.current.querySelector('.react-flow__viewport');
            if (!reactFlowViewport) {
                throw new Error('React Flow viewport not found');
            }

            // Use helper function to capture with CSS color fixes
            const canvas = await captureCanvas(reactFlowViewport as HTMLElement);

            // Convert canvas to blob
            canvas.toBlob(async (blob) => {
                if (!blob) {
                    throw new Error('Failed to create blob');
                }

                try {
                    // Use Clipboard API to copy image
                    const item = new ClipboardItem({ 'image/png': blob });
                    await navigator.clipboard.write([item]);
                    
                    // Show success feedback
                    setIsOpen(false);
                    // You could add a toast notification here
                    alert('Image copied to clipboard!');
                } catch (clipboardError) {
                    // Fallback: try to copy as data URL
                    console.warn('ClipboardItem not supported, trying fallback:', clipboardError);
                    canvas.toBlob((fallbackBlob) => {
                        if (!fallbackBlob) return;
                        const reader = new FileReader();
                        reader.onloadend = async () => {
                            try {
                                await navigator.clipboard.writeText(reader.result as string);
                                alert('Image data copied to clipboard!');
                            } catch (err) {
                                console.error('Failed to copy to clipboard:', err);
                                alert('Failed to copy to clipboard. Please use Export instead.');
                            }
                        };
                        reader.readAsDataURL(fallbackBlob);
                    }, 'image/png');
                }
            }, 'image/png');
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            alert('Failed to copy to clipboard: ' + (error as Error).message);
        }
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    disabled={!reactFlowInstance}
                >
                    <Download className="h-4 w-4" />
                    Export
                    <ChevronDown className="h-3 w-3" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
                <div className="space-y-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">
                        Export Format
                    </div>
                    <button
                        onClick={exportToSVG}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                    >
                        Export as SVG
                    </button>
                    <button
                        onClick={exportToPNG}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm"
                    >
                        Export as PNG
                    </button>
                    <div className="border-t border-border my-1" />
                    <button
                        onClick={copyToClipboard}
                        className="w-full px-2 py-1.5 text-sm text-left hover:bg-accent rounded-sm flex items-center gap-2"
                    >
                        <Clipboard className="h-3.5 w-3.5" />
                        Copy to Clipboard
                    </button>
                </div>
            </PopoverContent>
        </Popover>
    );
}

