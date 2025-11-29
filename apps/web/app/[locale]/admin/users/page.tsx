"use client";

import { useEffect, useState } from "react";
import { useRouter } from "@/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Plus, Pencil, Trash2 } from "lucide-react";

interface User {
    id: string;
    name: string;
    email: string;
    roles: { name: string; id: string }[];
    createdAt: string;
}

interface Role {
    id: string;
    name: string;
    description?: string;
}

export default function UsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<User[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<User | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        roleIds: [] as string[],
    });

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);

    const fetchRoles = async () => {
        try {
            const res = await fetch("http://localhost:3002/roles");
            const data = await res.json();
            setRoles(data);
        } catch (error) {
            console.error("Failed to fetch roles:", error);
        }
    };

    const fetchUsers = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                console.warn("No access token found. Redirecting to login.");
                router.push('/');
                return;
            }

            const headers: HeadersInit = {
                'Authorization': `Bearer ${token}`,
            };
            const res = await fetch("http://localhost:3002/users", { headers });
            if (res.ok) {
                const data = await res.json();
                // Ensure data is an array
                setUsers(Array.isArray(data) ? data : []);
            } else if (res.status === 401) {
                console.error("Unauthorized. Redirecting to login.");
                localStorage.removeItem('accessToken');
                alert("You need to login to access this page. Use admin@archimodeler.com / admin123");
                router.push('/');
            } else {
                console.error("Failed to fetch users:", res.status, res.statusText);
                setUsers([]);
            }
        } catch (error) {
            console.error("Failed to fetch users:", error);
            setUsers([]);
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        try {
            const headers: HeadersInit = {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            };
            await fetch(`http://localhost:3002/users/${id}`, { 
                method: "DELETE",
                headers,
            });
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
            alert("Failed to delete user");
        }
    };

    const handleOpenDialog = (user?: User) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                name: user.name || "",
                email: user.email,
                password: "", // Don't pre-fill password
                roleIds: user.roles?.map(r => r.id) || [],
            });
        } else {
            setEditingUser(null);
            setFormData({
                name: "",
                email: "",
                password: "",
                roleIds: [],
            });
        }
        setIsDialogOpen(true);
    };

    const handleCloseDialog = () => {
        setIsDialogOpen(false);
        setEditingUser(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const headers: HeadersInit = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
            };

            const payload: any = {
                name: formData.name || null,
                email: formData.email,
            };

            // Handle roles - use 'set' for updates to replace existing roles, 'connect' for new users
            if (formData.roleIds.length > 0) {
                payload.roles = editingUser
                    ? { set: formData.roleIds.map(roleId => ({ id: roleId })) }
                    : { connect: formData.roleIds.map(roleId => ({ id: roleId })) };
            } else if (editingUser) {
                // If no roles selected and editing, disconnect all roles
                payload.roles = { set: [] };
            }

            // Only include password if it's provided (for updates) or if creating new user
            if (formData.password || !editingUser) {
                payload.password = formData.password;
            }

            const url = editingUser 
                ? `http://localhost:3002/users/${editingUser.id}`
                : "http://localhost:3002/users";
            const method = editingUser ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers,
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                handleCloseDialog();
                fetchUsers();
            } else {
                const error = await response.json();
                alert(`Failed to ${editingUser ? 'update' : 'create'} user: ${error.message || 'Unknown error'}`);
            }
        } catch (error: any) {
            console.error(`Failed to ${editingUser ? 'update' : 'create'} user:`, error);
            alert(`Failed to ${editingUser ? 'update' : 'create'} user: ${error.message}`);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Users</h2>
                    <p className="text-muted-foreground">
                        Manage system users and their roles.
                    </p>
                </div>
                <Button onClick={handleOpenDialog}>
                    <Plus className="mr-2 h-4 w-4" /> Add User
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>All Users</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Roles</TableHead>
                                <TableHead>Joined</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center">
                                        Loading users...
                                    </TableCell>
                                </TableRow>
                            ) : users.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="space-y-2">
                                            <p className="text-muted-foreground">No users found.</p>
                                            <p className="text-xs text-muted-foreground">
                                                If this is the first time, run: <code className="bg-muted px-1 py-0.5 rounded">npm run seed</code> to create the admin user.
                                            </p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">{user.name || "N/A"}</TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            <div className="flex gap-1">
                                                {user.roles && user.roles.length > 0 ? (
                                                    user.roles.map((role) => (
                                                        <Badge key={role.name} variant="secondary">
                                                            {role.name}
                                                        </Badge>
                                                    ))
                                                ) : (
                                                    <span className="text-muted-foreground text-sm">No roles</span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button 
                                                variant="ghost" 
                                                size="icon"
                                                onClick={() => handleOpenDialog(user)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="text-red-500 hover:text-red-700"
                                                onClick={() => handleDelete(user.id)}
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

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{editingUser ? 'Edit User' : 'Create New User'}</DialogTitle>
                        <DialogDescription>
                            {editingUser 
                                ? 'Update user information. Leave password empty to keep the current password.'
                                : 'Add a new user to the system. The password will be securely hashed.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="User's full name"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                    placeholder="user@example.com"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">
                                    Password {!editingUser && '*'}
                                </Label>
                                <Input
                                    id="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required={!editingUser}
                                    placeholder={editingUser ? "Leave empty to keep current password" : ""}
                                    placeholder="Enter password"
                                    minLength={6}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Roles</Label>
                                <ScrollArea className="h-48 border rounded-md p-4">
                                    <div className="space-y-2">
                                        {roles.length === 0 ? (
                                            <p className="text-sm text-muted-foreground">Loading roles...</p>
                                        ) : (
                                            roles.map((role) => (
                                                <div key={role.id} className="flex items-center space-x-2">
                                                    <Checkbox
                                                        id={`role-${role.id}`}
                                                        checked={formData.roleIds.includes(role.id)}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setFormData({
                                                                    ...formData,
                                                                    roleIds: [...formData.roleIds, role.id],
                                                                });
                                                            } else {
                                                                setFormData({
                                                                    ...formData,
                                                                    roleIds: formData.roleIds.filter(id => id !== role.id),
                                                                });
                                                            }
                                                        }}
                                                    />
                                                    <label
                                                        htmlFor={`role-${role.id}`}
                                                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                                    >
                                                        {role.name}
                                                        {role.description && (
                                                            <span className="text-muted-foreground ml-2">({role.description})</span>
                                                        )}
                                                    </label>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleCloseDialog}>
                                Cancel
                            </Button>
                            <Button type="submit">{editingUser ? 'Update User' : 'Create User'}</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}
