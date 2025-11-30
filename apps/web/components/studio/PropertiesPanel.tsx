"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Tag, ChevronDown, ChevronRight, Save, ChevronUp } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { api } from '@/lib/api/client';
import { useTranslations } from 'next-intl';
import { useDialog } from '@/contexts/DialogContext';

interface Stereotype {
    id: string;
    name: string;
    description?: string;
    color?: string;
    propertiesSchema?: any; // JSON schema defining the properties
}

interface ElementStereotype {
    id: string;
    stereotype: Stereotype;
    extendedProperties?: any;
}

interface RelationshipStereotype {
    id: string;
    stereotype: Stereotype;
    extendedProperties?: any;
}

interface PropertySchema {
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
    label: string;
    key: string;
    required?: boolean;
    options?: { value: string; label: string }[]; // For select type
    placeholder?: string;
    defaultValue?: any;
}

interface PropertiesPanelProps {
    selectedElementId: string | null;
    selectedElementName?: string;
    selectedElementType?: string;
    selectedRelationshipId?: string | null;
    selectedRelationshipName?: string;
    selectedRelationshipType?: string;
}

export default function PropertiesPanel({ 
    selectedElementId, 
    selectedElementName, 
    selectedElementType,
    selectedRelationshipId,
    selectedRelationshipName,
    selectedRelationshipType
}: PropertiesPanelProps) {
    const t = useTranslations('Properties');
    const { alert, confirm } = useDialog();
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [stereotypes, setStereotypes] = useState<Stereotype[]>([]);
    const [appliedStereotypes, setAppliedStereotypes] = useState<ElementStereotype[] | RelationshipStereotype[]>([]);
    const [loading, setLoading] = useState(false);
    const [selectedStereotypeId, setSelectedStereotypeId] = useState<string>("");
    const [expandedStereotypes, setExpandedStereotypes] = useState<Set<string>>(new Set());
    const [stereotypeProperties, setStereotypeProperties] = useState<Record<string, any>>({});
    const isRelationship = !!selectedRelationshipId;

    useEffect(() => {
        if (selectedElementId) {
            fetchStereotypes();
            fetchElementStereotypes();
            setSelectedStereotypeId("");
        } else if (selectedRelationshipId) {
            // Only fetch stereotypes if we have a valid relationshipId (not just edgeId)
            // For now, we'll show the relationship info even without stereotypes
            try {
                fetchApplicableRelationshipStereotypes();
                fetchRelationshipStereotypes();
            } catch (error) {
                console.warn('Could not fetch relationship stereotypes, relationship may not be persisted yet');
                setAppliedStereotypes([]);
                setStereotypes([]);
            }
            setSelectedStereotypeId("");
        } else {
            setAppliedStereotypes([]);
            setStereotypes([]);
            setSelectedStereotypeId("");
        }
    }, [selectedElementId, selectedRelationshipId]);

    const fetchStereotypes = async () => {
        if (!selectedElementId) return;
        
        try {
            // Fetch only stereotypes applicable to this element's type
            const data = await api.get<Stereotype[]>(`/stereotypes/elements/${selectedElementId}/applicable`);
            setStereotypes(data);
        } catch (error) {
            console.error('Failed to fetch stereotypes:', error);
        }
    };

    const fetchApplicableRelationshipStereotypes = async () => {
        if (!selectedRelationshipId) return;
        
        try {
            // Fetch only stereotypes applicable to this relationship's type
            const data = await api.get<Stereotype[]>(`/stereotypes/relationships/${selectedRelationshipId}/applicable`);
            setStereotypes(data);
        } catch (error: any) {
            if (error.status === 404) {
                // Relationship not found in database
                console.log('Relationship not found, cannot fetch applicable stereotypes');
            } else {
                console.error('Failed to fetch relationship stereotypes:', error);
            }
            setStereotypes([]);
        }
    };

    const fetchElementStereotypes = async () => {
        if (!selectedElementId) return;
        
        setLoading(true);
        try {
            const data = await api.get<ElementStereotype[]>(`/stereotypes/elements/${selectedElementId}`);
            console.log('Fetched element stereotypes:', data);
            setAppliedStereotypes(data);
            // Initialize properties state from extendedProperties
            const props: Record<string, any> = {};
            data.forEach((es: ElementStereotype) => {
                props[es.stereotype.id] = es.extendedProperties || {};
                console.log(`Stereotype ${es.stereotype.name} propertiesSchema:`, es.stereotype.propertiesSchema);
            });
            setStereotypeProperties(props);
        } catch (error) {
            console.error('Failed to fetch element stereotypes:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchRelationshipStereotypes = async () => {
        if (!selectedRelationshipId) return;
        
        setLoading(true);
        try {
            const data = await api.get<RelationshipStereotype[]>(`/stereotypes/relationships/${selectedRelationshipId}`);
            console.log('Fetched relationship stereotypes:', data);
            setAppliedStereotypes(data);
            // Initialize properties state from extendedProperties
            const props: Record<string, any> = {};
            data.forEach((rs: RelationshipStereotype) => {
                props[rs.stereotype.id] = rs.extendedProperties || {};
                console.log(`Stereotype ${rs.stereotype.name} propertiesSchema:`, rs.stereotype.propertiesSchema);
            });
            setStereotypeProperties(props);
        } catch (error) {
            console.error('Failed to fetch relationship stereotypes:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyStereotype = async () => {
        if ((!selectedElementId && !selectedRelationshipId) || !selectedStereotypeId) return;

        // Check if stereotype is already applied
        if (appliedStereotypes.some(s => s.stereotype.id === selectedStereotypeId)) {
            await alert({
                title: t('error') || 'Error',
                message: t('stereotypeAlreadyApplied', { type: isRelationship ? t('relationship') : t('element') }),
                type: 'warning',
            });
            return;
        }

        try {
            const url = isRelationship
                ? `/stereotypes/relationships/${selectedRelationshipId}/apply/${selectedStereotypeId}`
                : `/stereotypes/elements/${selectedElementId}/apply/${selectedStereotypeId}`;
            
            await api.post(url, { extendedProperties: {} });

            setSelectedStereotypeId("");
            if (isRelationship) {
                fetchRelationshipStereotypes();
            } else {
                fetchElementStereotypes();
                // Trigger a refresh of the canvas to update the display
                window.dispatchEvent(new CustomEvent('element-stereotype-updated', { detail: { elementId: selectedElementId } }));
            }
        } catch (error) {
            console.error('Failed to apply stereotype:', error);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToApplyStereotype'),
                type: 'error',
            });
        }
    };

    const handleRemoveStereotype = async (stereotypeId: string) => {
        if (!selectedElementId && !selectedRelationshipId) return;

        const confirmed = await confirm({
            title: t('remove') || 'Remove',
            description: t('confirmRemoveStereotype', { type: isRelationship ? t('relationship') : t('element') }),
            variant: 'destructive',
        });
        if (!confirmed) {
            return;
        }

        try {
            const headers: HeadersInit = {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            };
            
            const url = isRelationship
                ? `/stereotypes/relationships/${selectedRelationshipId}/remove/${stereotypeId}`
                : `/stereotypes/elements/${selectedElementId}/remove/${stereotypeId}`;
            
            const response = await fetch(url, {
                method: 'DELETE',
                headers,
            });

            if (response.ok) {
                // Remove from local state
                const newProps = { ...stereotypeProperties };
                delete newProps[stereotypeId];
                setStereotypeProperties(newProps);
                setExpandedStereotypes(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(stereotypeId);
                    return newSet;
                });
                if (isRelationship) {
                    fetchRelationshipStereotypes();
                } else {
                    fetchElementStereotypes();
                    // Trigger a refresh of the canvas to update the display
                    window.dispatchEvent(new CustomEvent('element-stereotype-updated', { detail: { elementId: selectedElementId } }));
                }
            } else {
                await alert({
                    title: t('error') || 'Error',
                    message: t('failedToRemoveStereotype'),
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('Failed to remove stereotype:', error);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToRemoveStereotype'),
                type: 'error',
            });
        }
    };

    const toggleStereotypeExpanded = (stereotypeId: string) => {
        setExpandedStereotypes(prev => {
            const newSet = new Set(prev);
            if (newSet.has(stereotypeId)) {
                newSet.delete(stereotypeId);
            } else {
                newSet.add(stereotypeId);
            }
            return newSet;
        });
    };

    const updateStereotypeProperty = (stereotypeId: string, key: string, value: any) => {
        setStereotypeProperties(prev => ({
            ...prev,
            [stereotypeId]: {
                ...(prev[stereotypeId] || {}),
                [key]: value,
            },
        }));
    };

    const handleSaveStereotypeProperties = async (stereotypeId: string) => {
        if (!selectedElementId) return;

        try {
            await api.put(
                `/stereotypes/elements/${selectedElementId}/properties/${stereotypeId}`,
                {
                    extendedProperties: stereotypeProperties[stereotypeId] || {},
                }
            );
            // Show success feedback (could use toast)
            console.log('Properties saved successfully');
        } catch (error) {
            console.error('Failed to save properties:', error);
            await alert({
                title: t('error') || 'Error',
                message: t('failedToSaveProperties'),
                type: 'error',
            });
        }
    };

    const renderPropertyField = (schema: PropertySchema, stereotypeId: string, value: any) => {
        const fieldValue = value !== undefined ? value : schema.defaultValue;

        switch (schema.type) {
            case 'string':
                return (
                    <Input
                        value={fieldValue || ''}
                        onChange={(e) => updateStereotypeProperty(stereotypeId, schema.key, e.target.value)}
                        placeholder={schema.placeholder}
                        className="text-sm"
                    />
                );
            case 'textarea':
                return (
                    <Textarea
                        value={fieldValue || ''}
                        onChange={(e) => updateStereotypeProperty(stereotypeId, schema.key, e.target.value)}
                        placeholder={schema.placeholder}
                        className="text-sm"
                        rows={3}
                    />
                );
            case 'number':
                return (
                    <Input
                        type="number"
                        value={fieldValue || ''}
                        onChange={(e) => updateStereotypeProperty(stereotypeId, schema.key, parseFloat(e.target.value) || 0)}
                        placeholder={schema.placeholder}
                        className="text-sm"
                    />
                );
            case 'boolean':
                return (
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            checked={fieldValue || false}
                            onCheckedChange={(checked) => updateStereotypeProperty(stereotypeId, schema.key, checked)}
                        />
                        <span className="text-xs">{schema.label}</span>
                    </div>
                );
            case 'select':
                return (
                    <Select
                        value={fieldValue || ''}
                        onValueChange={(val) => updateStereotypeProperty(stereotypeId, schema.key, val)}
                    >
                        <SelectTrigger className="text-sm">
                            <SelectValue placeholder={schema.placeholder || t('selectPlaceholder')} />
                        </SelectTrigger>
                        <SelectContent>
                            {schema.options?.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );
            default:
                return null;
        }
    };

    if (!selectedElementId && !selectedRelationshipId) {
        return (
            <Card className="m-4">
                <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {t('title')}
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                        >
                            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                        </Button>
                    </div>
                </CardHeader>
                {!isCollapsed && (
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{t('selectElementOrRelationship')}</p>
                    </CardContent>
                )}
            </Card>
        );
    }

    // Filter out already applied stereotypes from the dropdown
    const availableStereotypes = stereotypes.filter(
        s => !appliedStereotypes.some(es => es.stereotype.id === s.id)
    );

    return (
        <Card className="m-4">
            <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-sm flex items-center gap-2">
                            <Tag className="h-4 w-4" />
                            {t('title')}
                        </CardTitle>
                        <CardDescription className="text-xs">
                            {isRelationship ? t('relationship') : t('element')} {t('propertiesAndStereotypes')}
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsCollapsed(!isCollapsed)}
                    >
                        {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </Button>
                </div>
            </CardHeader>
            {!isCollapsed && (
            <CardContent className="space-y-4">
                {/* Name */}
                <div className="space-y-2">
                    <Label className="text-xs">{isRelationship ? t('relationship') : t('element')} {t('name')}</Label>
                    <Input
                        value={isRelationship ? (selectedRelationshipName || '') : (selectedElementName || '')}
                        readOnly
                        className="text-sm"
                    />
                </div>

                {/* Type */}
                {(isRelationship ? selectedRelationshipType : selectedElementType) && (
                    <div className="space-y-2">
                        <Label className="text-xs">{t('type')}</Label>
                        <Input
                            value={isRelationship ? (selectedRelationshipType || '') : (selectedElementType || '')}
                            readOnly
                            className="text-sm"
                        />
                    </div>
                )}

                {/* Applied Stereotypes */}
                <div className="space-y-2">
                    <Label className="text-xs">{t('appliedStereotypes')} ({isRelationship ? t('relationship') : t('element')})</Label>
                    {loading ? (
                        <p className="text-xs text-muted-foreground">{t('loading')}</p>
                    ) : appliedStereotypes.length === 0 ? (
                        <p className="text-xs text-muted-foreground">{t('noStereotypesApplied')}</p>
                    ) : (
                        <div className="space-y-2">
                            {appliedStereotypes.map((es) => {
                                const isExpanded = expandedStereotypes.has(es.stereotype.id);
                                const properties = es.stereotype.propertiesSchema;
                                
                                // Parse propertiesSchema - handle different formats
                                let propertiesArray: PropertySchema[] = [];
                                
                                if (properties) {
                                    console.log(`Parsing propertiesSchema for ${es.stereotype.name}:`, properties);
                                    
                                    if (Array.isArray(properties)) {
                                        // Format: [{ key: 'prop1', type: 'string', label: 'Property 1', ... }, ...]
                                        propertiesArray = properties;
                                    } else if (typeof properties === 'object') {
                                        // Format: { properties: { prop1: { type: 'string', label: 'Property 1', ... }, ... } }
                                        if (properties.properties && typeof properties.properties === 'object') {
                                            propertiesArray = Object.entries(properties.properties).map(([key, value]: [string, any]) => ({
                                                key,
                                                label: value.label || key,
                                                type: value.type || 'string',
                                                required: value.required || false,
                                                placeholder: value.placeholder,
                                                defaultValue: value.defaultValue,
                                                options: value.options,
                                                ...value,
                                            }));
                                        } else {
                                            // Format: { prop1: { type: 'string', label: 'Property 1', ... }, ... }
                                            propertiesArray = Object.entries(properties).map(([key, value]: [string, any]) => ({
                                                key,
                                                label: value.label || key,
                                                type: value.type || 'string',
                                                required: value.required || false,
                                                placeholder: value.placeholder,
                                                defaultValue: value.defaultValue,
                                                options: value.options,
                                                ...value,
                                            }));
                                        }
                                    }
                                }
                                
                                console.log(`Parsed propertiesArray for ${es.stereotype.name}:`, propertiesArray);
                                
                                const currentProps = stereotypeProperties[es.stereotype.id] || es.extendedProperties || {};

                                return (
                                    <div
                                        key={es.id}
                                        className="border rounded-md"
                                        style={{ borderColor: es.stereotype.color || '#3b82f6' }}
                                    >
                                        <div
                                            className="flex items-center justify-between p-2 cursor-pointer hover:bg-accent/50"
                                            onClick={() => toggleStereotypeExpanded(es.stereotype.id)}
                                        >
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? (
                                                    <ChevronDown className="h-3 w-3" />
                                                ) : (
                                                    <ChevronRight className="h-3 w-3" />
                                                )}
                                                <Badge
                                                    variant="outline"
                                                    className="flex items-center gap-1"
                                                    style={{ borderColor: es.stereotype.color || '#3b82f6' }}
                                                >
                                                    {es.stereotype.name}
                                                </Badge>
                                            </div>
                                            <X
                                                className="h-3 w-3 cursor-pointer hover:text-destructive"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleRemoveStereotype(es.stereotype.id);
                                                }}
                                            />
                                        </div>
                                        {isExpanded && propertiesArray.length > 0 && (
                                            <div className="p-3 space-y-3 border-t bg-muted/30">
                                                {propertiesArray.map((propSchema) => {
                                                    const label = propSchema.label || propSchema.key || 'Property';
                                                    return (
                                                        <div key={propSchema.key} className="space-y-2">
                                                            <Label className="text-xs font-medium text-foreground">
                                                                {label}
                                                                {propSchema.required && <span className="text-destructive ml-1">*</span>}
                                                            </Label>
                                                            {renderPropertyField(propSchema, es.stereotype.id, currentProps[propSchema.key])}
                                                        </div>
                                                    );
                                                })}
                                                <Button
                                                    size="sm"
                                                    className="w-full"
                                                    onClick={() => handleSaveStereotypeProperties(es.stereotype.id)}
                                                >
                                                    <Save className="h-3 w-3 mr-1" />
                                                    {t('saveProperties')}
                                                </Button>
                                            </div>
                                        )}
                                        {isExpanded && propertiesArray.length === 0 && (
                                            <div className="p-3 border-t bg-muted/30">
                                                <p className="text-xs text-muted-foreground">{t('noPropertiesDefined')}</p>
                                                {properties && (
                                                    <details className="mt-2">
                                                        <summary className="text-[10px] text-muted-foreground cursor-pointer">Debug: propertiesSchema</summary>
                                                        <pre className="text-[10px] mt-1 p-2 bg-background rounded border overflow-auto max-h-32">
                                                            {JSON.stringify(properties, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Apply New Stereotype */}
                <div className="space-y-2">
                    <Label className="text-xs">{t('applyStereotype')}</Label>
                    <div className="flex gap-2">
                        <Select value={selectedStereotypeId} onValueChange={setSelectedStereotypeId}>
                            <SelectTrigger className="flex-1 text-sm">
                                <SelectValue placeholder={t('selectStereotype')} />
                            </SelectTrigger>
                            <SelectContent>
                                {availableStereotypes.length === 0 ? (
                                    <div className="p-2 text-xs text-muted-foreground">
                                        {t('noAvailableStereotypes')}
                                    </div>
                                ) : (
                                    availableStereotypes.map((stereotype) => (
                                        <SelectItem key={stereotype.id} value={stereotype.id}>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded"
                                                    style={{ backgroundColor: stereotype.color || '#3b82f6' }}
                                                />
                                                {stereotype.name}
                                            </div>
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        <Button
                            size="sm"
                            onClick={handleApplyStereotype}
                            disabled={!selectedStereotypeId}
                        >
                            {t('apply')}
                        </Button>
                    </div>
                </div>
            </CardContent>
            )}
        </Card>
    );
}

