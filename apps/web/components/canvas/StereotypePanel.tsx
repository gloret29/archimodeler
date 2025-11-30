"use client";

import React, { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Tag, X } from 'lucide-react';
import { api } from '@/lib/api/client';
import { useDialog } from '@/contexts/DialogContext';
import { useTranslations } from 'next-intl';

interface Stereotype {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    applicableTo: "elements" | "relationships" | "both";
    propertiesSchema?: any;
}

interface StereotypePanelProps {
    selectedNodes: Node[];
    selectedEdges: Edge[];
    onUpdate?: () => void;
}

export default function StereotypePanel({ selectedNodes, selectedEdges, onUpdate }: StereotypePanelProps) {
    const { alert } = useDialog();
    const [stereotypes, setStereotypes] = useState<Stereotype[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedStereotype, setSelectedStereotype] = useState<Stereotype | null>(null);
    const [extendedProperties, setExtendedProperties] = useState<Record<string, any>>({});
    const [elementStereotypes, setElementStereotypes] = useState<Record<string, Stereotype[]>>({});

    useEffect(() => {
        fetchStereotypes();
    }, []);

    useEffect(() => {
        if (selectedNodes.length > 0) {
            fetchElementStereotypes();
        }
    }, [selectedNodes]);

    const fetchStereotypes = async () => {
        try {
            const data = await api.get<Stereotype[]>('/stereotypes');
            setStereotypes(data);
        } catch (error) {
            console.error('Failed to fetch stereotypes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchElementStereotypes = async () => {
        const stereotypesMap: Record<string, Stereotype[]> = {};
        for (const node of selectedNodes) {
            const elementId = (node.data?.elementId as string) || node.id;
            try {
                const data = await api.get<Array<{ stereotype: Stereotype }>>(`/stereotypes/elements/${elementId}`);
                stereotypesMap[elementId] = data.map((es) => es.stereotype);
            } catch (error) {
                console.error(`Failed to fetch stereotypes for element ${elementId}:`, error);
            }
        }
        setElementStereotypes(stereotypesMap);
    };

    const handleApplyStereotype = (stereotype: Stereotype) => {
        setSelectedStereotype(stereotype);
        setExtendedProperties({});
        setIsDialogOpen(true);
    };

    const handleConfirmApply = async () => {
        if (!selectedStereotype) return;

        const applicableStereotypes = stereotypes.filter(s => 
            selectedStereotype.applicableTo === 'both' || 
            (selectedNodes.length > 0 && selectedStereotype.applicableTo === 'elements') ||
            (selectedEdges.length > 0 && selectedStereotype.applicableTo === 'relationships')
        );

        try {
            // Apply to selected nodes
            for (const node of selectedNodes) {
                const elementId = node.data?.elementId || node.id;
                await api.post(`/stereotypes/elements/${elementId}/apply/${selectedStereotype.id}`, {
                    extendedProperties
                });
            }

            // Apply to selected edges
            for (const edge of selectedEdges) {
                const relationshipId = edge.data?.relationshipId || edge.id;
                await api.post(`/stereotypes/relationships/${relationshipId}/apply/${selectedStereotype.id}`, {
                    extendedProperties
                });
            }

            setIsDialogOpen(false);
            setSelectedStereotype(null);
            setExtendedProperties({});
            fetchElementStereotypes();
            onUpdate?.();
        } catch (error) {
            console.error('Failed to apply stereotype:', error);
            await alert({
                title: 'Error',
                message: 'Failed to apply stereotype',
                type: 'error',
            });
        }
    };

    const handleRemoveStereotype = async (elementId: string, stereotypeId: string) => {
        try {
            await api.delete(`/stereotypes/elements/${elementId}/remove/${stereotypeId}`);
            fetchElementStereotypes();
            onUpdate?.();
        } catch (error) {
            console.error('Failed to remove stereotype:', error);
            await alert({
                title: 'Error',
                message: 'Failed to remove stereotype',
                type: 'error',
            });
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Stereotypes</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">Loading...</p>
                </CardContent>
            </Card>
        );
    }

    const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
    const applicableStereotypes = stereotypes.filter(s => {
        if (s.applicableTo === 'both') return true;
        if (selectedNodes.length > 0 && s.applicableTo === 'elements') return true;
        if (selectedEdges.length > 0 && s.applicableTo === 'relationships') return true;
        return false;
    });

    return (
        <>
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Tag className="h-4 w-4" />
                        Stereotypes
                    </CardTitle>
                    <CardDescription>
                        {hasSelection
                            ? `${selectedNodes.length} node(s) and ${selectedEdges.length} edge(s) selected`
                            : 'Select elements or relationships to apply stereotypes'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {!hasSelection ? (
                        <p className="text-sm text-muted-foreground text-center py-4">
                            Select elements or relationships to apply stereotypes
                        </p>
                    ) : (
                        <>
                            {/* Current Stereotypes */}
                            {selectedNodes.length > 0 && (
                                <div className="space-y-2">
                                    <Label className="text-xs font-semibold">Applied Stereotypes</Label>
                                    {selectedNodes.map((node) => {
                                        const elementId = (node.data?.elementId as string) || node.id;
                                        const nodeStereotypes = elementStereotypes[elementId] || [];
                                        return (
                                            <div key={elementId} className="space-y-1">
                                                <p className="text-xs text-muted-foreground">{(node.data?.label as string) || node.id}</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {nodeStereotypes.length === 0 ? (
                                                        <span className="text-xs text-muted-foreground">No stereotypes</span>
                                                    ) : (
                                                        nodeStereotypes.map((stereotype) => (
                                                            <Badge
                                                                key={stereotype.id}
                                                                variant="outline"
                                                                className="flex items-center gap-1"
                                                                style={{ borderColor: stereotype.color || '#3b82f6' }}
                                                            >
                                                                {stereotype.name}
                                                                <X
                                                                    className="h-3 w-3 cursor-pointer"
                                                                    onClick={() => handleRemoveStereotype(elementId, stereotype.id)}
                                                                />
                                                            </Badge>
                                                        ))
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}

                            {/* Available Stereotypes */}
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold">Available Stereotypes</Label>
                                <div className="space-y-1">
                                    {applicableStereotypes.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">No applicable stereotypes</p>
                                    ) : (
                                        applicableStereotypes.map((stereotype) => (
                                            <Button
                                                key={stereotype.id}
                                                variant="outline"
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() => handleApplyStereotype(stereotype)}
                                            >
                                                <div
                                                    className="w-3 h-3 rounded mr-2"
                                                    style={{ backgroundColor: stereotype.color || '#3b82f6' }}
                                                />
                                                {stereotype.name}
                                            </Button>
                                        ))
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Dialog for Extended Properties */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Apply Stereotype: {selectedStereotype?.name}</DialogTitle>
                        <DialogDescription>
                            {selectedStereotype?.description || 'Apply this stereotype to the selected elements'}
                        </DialogDescription>
                    </DialogHeader>
                    {selectedStereotype?.propertiesSchema && (
                        <div className="space-y-4 py-4">
                            {Object.entries(selectedStereotype.propertiesSchema.properties || {}).map(([key, schema]: [string, any]) => (
                                <div key={key} className="space-y-2">
                                    <Label htmlFor={key}>{key}</Label>
                                    <Input
                                        id={key}
                                        value={extendedProperties[key] || ''}
                                        onChange={(e) =>
                                            setExtendedProperties({ ...extendedProperties, [key]: e.target.value })
                                        }
                                        placeholder={schema.description || `Enter ${key}`}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleConfirmApply}>Apply</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

