'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Layout, BarChart3, ArrowRight, Box, Settings, LogOut, Shield } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ModelPackage {
    id: string;
    name: string;
    description: string;
    status: string;
    updatedAt: string;
    _count: {
        elements: number;
        relationships: number;
    };
}

export default function HomePage() {
    const t = useTranslations('Home');
    const router = useRouter();
    const [packages, setPackages] = useState<ModelPackage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('http://localhost:3002/model/packages', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
            .then(res => res.json())
            .then(data => {
                setPackages(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const handleCreatePackage = async () => {
        const name = prompt('Enter package name:');
        if (!name) return;

        try {
            const res = await fetch('http://localhost:3002/model/packages', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                },
                body: JSON.stringify({ name, description: 'New package', status: 'DRAFT' })
            });
            const newPackage = await res.json();
            setPackages([...packages, { ...newPackage, _count: { elements: 0, relationships: 0 } }]);
        } catch (err) {
            console.error(err);
            alert('Failed to create package');
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        router.push('/');
    };

    return (
        <div className="container mx-auto p-8 space-y-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-bold tracking-tight">{t('welcome')}</h1>
                    <p className="text-muted-foreground mt-2">Manage your enterprise architecture models and views.</p>
                </div>
                <div className="flex gap-4">
                    <Button variant="ghost" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        {t('logout')}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/settings/profile')}>
                        <Settings className="mr-2 h-4 w-4" />
                        {t('settings')}
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/admin/settings')}>
                        <Shield className="mr-2 h-4 w-4" />
                        Admin
                    </Button>
                    <Button variant="outline" onClick={() => router.push('/dashboard')}>
                        <BarChart3 className="mr-2 h-4 w-4" />
                        Dashboard
                    </Button>
                    <Button onClick={() => router.push('/studio')}>
                        <Layout className="mr-2 h-4 w-4" />
                        {t('openStudio')}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="bg-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Box className="h-5 w-5" />
                            Quick Actions
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Button className="w-full justify-start" onClick={handleCreatePackage}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create New Model Package
                        </Button>
                        <Button variant="secondary" className="w-full justify-start" onClick={() => router.push('/studio')}>
                            <Layout className="mr-2 h-4 w-4" />
                            Continue Designing
                        </Button>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>{t('recentPackages')}</CardTitle>
                        <CardDescription>Your recently updated architecture packages.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Loading packages...</div>
                        ) : packages.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No packages found. Create one to get started.</div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {packages.map(pkg => (
                                    <div key={pkg.id} className="flex flex-col p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => router.push(`/studio?packageId=${pkg.id}`)}>
                                        <div className="flex justify-between items-start mb-2">
                                            <h3 className="font-semibold">{pkg.name}</h3>
                                            <span className="text-xs bg-secondary px-2 py-1 rounded-full">{pkg.status}</span>
                                        </div>
                                        <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{pkg.description}</p>
                                        <div className="mt-auto flex justify-between items-center text-xs text-muted-foreground">
                                            <span>{pkg._count?.elements || 0} elements</span>
                                            <span>{new Date(pkg.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button variant="ghost" size="sm" className="gap-1">
                            View All <ArrowRight className="h-4 w-4" />
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
}
