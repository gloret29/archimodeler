"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Edit, Trash2, Home, Settings2 } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api/client';

interface ConceptType {
    id: string;
    name: string;
    category?: string;
}

interface RelationType {
    id: string;
    name: string;
}

interface Stereotype {
    id: string;
    name: string;
    description?: string;
    icon?: string;
    color?: string;
    applicableConceptTypes?: Array<{ conceptType: ConceptType }>;
    applicableRelationTypes?: Array<{ relationType: RelationType }>;
    propertiesSchema?: any;
    createdAt: string;
    updatedAt: string;
}

interface PropertyAttribute {
    key: string;
    label: string;
    type: 'string' | 'number' | 'boolean' | 'select' | 'textarea';
    required?: boolean;
    placeholder?: string;
    defaultValue?: any;
    options?: Array<{ value: string; label: string }>;
}

export default function StereotypesAdminPage() {
    const { alert, confirm } = useDialog();
    const t = useTranslations("Home");
    const [stereotypes, setStereotypes] = useState<Stereotype[]>([]);
    const [conceptTypes, setConceptTypes] = useState<ConceptType[]>([]);
    const [relationTypes, setRelationTypes] = useState<RelationType[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingStereotype, setEditingStereotype] = useState<Stereotype | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        icon: "",
        color: "#3b82f6",
        selectedConceptTypeIds: [] as string[],
        selectedRelationTypeIds: [] as string[],
        attributes: [] as PropertyAttribute[],
    });
    const [editingAttributeIndex, setEditingAttributeIndex] = useState<number | null>(null);
    const [isAttributeDialogOpen, setIsAttributeDialogOpen] = useState(false);
    const [isOptionsDialogOpen, setIsOptionsDialogOpen] = useState(false);
    const [currentAttributeOptions, setCurrentAttributeOptions] = useState<Array<{ value: string; label: string }>>([]);
    const [currentAttributeIndex, setCurrentAttributeIndex] = useState<number | null>(null);

    useEffect(() => {
        fetchStereotypes();
        fetchConceptTypes();
        fetchRelationTypes();
    }, []);

    const fetchConceptTypes = async () => {
        try {
            const data = await api.get<ConceptType[]>('/stereotypes/types/concept-types');
            setConceptTypes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch concept types:', error);
        }
    };

    const fetchRelationTypes = async () => {
        try {
            const data = await api.get<RelationType[]>('/stereotypes/types/relation-types');
            setRelationTypes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch relation types:', error);
        }
    };

    const fetchStereotypes = async () => {
        try {
            const data = await api.get<Stereotype[]>('/stereotypes');
            setStereotypes(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch stereotypes:', error);
        } finally {
            setLoading(false);
        }
    };

    // Convert propertiesSchema JSON to attributes array
    const parsePropertiesSchemaToAttributes = (schema: any): PropertyAttribute[] => {
        if (!schema) return [];
        
        if (Array.isArray(schema)) {
            return schema;
        }
        
        if (typeof schema === 'object' && schema.properties) {
            return Object.entries(schema.properties).map(([key, value]: [string, any]) => ({
                key,
                label: value.label || key,
                type: value.type || 'string',
                required: value.required || false,
                placeholder: value.placeholder,
                defaultValue: value.defaultValue,
                options: value.options,
            }));
        }
        
        if (typeof schema === 'object') {
            return Object.entries(schema).map(([key, value]: [string, any]) => ({
                key,
                label: value.label || key,
                type: value.type || 'string',
                required: value.required || false,
                placeholder: value.placeholder,
                defaultValue: value.defaultValue,
                options: value.options,
            }));
        }
        
        return [];
    };

    // Convert attributes array to propertiesSchema JSON
    const convertAttributesToPropertiesSchema = (attributes: PropertyAttribute[]): any => {
        if (attributes.length === 0) return null;
        
        return attributes.map(attr => ({
            key: attr.key,
            label: attr.label,
            type: attr.type,
            required: attr.required || false,
            placeholder: attr.placeholder,
            defaultValue: attr.defaultValue,
            options: attr.options,
        }));
    };

    const handleOpenDialog = (stereotype?: Stereotype) => {
        if (stereotype) {
            setEditingStereotype(stereotype);
            setFormData({
                name: stereotype.name,
                description: stereotype.description || "",
                icon: stereotype.icon || "",
                color: stereotype.color || "#3b82f6",
                selectedConceptTypeIds: stereotype.applicableConceptTypes?.map(act => act.conceptType.id) || [],
                selectedRelationTypeIds: stereotype.applicableRelationTypes?.map(art => art.relationType.id) || [],
                attributes: parsePropertiesSchemaToAttributes(stereotype.propertiesSchema),
            });
        } else {
            setEditingStereotype(null);
            setFormData({
                name: "",
                description: "",
                icon: "",
                color: "#3b82f6",
                selectedConceptTypeIds: [],
                selectedRelationTypeIds: [],
                attributes: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingStereotype(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            };

            const payload = {
                name: formData.name,
                description: formData.description || null,
                icon: formData.icon || null,
                color: formData.color,
                propertiesSchema: convertAttributesToPropertiesSchema(formData.attributes),
            };

            if (editingStereotype) {
                // Update stereotype
                await api.put(`/stereotypes/${editingStereotype.id}`, payload);
                
                // Update applicable concept types
                await api.put(`/stereotypes/${editingStereotype.id}/applicable-concept-types`, {
                    conceptTypeIds: formData.selectedConceptTypeIds
                });

                // Update applicable relation types
                await api.put(`/stereotypes/${editingStereotype.id}/applicable-relation-types`, {
                    relationTypeIds: formData.selectedRelationTypeIds
                });
            } else {
                // Create stereotype
                const newStereotype = await api.post<Stereotype>('/stereotypes', payload);
                
                // Update applicable concept types
                await api.put(`/stereotypes/${newStereotype.id}/applicable-concept-types`, {
                    conceptTypeIds: formData.selectedConceptTypeIds
                });

                // Update applicable relation types
                await api.put(`/stereotypes/${newStereotype.id}/applicable-relation-types`, {
                    relationTypeIds: formData.selectedRelationTypeIds
                });
            }

            handleCloseDialog();
            fetchStereotypes();
        } catch (error: any) {
            console.error('Failed to save stereotype:', error);
            await alert({
                title: 'Error',
                message: `Failed to ${editingStereotype ? 'update' : 'create'} stereotype: ${error.message || 'Unknown error'}`,
                type: 'error',
            });
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: 'Delete Stereotype',
            description: 'Are you sure you want to delete this stereotype?',
            variant: 'destructive',
        });
        if (!confirmed) {
            return;
        }

        try {
            await api.delete(`/stereotypes/${id}`);
            fetchStereotypes();
        } catch (error) {
            console.error('Failed to delete stereotype:', error);
            await alert({
                title: 'Error',
                message: 'Failed to delete stereotype',
                type: 'error',
            });
        }
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold">Stereotypes Management</h1>
                    <p className="text-muted-foreground mt-2">Manage stereotypes for elements and relationships</p>
                </div>
                <div className="flex gap-2">
                    <Link href="/home">
                        <Button variant="outline" size="sm">
                            <Home className="h-4 w-4 mr-2" />
                            {t("backToHome")}
                        </Button>
                    </Link>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Stereotype
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Stereotypes</CardTitle>
                    <CardDescription>Define stereotypes that can be applied to elements and relationships</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Applicable To</TableHead>
                                <TableHead>Color</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {stereotypes.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                        No stereotypes defined. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                stereotypes.map((stereotype) => (
                                    <TableRow key={stereotype.id}>
                                        <TableCell className="font-medium">{stereotype.name}</TableCell>
                                        <TableCell className="max-w-md truncate">{stereotype.description || "-"}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                {stereotype.applicableConceptTypes && stereotype.applicableConceptTypes.length > 0 && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Elements:</span> {stereotype.applicableConceptTypes.length} type(s)
                                                    </div>
                                                )}
                                                {stereotype.applicableRelationTypes && stereotype.applicableRelationTypes.length > 0 && (
                                                    <div className="text-xs">
                                                        <span className="font-medium">Relations:</span> {stereotype.applicableRelationTypes.length} type(s)
                                                    </div>
                                                )}
                                                {(!stereotype.applicableConceptTypes || stereotype.applicableConceptTypes.length === 0) &&
                                                 (!stereotype.applicableRelationTypes || stereotype.applicableRelationTypes.length === 0) && (
                                                    <span className="text-xs text-muted-foreground">No types selected</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-6 h-6 rounded border"
                                                    style={{ backgroundColor: stereotype.color || "#3b82f6" }}
                                                />
                                                <span className="text-sm text-muted-foreground">{stereotype.color}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenDialog(stereotype)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(stereotype.id)}
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {editingStereotype ? "Edit Stereotype" : "Create New Stereotype"}
                        </DialogTitle>
                        <DialogDescription>
                            Define a stereotype that can be applied to elements or relationships with custom properties.
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="e.g., Critical, Deprecated, Legacy"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Describe the purpose of this stereotype"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="icon">Icon</Label>
                                    <Input
                                        id="icon"
                                        value={formData.icon}
                                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                        placeholder="Icon identifier or URL"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            className="w-20 h-10"
                                        />
                                        <Input
                                            value={formData.color}
                                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                                            placeholder="#3b82f6"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Applicable Concept Types */}
                            <div className="space-y-2">
                                <Label>Applicable to Element Types</Label>
                                <ScrollArea className="h-48 border rounded-md p-4">
                                    <div className="space-y-2">
                                        {conceptTypes.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Loading concept types...</p>
                                        ) : (
                                            conceptTypes.map((ct) => (
                                                <div key={ct.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`concept-${ct.id}`}
                                                        checked={formData.selectedConceptTypeIds.includes(ct.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedConceptTypeIds: [...formData.selectedConceptTypeIds, ct.id],
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedConceptTypeIds: formData.selectedConceptTypeIds.filter(id => id !== ct.id),
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`concept-${ct.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {ct.name} {ct.category && <span className="text-muted-foreground">({ct.category})</span>}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Applicable Relation Types */}
                            <div className="space-y-2">
                                <Label>Applicable to Relation Types</Label>
                                <ScrollArea className="h-48 border rounded-md p-4">
                                    <div className="space-y-2">
                                        {relationTypes.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Loading relation types...</p>
                                        ) : (
                                            relationTypes.map((rt) => (
                                                <div key={rt.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`relation-${rt.id}`}
                                                        checked={formData.selectedRelationTypeIds.includes(rt.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedRelationTypeIds: [...formData.selectedRelationTypeIds, rt.id],
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    selectedRelationTypeIds: formData.selectedRelationTypeIds.filter(id => id !== rt.id),
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`relation-${rt.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {rt.name}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Attributes Management */}
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Attributes</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setEditingAttributeIndex(null);
                                            setIsAttributeDialogOpen(true);
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Attribute
                                    </Button>
                                </div>
                                {formData.attributes.length === 0 ? (
                                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                                        No attributes defined. Click "Add Attribute" to create one.
                                    </p>
                                ) : (
                                    <div className="border rounded-md">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Name</TableHead>
                                                    <TableHead>Label</TableHead>
                                                    <TableHead>Type</TableHead>
                                                    <TableHead>Required</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {formData.attributes.map((attr, index) => (
                                                    <TableRow key={index}>
                                                        <TableCell className="font-medium">{attr.key}</TableCell>
                                                        <TableCell>{attr.label}</TableCell>
                                                        <TableCell>
                                                            <Badge variant="outline">{attr.type}</Badge>
                                                            {attr.type === 'select' && attr.options && (
                                                                <span className="ml-2 text-xs text-muted-foreground">
                                                                    ({attr.options.length} options)
                                                                </span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell>
                                                            {attr.required ? (
                                                                <Badge variant="default">Yes</Badge>
                                                            ) : (
                                                                <span className="text-muted-foreground">No</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-right">
                                                            <div className="flex justify-end gap-2">
                                                                {attr.type === 'select' && (
                                                                    <Button
                                                                        type="button"
                                                                        variant="ghost"
                                                                        size="sm"
                                                                        onClick={() => {
                                                                            setCurrentAttributeIndex(index);
                                                                            setCurrentAttributeOptions(attr.options || []);
                                                                            setIsOptionsDialogOpen(true);
                                                                        }}
                                                                    >
                                                                        <Settings2 className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setEditingAttributeIndex(index);
                                                                        setIsAttributeDialogOpen(true);
                                                                    }}
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </Button>
                                                                <Button
                                                                    type="button"
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    onClick={() => {
                                                                        setFormData({
                                                                            ...formData,
                                                                            attributes: formData.attributes.filter((_, i) => i !== index),
                                                                        });
                                                                    }}
                                                                >
                                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button type="submit">
                                {editingStereotype ? "Update" : "Create"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Attribute Dialog */}
            <Dialog open={isAttributeDialogOpen} onOpenChange={setIsAttributeDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingAttributeIndex !== null ? "Edit Attribute" : "Add Attribute"}
                        </DialogTitle>
                        <DialogDescription>
                            Define an attribute that can be set when applying this stereotype.
                        </DialogDescription>
                    </DialogHeader>
                    <AttributeForm
                        attribute={editingAttributeIndex !== null ? formData.attributes[editingAttributeIndex] : undefined}
                        onSave={(attr) => {
                            if (editingAttributeIndex !== null) {
                                const newAttributes = [...formData.attributes];
                                newAttributes[editingAttributeIndex] = attr;
                                setFormData({ ...formData, attributes: newAttributes });
                            } else {
                                setFormData({ ...formData, attributes: [...formData.attributes, attr] });
                            }
                            setIsAttributeDialogOpen(false);
                            setEditingAttributeIndex(null);
                        }}
                        onCancel={() => {
                            setIsAttributeDialogOpen(false);
                            setEditingAttributeIndex(null);
                        }}
                    />
                </DialogContent>
            </Dialog>

            {/* Options Dialog for Select Type */}
            <Dialog open={isOptionsDialogOpen} onOpenChange={setIsOptionsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Manage List Options</DialogTitle>
                        <DialogDescription>
                            Define the available options for this select attribute.
                        </DialogDescription>
                    </DialogHeader>
                    <OptionsManager
                        options={currentAttributeOptions}
                        onSave={(options) => {
                            if (currentAttributeIndex !== null) {
                                const newAttributes = [...formData.attributes];
                                if (newAttributes[currentAttributeIndex]) {
                                    newAttributes[currentAttributeIndex].options = options;
                                    setFormData({ ...formData, attributes: newAttributes });
                                }
                            }
                            setIsOptionsDialogOpen(false);
                            setCurrentAttributeIndex(null);
                        }}
                        onCancel={() => {
                            setIsOptionsDialogOpen(false);
                            setCurrentAttributeIndex(null);
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Attribute Form Component
function AttributeForm({
    attribute,
    onSave,
    onCancel,
}: {
    attribute?: PropertyAttribute;
    onSave: (attr: PropertyAttribute) => void;
    onCancel: () => void;
}) {
    const [formData, setFormData] = useState<PropertyAttribute>({
        key: attribute?.key || "",
        label: attribute?.label || "",
        type: attribute?.type || "string",
        required: attribute?.required || false,
        placeholder: attribute?.placeholder || "",
        defaultValue: attribute?.defaultValue || "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.key || !formData.label) {
            await alert({
                title: 'Warning',
                message: "Key and Label are required",
                type: 'warning',
            });
            return;
        }
        onSave(formData);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label htmlFor="attr-key">Key *</Label>
                    <Input
                        id="attr-key"
                        value={formData.key}
                        onChange={(e) => setFormData({ ...formData, key: e.target.value })}
                        required
                        placeholder="e.g., priority, owner, status"
                        disabled={!!attribute}
                    />
                    <p className="text-xs text-muted-foreground">
                        Unique identifier (cannot be changed after creation)
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="attr-label">Label *</Label>
                    <Input
                        id="attr-label"
                        value={formData.label}
                        onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                        required
                        placeholder="e.g., Priority, Owner, Status"
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="attr-type">Type *</Label>
                    <Select
                        value={formData.type}
                        onValueChange={(value: PropertyAttribute['type']) => setFormData({ ...formData, type: value })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="string">String</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                            <SelectItem value="textarea">Textarea</SelectItem>
                            <SelectItem value="select">Select (List)</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="flex items-center space-x-2">
                    <Checkbox
                        id="attr-required"
                        checked={formData.required}
                        onCheckedChange={(checked) => setFormData({ ...formData, required: !!checked })}
                    />
                    <Label htmlFor="attr-required" className="cursor-pointer">
                        Required field
                    </Label>
                </div>

                {formData.type !== 'boolean' && (
                    <div className="space-y-2">
                        <Label htmlFor="attr-placeholder">Placeholder</Label>
                        <Input
                            id="attr-placeholder"
                            value={formData.placeholder || ""}
                            onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                            placeholder="Optional placeholder text"
                        />
                    </div>
                )}

                {formData.type !== 'boolean' && formData.type !== 'select' && (
                    <div className="space-y-2">
                        <Label htmlFor="attr-default">Default Value</Label>
                        <Input
                            id="attr-default"
                            value={formData.defaultValue || ""}
                            onChange={(e) => setFormData({ ...formData, defaultValue: e.target.value })}
                            placeholder="Optional default value"
                        />
                    </div>
                )}

                {formData.type === 'select' && (
                    <div className="p-3 bg-muted rounded-md">
                        <p className="text-sm text-muted-foreground">
                            After saving, you can configure the list options using the settings icon.
                        </p>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="submit">Save</Button>
            </DialogFooter>
        </form>
    );
}

// Options Manager Component
function OptionsManager({
    options,
    onSave,
    onCancel,
}: {
    options: Array<{ value: string; label: string }>;
    onSave: (options: Array<{ value: string; label: string }>) => void;
    onCancel: () => void;
}) {
    const [localOptions, setLocalOptions] = useState<Array<{ value: string; label: string }>>(options);

    const addOption = () => {
        setLocalOptions([...localOptions, { value: "", label: "" }]);
    };

    const removeOption = (index: number) => {
        setLocalOptions(localOptions.filter((_, i) => i !== index));
    };

    const updateOption = (index: number, field: 'value' | 'label', newValue: string) => {
        const newOptions = [...localOptions];
        if (newOptions[index]) {
            newOptions[index] = { ...newOptions[index], [field]: newValue };
            setLocalOptions(newOptions);
        }
    };

    const handleSave = async () => {
        // Validate that all options have both value and label
        const validOptions = localOptions.filter((opt): opt is { value: string; label: string } => !!(opt.value && opt.label));
        if (validOptions.length !== localOptions.length) {
            await alert({
                title: 'Warning',
                message: "All options must have both a value and a label",
                type: 'warning',
            });
            return;
        }
        onSave(validOptions);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label>List Options</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                    </Button>
                </div>
                {localOptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground py-4 text-center border rounded-md">
                        No options defined. Click "Add Option" to create one.
                    </p>
                ) : (
                    <div className="border rounded-md">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Value</TableHead>
                                    <TableHead>Label</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {localOptions.map((option, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            <Input
                                                value={option.value}
                                                onChange={(e) => updateOption(index, 'value', e.target.value)}
                                                placeholder="e.g., high, medium, low"
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <Input
                                                value={option.label}
                                                onChange={(e) => updateOption(index, 'label', e.target.value)}
                                                placeholder="e.g., High, Medium, Low"
                                            />
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => removeOption(index)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
            <DialogFooter>
                <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                </Button>
                <Button type="button" onClick={handleSave}>
                    Save Options
                </Button>
            </DialogFooter>
        </div>
    );
}

