'use client';

import { useEffect, useState } from 'react';
import { useRouter, Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
    Layout, 
    BarChart3, 
    Settings, 
    Shield, 
    Users, 
    Package, 
    Tag, 
    FileText,
    Sparkles,
    Database,
    GitBranch,
    TrendingUp,
    Zap,
    ArrowRight,
    Box
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';
import { UserInfo } from '@/components/common/UserInfo';
import { api } from '@/lib/api/client';
import { Badge } from '@/components/ui/badge';

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

interface UserData {
    id: string;
    name: string;
    email: string;
    roles?: Array<{ name: string }>;
}

interface NavigationItem {
    id: string;
    title: string;
    description: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    requiredRoles?: string[];
}

export default function HomePage() {
    const t = useTranslations('Home');
    const tA11y = useTranslations('Accessibility');
    const router = useRouter();
    const [packages, setPackages] = useState<ModelPackage[]>([]);
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const [userLoading, setUserLoading] = useState(true);

    useEffect(() => {
        // Fetch user data
        const fetchUser = async () => {
            try {
                const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
                if (token) {
                    const userData = await api.get<UserData>('/users/me');
                    setUser(userData);
                }
            } catch (error: any) {
                if (error.status !== 401) {
                    console.error('Failed to fetch user:', error);
                }
            } finally {
                setUserLoading(false);
            }
        };

        // Fetch packages
        const fetchPackages = async () => {
            try {
                const data = await api.get<ModelPackage[]>('/model/packages');
                setPackages(data || []);
            } catch (err: any) {
                if (err.status !== 401) {
                    console.error('Failed to fetch packages:', err);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
        fetchPackages();
    }, []);

    const userRoles = user?.roles?.map(r => r.name) || [];
    const hasRole = (role: string) => userRoles.includes(role);
    const hasAnyRole = (roles: string[]) => roles.some(role => hasRole(role));

    const navigationItems: NavigationItem[] = [
        {
            id: 'studio',
            title: 'Studio',
            description: 'Ouvrir l\'éditeur de modèles',
            href: '/studio',
            icon: Layout,
            color: 'bg-blue-500',
        },
        {
            id: 'dashboard',
            title: 'Dashboard',
            description: 'Vue d\'ensemble et statistiques',
            href: '/dashboard',
            icon: BarChart3,
            color: 'bg-purple-500',
        },
        {
            id: 'settings',
            title: 'Paramètres',
            description: 'Gérer votre profil',
            href: '/settings/profile',
            icon: Settings,
            color: 'bg-gray-500',
        },
        {
            id: 'admin',
            title: 'Administration',
            description: 'Console d\'administration',
            href: '/admin',
            icon: Shield,
            color: 'bg-red-500',
            requiredRoles: ['System Administrator', 'Lead Designer'],
        },
        {
            id: 'api-docs',
            title: 'Documentation API',
            description: 'Documentation Swagger',
            href: '/api-docs',
            icon: FileText,
            color: 'bg-teal-500',
        },
    ];

    const filteredNavigation = navigationItems.filter(item => {
        if (!item.requiredRoles) return true;
        return hasAnyRole(item.requiredRoles);
    });

    const stats = [
        {
            label: 'Packages',
            value: packages.length,
            icon: Package,
            color: 'text-blue-500',
        },
        {
            label: 'Éléments',
            value: packages.reduce((sum, pkg) => sum + (pkg._count?.elements || 0), 0),
            icon: Box,
            color: 'text-green-500',
        },
        {
            label: 'Relations',
            value: packages.reduce((sum, pkg) => sum + (pkg._count?.relationships || 0), 0),
            icon: TrendingUp,
            color: 'text-purple-500',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
            {/* Header */}
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50" role="banner">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                                ArchiModeler
                            </h1>
                            <p className="text-sm text-muted-foreground mt-1" aria-live="polite">
                                {user ? `Bienvenue, ${user.name || user.email}` : 'Plateforme de modélisation d\'architecture'}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            {user && user.roles && user.roles.length > 0 && (
                                <div className="flex gap-2">
                                    {user.roles.map((role) => (
                                        <Badge key={role.name} variant="secondary" className="text-xs">
                                            {role.name}
                                        </Badge>
                                    ))}
                                </div>
                            )}
                            <NotificationCenter />
                            <UserInfo />
                        </div>
                    </div>
                </div>
            </header>

            <main id="main-content" className="container mx-auto px-6 py-8 space-y-8" role="main" aria-label={tA11y('mainContent')}>
                {/* Stats Cards */}
                <section aria-label="Statistiques" className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <Card key={stat.label} className="border-2 hover:shadow-lg transition-shadow">
                                <CardContent className="p-6">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                                            <p className="text-3xl font-bold mt-2" aria-label={`${stat.label}: ${stat.value}`}>{stat.value}</p>
                                        </div>
                                        <div className={`p-3 rounded-lg bg-muted ${stat.color}`} aria-hidden="true">
                                            <Icon className="h-6 w-6 text-white" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </section>

                {/* Navigation Grid */}
                <nav aria-label={tA11y('navigation')}>
                    <h2 className="text-2xl font-bold mb-6">Navigation</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" role="list">
                        {filteredNavigation.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <Card
                                    key={item.id}
                                    role="listitem"
                                    className="group cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg transition-all duration-200 h-full focus-visible-ring"
                                    onClick={() => {
                                        router.push(item.href);
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            router.push(item.href);
                                        }
                                    }}
                                    tabIndex={0}
                                    aria-label={`${item.title}: ${item.description}`}
                                >
                                    <CardHeader>
                                        <div className="flex items-center gap-4">
                                            <div className={`p-3 rounded-lg ${item.color} group-hover:scale-110 transition-transform`} aria-hidden="true">
                                                <Icon className="h-6 w-6 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <CardTitle className="text-lg">{item.title}</CardTitle>
                                            </div>
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="text-sm">{item.description}</CardDescription>
                                        <div className="mt-4 flex items-center text-primary group-hover:translate-x-1 transition-transform" aria-hidden="true">
                                            <span className="text-sm font-medium">Accéder</span>
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                </nav>

                {/* Recent Packages */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold">Packages récents</h2>
                    </div>
                    {loading ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <div className="animate-pulse space-y-4">
                                    <div className="h-4 bg-muted rounded w-1/2 mx-auto"></div>
                                    <div className="h-4 bg-muted rounded w-1/3 mx-auto"></div>
                                </div>
                            </CardContent>
                        </Card>
                    ) : packages.length === 0 ? (
                        <Card>
                            <CardContent className="p-12 text-center">
                                <Box className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <p className="text-muted-foreground mb-4">Aucun package trouvé</p>
                                {hasAnyRole(['System Administrator', 'Lead Designer']) && (
                                    <Link href="/admin">
                                        <Button>
                                            Accéder à l'administration
                                        </Button>
                                    </Link>
                                )}
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {packages.slice(0, 6).map((pkg) => (
                                <Card
                                    key={pkg.id}
                                    className="group cursor-pointer hover:shadow-lg transition-all border-2 hover:border-primary/50"
                                    onClick={() => router.push(`/studio?packageId=${pkg.id}`)}
                                >
                                    <CardHeader>
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <CardTitle className="text-lg group-hover:text-primary transition-colors">
                                                    {pkg.name}
                                                </CardTitle>
                                                <Badge variant="outline" className="mt-2">
                                                    {pkg.status}
                                                </Badge>
                                            </div>
                                            <Package className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <CardDescription className="line-clamp-2 mb-4">
                                            {pkg.description || 'Aucune description'}
                                        </CardDescription>
                                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex gap-4">
                                                <span className="flex items-center gap-1">
                                                    <Box className="h-4 w-4" />
                                                    {pkg._count?.elements || 0}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <TrendingUp className="h-4 w-4" />
                                                    {pkg._count?.relationships || 0}
                                                </span>
                                            </div>
                                            <span>{new Date(pkg.updatedAt).toLocaleDateString()}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
