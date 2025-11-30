'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/api/config';
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
    const pathname = usePathname();
    const [packages, setPackages] = useState<ModelPackage[]>([]);
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);

    useEffect(() => {
        // Check authentication first
        const token = localStorage.getItem('accessToken');
        if (!token) {
            window.location.href = '/';
            return;
        }

        const packageId = searchParams.get('packageId');
        if (packageId) {
            setSelectedPackageId(packageId);
        }
    }, [searchParams]);

    useEffect(() => {
        // Check authentication before fetching
        const token = localStorage.getItem('accessToken');
        if (!token) {
            return;
        }
        
        // Only fetch if we don't already have a packageId in the URL
        const currentPackageId = searchParams.get('packageId');
        if (currentPackageId) {
            // If packageId is already in URL, we don't need to fetch or show selector
            setLoading(false);
            return;
        }
        
        // Only fetch once when component mounts and no packageId in URL
        fetchPackages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty deps - only run once on mount

    const fetchPackages = async () => {
        try {
            const token = API_CONFIG.getAuthToken();
            if (!token) {
                window.location.href = '/';
                return;
            }

            const data = await api.get('/model/packages');
            
            if (Array.isArray(data)) {
                setPackages(data);
                // If no packageId in URL and we have packages, select the first one
                const currentPackageId = searchParams.get('packageId');
                if (!currentPackageId && data.length > 0) {
                    setSelectedPackageId(data[0].id);
                    // Use window.location for immediate navigation to ensure URL updates
                    if (typeof window !== 'undefined') {
                        const currentLocale = pathname.split('/')[1] || 'en';
                        const fullUrl = `/${currentLocale}/studio?packageId=${data[0].id}`;
                        window.location.href = fullUrl;
                    } else {
                        router.replace(`/studio?packageId=${data[0].id}`);
                    }
                } else if (currentPackageId) {
                    // PackageId already in URL, just set it in state
                    setSelectedPackageId(currentPackageId);
                }
            }
        } catch (error: any) {
            console.error('Failed to fetch packages:', error);
            // Don't redirect on network errors, just show empty state
            // Only redirect if token is missing or unauthorized
            if (error.status === 401) {
                localStorage.removeItem('accessToken');
                window.location.href = '/';
                return;
            }
            const token = API_CONFIG.getAuthToken();
            if (!token) {
                window.location.href = '/';
            }
        } finally {
            setLoading(false);
        }
    };

    const handlePackageChange = (packageId: string) => {
        setSelectedPackageId(packageId);
        router.push(`/studio?packageId=${packageId}`);
    };


    // Early return if not authenticated (will redirect)
    const token = localStorage.getItem('accessToken');
    if (!token) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-muted-foreground">Redirecting to login...</p>
                </div>
            </div>
        );
    }

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
        </>
    );
}

