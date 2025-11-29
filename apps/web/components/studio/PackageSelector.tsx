'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Package } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ModelPackage {
    id: string;
    name: string;
    description?: string;
    status: string;
    _count?: {
        elements: number;
        relationships: number;
    };
}

export default function PackageSelector() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [packages, setPackages] = useState<ModelPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [newPackageName, setNewPackageName] = useState('');
    const [newPackageDescription, setNewPackageDescription] = useState('');

    useEffect(() => {
        const packageId = searchParams.get('packageId');
        if (packageId) {
            setSelectedPackageId(packageId);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('http://localhost:3002/model/packages', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (Array.isArray(data)) {
                setPackages(data);
                // If no packageId in URL and we have packages, select the first one
                if (!searchParams.get('packageId') && data.length > 0) {
                    setSelectedPackageId(data[0].id);
                    router.push(`/studio?packageId=${data[0].id}`);
                }
            }
        } catch (error) {
            console.error('Failed to fetch packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePackageChange = (packageId: string) => {
        setSelectedPackageId(packageId);
        router.push(`/studio?packageId=${packageId}`);
    };

    const handleCreatePackage = async () => {
        if (!newPackageName.trim()) return;

        try {
            const token = localStorage.getItem('accessToken');
            const res = await fetch('http://localhost:3002/model/packages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: newPackageName,
                    description: newPackageDescription || undefined,
                    status: 'DRAFT'
                })
            });

            if (res.ok) {
                const newPackage = await res.json();
                setPackages([...packages, { ...newPackage, _count: { elements: 0, relationships: 0 } }]);
                setSelectedPackageId(newPackage.id);
                router.push(`/studio?packageId=${newPackage.id}`);
                setCreateDialogOpen(false);
                setNewPackageName('');
                setNewPackageDescription('');
            }
        } catch (error) {
            console.error('Failed to create package:', error);
            alert('Failed to create package');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-muted-foreground">Loading packages...</p>
                </div>
            </div>
        );
    }

    if (packages.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            No Model Package Found
                        </CardTitle>
                        <CardDescription>
                            Create your first model package to start working
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setCreateDialogOpen(true)} className="w-full">
                            <Plus className="mr-2 h-4 w-4" />
                            Create Model Package
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <>
            <div className="flex items-center justify-center min-h-screen bg-background">
                <Card className="w-full max-w-md">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="h-5 w-5" />
                            Select Model Package
                        </CardTitle>
                        <CardDescription>
                            Choose a model package to work with. All objects, views, and relationships will be scoped to this package.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Model Package</Label>
                            <Select
                                value={selectedPackageId || undefined}
                                onValueChange={handlePackageChange}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a package" />
                                </SelectTrigger>
                                <SelectContent>
                                    {packages.map((pkg) => (
                                        <SelectItem key={pkg.id} value={pkg.id}>
                                            <div className="flex flex-col">
                                                <span>{pkg.name}</span>
                                                {pkg._count && (
                                                    <span className="text-xs text-muted-foreground">
                                                        {pkg._count.elements} elements, {pkg._count.relationships} relationships
                                                    </span>
                                                )}
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            variant="outline"
                            onClick={() => setCreateDialogOpen(true)}
                            className="w-full"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Package
                        </Button>
                        {selectedPackageId && (
                            <Button
                                onClick={() => router.push(`/studio?packageId=${selectedPackageId}`)}
                                className="w-full"
                            >
                                Open Studio
                            </Button>
                        )}
                    </CardContent>
                </Card>
            </div>

            <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create New Model Package</DialogTitle>
                        <DialogDescription>
                            Create a new model package to organize your architecture models.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Name *</Label>
                            <Input
                                id="name"
                                value={newPackageName}
                                onChange={(e) => setNewPackageName(e.target.value)}
                                placeholder="My Model Package"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newPackageDescription}
                                onChange={(e) => setNewPackageDescription(e.target.value)}
                                placeholder="Description of the model package"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleCreatePackage} disabled={!newPackageName.trim()}>
                            Create
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

