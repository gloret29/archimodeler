"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { LayoutDashboard, Users, Settings, Database, GitBranch, Shield } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // TODO: Real auth check with JWT/API
        const token = localStorage.getItem("accessToken");
        // Mock check for now - in real app, verify token and role
        if (!token) {
            // router.push("/login"); // Uncomment when login exists
            // For dev, we allow access but log it
            console.warn("No token found, assuming dev mode or redirecting");
        }
        setAuthorized(true);
    }, [router]);

    if (!authorized) {
        return <div className="flex h-screen items-center justify-center">Loading...</div>;
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
                <div className="p-4 border-t">
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
