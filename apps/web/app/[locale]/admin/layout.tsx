"use client";

import { useEffect, useState } from "react";
import { useRouter, Link } from "@/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, Settings, Database, GitBranch, Shield, Tag, Package, Home } from "lucide-react";
import { useTranslations } from 'next-intl';
import { API_CONFIG } from '@/lib/api/config';

interface User {
    id: string;
    email: string;
    name?: string;
    roles?: Array<{ name: string }>;
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const t = useTranslations('Home');
    const [authorized, setAuthorized] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            try {
                const token = API_CONFIG.getAuthToken();
                if (!token) {
                    console.warn("No token found, redirecting to home");
                    router.push("/home");
                    return;
                }

                // Verify token and check for Admin role
                const response = await API_CONFIG.fetch('/users/me');
                
                if (!response.ok) {
                    if (response.status === 401) {
                        // Token invalid or expired
                        localStorage.removeItem('accessToken');
                        router.push("/");
                        return;
                    }
                    throw new Error(`Failed to verify authentication: ${response.status}`);
                }

                const user: User = await response.json();
                
                // Check if user has Admin role
                const hasAdminRole = user.roles?.some(role => role.name === 'Admin') || false;
                
                if (!hasAdminRole) {
                    console.warn("User does not have Admin role, redirecting to home");
                    router.push("/home");
                    return;
                }

                setAuthorized(true);
            } catch (error) {
                console.error("Authentication check failed:", error);
                router.push("/home");
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, [router]);

    if (loading || !authorized) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="text-center">
                    <p className="text-muted-foreground">Checking authorization...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen bg-muted/40">
            {/* Sidebar */}
            <aside className="w-64 bg-background border-r flex flex-col">
                <div className="p-6">
                    <h1 className="text-xl font-bold text-foreground">Admin Console</h1>
                    <p className="text-sm text-muted-foreground">ArchiModeler</p>
                </div>
                <Separator />
                <ScrollArea className="flex-1 p-4">
                    <nav className="space-y-2">
                        <Link href="/admin">
                            <Button variant="ghost" className="w-full justify-start">
                                <LayoutDashboard className="mr-2 h-4 w-4" />
                                Dashboard
                            </Button>
                        </Link>
                        <Link href="/admin/users">
                            <Button variant="ghost" className="w-full justify-start">
                                <Users className="mr-2 h-4 w-4" />
                                Users
                            </Button>
                        </Link>
                        <Link href="/admin/roles">
                            <Button variant="ghost" className="w-full justify-start">
                                <Shield className="mr-2 h-4 w-4" />
                                Roles & Permissions
                            </Button>
                        </Link>
                        <Link href="/admin/settings">
                            <Button variant="ghost" className="w-full justify-start">
                                <Settings className="mr-2 h-4 w-4" />
                                Settings
                            </Button>
                        </Link>
                        <Link href="/admin/stereotypes">
                            <Button variant="ghost" className="w-full justify-start">
                                <Tag className="mr-2 h-4 w-4" />
                                Stereotypes
                            </Button>
                        </Link>
                        <Link href="/admin/packages">
                            <Button variant="ghost" className="w-full justify-start">
                                <Package className="mr-2 h-4 w-4" />
                                Model Packages
                            </Button>
                        </Link>
                        <div className="pt-4">
                            <h3 className="mb-2 px-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Infrastructure
                            </h3>
                            <Link href="/admin/neo4j">
                                <Button variant="ghost" className="w-full justify-start">
                                    <Database className="mr-2 h-4 w-4" />
                                    Neo4j Graph
                                </Button>
                            </Link>
                            <Link href="/admin/github">
                                <Button variant="ghost" className="w-full justify-start">
                                    <GitBranch className="mr-2 h-4 w-4" />
                                    GitHub Sync
                                </Button>
                            </Link>
                        </div>
                    </nav>
                </ScrollArea>
                <div className="p-4 border-t space-y-2">
                    <Link href="/home" className="w-full">
                        <Button variant="outline" className="w-full">
                            <Home className="mr-2 h-4 w-4" />
                            {t('backToHome')}
                        </Button>
                    </Link>
                    <Button variant="outline" className="w-full" onClick={() => router.push("/")}>
                        Exit Admin
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-8">
                {children}
            </main>
        </div>
    );
}
