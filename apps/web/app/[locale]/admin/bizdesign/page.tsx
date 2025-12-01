'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle2, XCircle, Download, RefreshCw } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { useDialog } from '@/contexts/DialogContext';

interface BizDesignRepository {
    id: string;
    name: string;
    description?: string;
}

interface ModelPackage {
    id: string;
    name: string;
    description?: string;
}

export default function BizDesignImportPage() {
    const t = useTranslations('BizDesign');
    const { alert } = useDialog();
    const [loading, setLoading] = useState(false);
    const [testingConnection, setTestingConnection] = useState(false);
    const [fetchingRepositories, setFetchingRepositories] = useState(false);
    const [importing, setImporting] = useState(false);

    // Configuration BizDesign
    const [url, setUrl] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    // Résultats
    const [connectionStatus, setConnectionStatus] = useState<{ success: boolean; message: string } | null>(null);
    const [repositories, setRepositories] = useState<BizDesignRepository[]>([]);
    const [selectedRepositoryId, setSelectedRepositoryId] = useState<string>('');

    // Options d'import
    const [targetPackageId, setTargetPackageId] = useState<string>('');
    const [newPackageName, setNewPackageName] = useState('');
    const [overwrite, setOverwrite] = useState(false);

    // Packages disponibles
    const [packages, setPackages] = useState<ModelPackage[]>([]);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const data = await api.get<ModelPackage[]>('/model/packages');
            setPackages(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch packages:', error);
        }
    };

    const handleTestConnection = async () => {
        if (!url || !username || !password) {
            await alert({
                title: t('error'),
                message: t('fillAllFields'),
                type: 'error',
            });
            return;
        }

        setTestingConnection(true);
        setConnectionStatus(null);

        try {
            const result = await api.post<{ success: boolean; message: string }>('/connectors/bizdesign/test-connection', {
                url,
                username,
                password,
            });

            setConnectionStatus({
                success: result.success,
                message: result.message,
            });

            if (result.success) {
                await handleFetchRepositories();
            }
        } catch (error: any) {
            setConnectionStatus({
                success: false,
                message: error.message || t('connectionFailed'),
            });
        } finally {
            setTestingConnection(false);
        }
    };

    const handleFetchRepositories = async () => {
        if (!url || !username || !password) {
            return;
        }

        setFetchingRepositories(true);
        setRepositories([]);
        setSelectedRepositoryId('');

        try {
            const data = await api.post<BizDesignRepository[]>('/connectors/bizdesign/repositories', {
                url,
                username,
                password,
            });

            setRepositories(Array.isArray(data) ? data : []);
        } catch (error: any) {
            await alert({
                title: t('error'),
                message: error.message || t('fetchRepositoriesFailed'),
                type: 'error',
            });
        } finally {
            setFetchingRepositories(false);
        }
    };

    const handleImport = async () => {
        if (!selectedRepositoryId) {
            await alert({
                title: t('error'),
                message: t('selectRepository'),
                type: 'error',
            });
            return;
        }

        if (!targetPackageId && !newPackageName) {
            await alert({
                title: t('error'),
                message: t('selectOrCreatePackage'),
                type: 'error',
            });
            return;
        }

        setImporting(true);

        try {
            const result = await api.post<{ packageName: string; packageId: string }>('/connectors/bizdesign/import', {
                url,
                username,
                password,
                repositoryId: selectedRepositoryId,
                targetPackageId: targetPackageId || undefined,
                newPackageName: newPackageName || undefined,
                overwrite,
            });

            await alert({
                title: t('success'),
                message: t('importSuccess', { packageName: result.packageName || newPackageName }),
                type: 'success',
            });

            // Réinitialiser le formulaire
            setSelectedRepositoryId('');
            setTargetPackageId('');
            setNewPackageName('');
            setOverwrite(false);
            await fetchPackages();
        } catch (error: any) {
            await alert({
                title: t('error'),
                message: error.message || t('importFailed'),
                type: 'error',
            });
        } finally {
            setImporting(false);
        }
    };

    const selectedRepository = repositories.find((r) => r.id === selectedRepositoryId);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{t('title')}</h1>
                <p className="text-muted-foreground mt-2">{t('description')}</p>
            </div>

            {/* Configuration BizDesign */}
            <Card>
                <CardHeader>
                    <CardTitle>{t('configuration')}</CardTitle>
                    <CardDescription>{t('configurationDescription')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="url">{t('apiUrl')}</Label>
                        <Input
                            id="url"
                            type="url"
                            placeholder="https://bizdesign.example.com"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            disabled={importing}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">{t('username')}</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder={t('username')}
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                disabled={importing}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">{t('password')}</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={importing}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={handleTestConnection}
                            disabled={testingConnection || !url || !username || !password}
                        >
                            {testingConnection ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('testing')}
                                </>
                            ) : (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4" />
                                    {t('testConnection')}
                                </>
                            )}
                        </Button>
                        {connectionStatus && (
                            <Alert className={connectionStatus.success ? 'border-green-500' : 'border-red-500'}>
                                {connectionStatus.success ? (
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                    <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <AlertDescription>{connectionStatus.message}</AlertDescription>
                            </Alert>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Sélection du Repository */}
            {connectionStatus?.success && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('selectRepository')}</CardTitle>
                        <CardDescription>{t('selectRepositoryDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex gap-2">
                            <Select
                                value={selectedRepositoryId}
                                onValueChange={setSelectedRepositoryId}
                                disabled={fetchingRepositories || importing}
                            >
                                <SelectTrigger className="flex-1">
                                    <SelectValue placeholder={t('selectRepositoryPlaceholder')} />
                                </SelectTrigger>
                                <SelectContent>
                                    {repositories.map((repo) => (
                                        <SelectItem key={repo.id} value={repo.id}>
                                            {repo.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                onClick={handleFetchRepositories}
                                disabled={fetchingRepositories || !url || !username || !password}
                            >
                                {fetchingRepositories ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <RefreshCw className="h-4 w-4" />
                                )}
                            </Button>
                        </div>
                        {fetchingRepositories && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                {t('fetchingRepositories')}
                            </div>
                        )}
                        {selectedRepository && (
                            <div className="p-4 bg-muted rounded-lg">
                                <h3 className="font-semibold">{selectedRepository.name}</h3>
                                {selectedRepository.description && (
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {selectedRepository.description}
                                    </p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Options d'Import */}
            {selectedRepositoryId && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('importOptions')}</CardTitle>
                        <CardDescription>{t('importOptionsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>{t('targetPackage')}</Label>
                            <div className="space-y-2">
                                <Select
                                    value={targetPackageId}
                                    onValueChange={(value) => {
                                        setTargetPackageId(value);
                                        setNewPackageName('');
                                    }}
                                    disabled={importing}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder={t('selectExistingPackage')} />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {packages.map((pkg) => (
                                            <SelectItem key={pkg.id} value={pkg.id}>
                                                {pkg.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <div className="text-center text-sm text-muted-foreground">ou</div>
                                <Input
                                    placeholder={t('newPackageNamePlaceholder')}
                                    value={newPackageName}
                                    onChange={(e) => {
                                        setNewPackageName(e.target.value);
                                        setTargetPackageId('');
                                    }}
                                    disabled={importing || !!targetPackageId}
                                />
                            </div>
                        </div>
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="overwrite"
                                checked={overwrite}
                                onCheckedChange={(checked) => setOverwrite(checked === true)}
                                disabled={importing || !targetPackageId}
                            />
                            <Label htmlFor="overwrite" className="cursor-pointer">
                                {t('overwriteExisting')}
                            </Label>
                        </div>
                        <Button
                            onClick={handleImport}
                            disabled={importing || !selectedRepositoryId || (!targetPackageId && !newPackageName)}
                            className="w-full"
                        >
                            {importing ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {t('importing')}
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    {t('import')}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}

