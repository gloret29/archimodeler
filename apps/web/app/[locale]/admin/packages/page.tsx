'use client';

import { useEffect, useState } from 'react';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import { API_CONFIG } from '@/lib/api/config';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
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
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Edit, Package, Download, Upload, Checkbox, Copy, Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ModelPackage {
    id: string;
    name: string;
    description?: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    _count?: {
        elements: number;
        relationships: number;
        folders: number;
        views: number;
    };
}

export default function PackagesPage() {
    const router = useRouter();
    const t = useTranslations('Home');
    const [packages, setPackages] = useState<ModelPackage[]>([]);
    const [loading, setLoading] = useState(true);
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [packageToDelete, setPackageToDelete] = useState<ModelPackage | null>(null);
    const [packageToEdit, setPackageToEdit] = useState<ModelPackage | null>(null);
    const [newPackageName, setNewPackageName] = useState('');
    const [newPackageDescription, setNewPackageDescription] = useState('');
    const [editPackageName, setEditPackageName] = useState('');
    const [editPackageDescription, setEditPackageDescription] = useState('');
    const [exportDialogOpen, setExportDialogOpen] = useState(false);
    const [importDialogOpen, setImportDialogOpen] = useState(false);
    const [selectedPackagesForExport, setSelectedPackagesForExport] = useState<Set<string>>(new Set());
    const [importFile, setImportFile] = useState<File | null>(null);
    const [importOverwrite, setImportOverwrite] = useState(false);
    const [importNewName, setImportNewName] = useState('');
    const [importing, setImporting] = useState(false);
    const [duplicateDialogOpen, setDuplicateDialogOpen] = useState(false);
    const [packageToDuplicate, setPackageToDuplicate] = useState<ModelPackage | null>(null);
    const [duplicatePackageName, setDuplicatePackageName] = useState('');
    const [duplicating, setDuplicating] = useState(false);

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        try {
            const data = await api.get('/model/packages');
            setPackages(Array.isArray(data) ? data : []);
        } catch (error: any) {
            if (error.status === 401) {
                localStorage.removeItem('accessToken');
                router.push('/');
                return;
            }
            console.error('Failed to fetch packages:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreatePackage = async () => {
        if (!newPackageName.trim()) return;

        try {
            await api.post('/model/packages', {
                name: newPackageName,
                description: newPackageDescription || undefined,
                status: 'DRAFT'
            });
            await fetchPackages();
            setCreateDialogOpen(false);
            setNewPackageName('');
            setNewPackageDescription('');
        } catch (error) {
            console.error('Failed to create package:', error);
            alert('Failed to create package');
        }
    };

    const handleEditClick = (pkg: ModelPackage) => {
        setPackageToEdit(pkg);
        setEditPackageName(pkg.name);
        setEditPackageDescription(pkg.description || '');
        setEditDialogOpen(true);
    };

    const handleEditPackage = async () => {
        if (!packageToEdit || !editPackageName.trim()) return;

        try {
            await api.put(`/model/packages/${packageToEdit.id}`, {
                name: editPackageName,
                description: editPackageDescription || undefined,
            });
            await fetchPackages();
            setEditDialogOpen(false);
            setPackageToEdit(null);
            setEditPackageName('');
            setEditPackageDescription('');
        } catch (error: any) {
            console.error('Failed to update package:', error);
            alert(`Failed to update package: ${error.message || 'Unknown error'}`);
        }
    };

    const handleDeleteClick = (pkg: ModelPackage) => {
        setPackageToDelete(pkg);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = async () => {
        if (!packageToDelete) return;

        try {
            await api.delete(`/model/packages/${packageToDelete.id}`);
            await fetchPackages();
            setDeleteDialogOpen(false);
            setPackageToDelete(null);
        } catch (error: any) {
            console.error('Failed to delete package:', error);
            alert(`Failed to delete package: ${error.message || 'Unknown error'}`);
        }
    };

    const handleExportSingle = async (packageId: string) => {
        try {
            const res = await API_CONFIG.fetch('/model/packages/export', {
                method: 'POST',
                body: JSON.stringify({ packageIds: [packageId] })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = res.headers.get('Content-Disposition');
                const filename = contentDisposition
                    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                    : `package-export-${Date.now()}.json`;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                alert('Failed to export package');
            }
        } catch (error) {
            console.error('Failed to export package:', error);
            alert('Failed to export package');
        }
    };

    const handleExportSelected = async () => {
        if (selectedPackagesForExport.size === 0) {
            alert('Please select at least one package to export');
            return;
        }

        try {
            const res = await API_CONFIG.fetch('/model/packages/export', {
                method: 'POST',
                body: JSON.stringify({ packageIds: Array.from(selectedPackagesForExport) })
            });

            if (res.ok) {
                const blob = await res.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const contentDisposition = res.headers.get('Content-Disposition');
                const filename = contentDisposition
                    ? contentDisposition.split('filename=')[1].replace(/"/g, '')
                    : `packages-export-${Date.now()}.json`;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
                setExportDialogOpen(false);
                setSelectedPackagesForExport(new Set());
            } else {
                alert('Failed to export packages');
            }
        } catch (error) {
            console.error('Failed to export packages:', error);
            alert('Failed to export packages');
        }
    };

    const handleImport = async () => {
        if (!importFile) {
            alert('Please select a file to import');
            return;
        }

        setImporting(true);
        try {
            const formData = new FormData();
            formData.append('file', importFile);
            if (importOverwrite) {
                formData.append('overwrite', 'true');
            }
            if (importNewName) {
                formData.append('newPackageName', importNewName);
            }

            const res = await API_CONFIG.fetch('/model/packages/import', {
                method: 'POST',
                headers: {}, // Don't set Content-Type for FormData, browser will set it with boundary
                body: formData
            });

            if (res.ok) {
                const result = await res.json();
                alert(`Package imported successfully!\n\nImported:\n- ${result.imported.elements} elements\n- ${result.imported.relationships} relationships\n- ${result.imported.folders} folders\n- ${result.imported.views} views`);
                await fetchPackages();
                setImportDialogOpen(false);
                setImportFile(null);
                setImportOverwrite(false);
                setImportNewName('');
            } else {
                const error = await res.json();
                alert(`Failed to import package: ${error.error || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Failed to import package:', error);
            alert('Failed to import package');
        } finally {
            setImporting(false);
        }
    };

    const handleDuplicateClick = (pkg: ModelPackage) => {
        setPackageToDuplicate(pkg);
        setDuplicatePackageName(`${pkg.name} (Copy)`);
        setDuplicateDialogOpen(true);
    };

    const handleDuplicate = async () => {
        if (!packageToDuplicate || !duplicatePackageName.trim()) return;

        setDuplicating(true);
        try {
            const result = await api.post(`/model/packages/${packageToDuplicate.id}/duplicate`, {
                name: duplicatePackageName.trim()
            });
            alert(`Package duplicated successfully!\n\nDuplicated:\n- ${result.imported.elements} elements\n- ${result.imported.relationships} relationships\n- ${result.imported.folders} folders\n- ${result.imported.views} views`);
            await fetchPackages();
            setDuplicateDialogOpen(false);
            setPackageToDuplicate(null);
            setDuplicatePackageName('');
        } catch (error: any) {
            console.error('Failed to duplicate package:', error);
            alert(`Failed to duplicate package: ${error.error || error.message || 'Unknown error'}`);
        } finally {
            setDuplicating(false);
        }
    };

    const togglePackageSelection = (packageId: string) => {
        const newSelection = new Set(selectedPackagesForExport);
        if (newSelection.has(packageId)) {
            newSelection.delete(packageId);
        } else {
            newSelection.add(packageId);
        }
        setSelectedPackagesForExport(newSelection);
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'PUBLISHED':
                return 'default';
            case 'APPROVED':
                return 'secondary';
            case 'IN_REVIEW':
                return 'outline';
            case 'DRAFT':
                return 'outline';
            default:
                return 'outline';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <p className="text-muted-foreground">Loading packages...</p>
            </div>
        );
    }

    return (
        <>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold">Model Packages</h1>
                        <p className="text-muted-foreground mt-1">
                            Manage model packages. Packages organize your architecture models.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Link href="/home">
                            <Button variant="outline" title={t('backToHome')}>
                                <Home className="mr-2 h-4 w-4" />
                                {t('backToHome')}
                            </Button>
                        </Link>
                        <Button variant="outline" onClick={() => setExportDialogOpen(true)}>
                            <Download className="mr-2 h-4 w-4" />
                            Export
                        </Button>
                        <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
                            <Upload className="mr-2 h-4 w-4" />
                            Import
                        </Button>
                        <Button onClick={() => setCreateDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Package
                        </Button>
                    </div>
                </div>

                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Elements</TableHead>
                                <TableHead>Relationships</TableHead>
                                <TableHead>Views</TableHead>
                                <TableHead>Created</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {packages.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                                        No packages found. Create one to get started.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                packages.map((pkg) => (
                                    <TableRow key={pkg.id}>
                                        <TableCell className="font-medium">{pkg.name}</TableCell>
                                        <TableCell className="max-w-md truncate">
                                            {pkg.description || '-'}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusColor(pkg.status)}>
                                                {pkg.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{pkg._count?.elements || 0}</TableCell>
                                        <TableCell>{pkg._count?.relationships || 0}</TableCell>
                                        <TableCell>{pkg._count?.views || 0}</TableCell>
                                        <TableCell>
                                            {new Date(pkg.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleExportSingle(pkg.id)}
                                                    title="Export package"
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDuplicateClick(pkg)}
                                                    title="Duplicate package"
                                                >
                                                    <Copy className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleEditClick(pkg)}
                                                    title="Edit package"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteClick(pkg)}
                                                    title="Delete package"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create Dialog */}
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

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Model Package</DialogTitle>
                        <DialogDescription>
                            Update the name and description of the model package.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Name *</Label>
                            <Input
                                id="edit-name"
                                value={editPackageName}
                                onChange={(e) => setEditPackageName(e.target.value)}
                                placeholder="My Model Package"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-description">Description</Label>
                            <Textarea
                                id="edit-description"
                                value={editPackageDescription}
                                onChange={(e) => setEditPackageDescription(e.target.value)}
                                placeholder="Description of the model package"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleEditPackage} disabled={!editPackageName.trim()}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Model Package</DialogTitle>
                        <DialogDescription asChild>
                            <div>
                                Are you sure you want to delete "{packageToDelete?.name}"? This action cannot be undone.
                                {packageToDelete && packageToDelete._count && (
                                    <div className="mt-2 p-2 bg-destructive/10 rounded text-sm">
                                        <div className="font-semibold">This package contains:</div>
                                        <ul className="list-disc list-inside mt-1">
                                            {packageToDelete._count.elements > 0 && (
                                                <li>{packageToDelete._count.elements} element(s)</li>
                                            )}
                                            {packageToDelete._count.relationships > 0 && (
                                                <li>{packageToDelete._count.relationships} relationship(s)</li>
                                            )}
                                            {packageToDelete._count.views > 0 && (
                                                <li>{packageToDelete._count.views} view(s)</li>
                                            )}
                                            {packageToDelete._count.folders > 0 && (
                                                <li>{packageToDelete._count.folders} folder(s)</li>
                                            )}
                                        </ul>
                                        <div className="mt-2 font-semibold text-destructive">
                                            All of these will be deleted as well!
                                        </div>
                                    </div>
                                )}
                            </div>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteConfirm}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Export Dialog */}
            <Dialog open={exportDialogOpen} onOpenChange={setExportDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Export Model Packages</DialogTitle>
                        <DialogDescription>
                            Select one or more packages to export. The exported file will contain all elements, relationships, folders, and views.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                        {packages.length === 0 ? (
                            <p className="text-muted-foreground text-center py-4">No packages available</p>
                        ) : (
                            <div className="space-y-2">
                                {packages.map((pkg) => (
                                    <div
                                        key={pkg.id}
                                        className="flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer"
                                        onClick={() => togglePackageSelection(pkg.id)}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedPackagesForExport.has(pkg.id)}
                                            onChange={() => togglePackageSelection(pkg.id)}
                                            className="h-4 w-4"
                                        />
                                        <div className="flex-1">
                                            <div className="font-medium">{pkg.name}</div>
                                            <div className="text-sm text-muted-foreground">
                                                {pkg._count?.elements || 0} elements, {pkg._count?.relationships || 0} relationships, {pkg._count?.views || 0} views
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setExportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExportSelected}
                            disabled={selectedPackagesForExport.size === 0}
                        >
                            <Download className="mr-2 h-4 w-4" />
                            Export Selected ({selectedPackagesForExport.size})
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Import Dialog */}
            <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Import Model Package</DialogTitle>
                        <DialogDescription>
                            Upload a JSON file exported from ArchiModeler to import a model package.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="import-file">Package File (JSON)</Label>
                            <Input
                                id="import-file"
                                type="file"
                                accept=".json"
                                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="import-new-name">New Package Name (Optional)</Label>
                            <Input
                                id="import-new-name"
                                value={importNewName}
                                onChange={(e) => setImportNewName(e.target.value)}
                                placeholder="Leave empty to use original name"
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                id="import-overwrite"
                                checked={importOverwrite}
                                onChange={(e) => setImportOverwrite(e.target.checked)}
                                className="h-4 w-4"
                            />
                            <Label htmlFor="import-overwrite" className="cursor-pointer">
                                Overwrite existing package if it exists
                            </Label>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleImport} disabled={!importFile || importing}>
                            {importing ? 'Importing...' : 'Import Package'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Duplicate Dialog */}
            <Dialog open={duplicateDialogOpen} onOpenChange={setDuplicateDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Duplicate Model Package</DialogTitle>
                        <DialogDescription>
                            Create a copy of "{packageToDuplicate?.name}" with all its elements, relationships, folders, and views.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="duplicate-name">New Package Name *</Label>
                            <Input
                                id="duplicate-name"
                                value={duplicatePackageName}
                                onChange={(e) => setDuplicatePackageName(e.target.value)}
                                placeholder="Enter name for the duplicated package"
                            />
                        </div>
                        {packageToDuplicate && packageToDuplicate._count && (
                            <div className="p-3 bg-muted rounded-md text-sm">
                                <div className="font-semibold mb-1">This will duplicate:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    <li>{packageToDuplicate._count.elements} element(s)</li>
                                    <li>{packageToDuplicate._count.relationships} relationship(s)</li>
                                    <li>{packageToDuplicate._count.folders} folder(s)</li>
                                    <li>{packageToDuplicate._count.views} view(s)</li>
                                </ul>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDuplicateDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleDuplicate} disabled={!duplicatePackageName.trim() || duplicating}>
                            {duplicating ? 'Duplicating...' : 'Duplicate Package'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

