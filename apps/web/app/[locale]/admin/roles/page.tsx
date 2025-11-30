"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { api } from '@/lib/api/client';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Shield, Home } from "lucide-react";
import { Link } from "@/navigation";
import { useTranslations } from "next-intl";
import { useDialog } from '@/contexts/DialogContext';

interface Role {
    id: string;
    name: string;
    description: string;
    permissions: { name: string }[];
}

export default function RolesPage() {
    const { confirm } = useDialog();
    const t = useTranslations('Home');
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const data = await api.get<Role[]>('/roles');
            setRoles(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
            setRoles([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        const confirmed = await confirm({
            title: "Delete Role",
            description: "Are you sure you want to delete this role?",
            variant: 'destructive',
        });
        if (!confirmed) return;
        try {
            await api.delete(`/roles/${id}`);
            fetchRoles();
        } catch (error) {
            console.error("Failed to delete role:", error);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Roles & Permissions</h2>
                    <p className="text-muted-foreground">
                        Define roles and assign permissions to control access.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/home">
                        <Button variant="outline" title={t('backToHome')}>
                            <Home className="mr-2 h-4 w-4" />
                            {t('backToHome')}
                        </Button>
                    </Link>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> Create Role
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>System Roles</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Role Name</TableHead>
                                <TableHead>Description</TableHead>
                                <TableHead>Permissions</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        Loading roles...
                                    </TableCell>
                                </TableRow>
                            ) : roles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        No roles found.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                roles.map((role) => (
                                    <TableRow key={role.id}>
                                        <TableCell className="font-medium flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-blue-500" />
                                            {role.name}
                                        </TableCell>
                                        <TableCell>{role.description || "-"}</TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {role.permissions?.length || 0} permissions
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon">
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(role.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
