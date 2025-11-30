'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api/client';
import { UserInfo } from '@/components/common/UserInfo';
import { NotificationCenter } from '@/components/notifications/NotificationCenter';

export default function DashboardPage() {
    const t = useTranslations('Home');
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        api.get('/search/dashboard')
            .then((data: any) => setMetrics(data))
            .catch(err => console.error('Failed to fetch metrics', err));
    }, []);

    if (!metrics) return <div className="p-8">Loading dashboard metrics...</div>;

    const typeData = metrics.by_type?.buckets.map((b: any) => ({ name: b.key, value: b.doc_count })) || [];
    const layerData = metrics.by_layer?.buckets.map((b: any) => ({ name: b.key, value: b.doc_count })) || [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="min-h-screen">
            <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-2xl font-bold">Dashboard</h1>
                        <div className="flex items-center gap-3">
                            <Link href="/home">
                                <Button variant="outline" title={t('backToHome')}>
                                    <Home className="mr-2 h-4 w-4" />
                                    {t('backToHome')}
                                </Button>
                            </Link>
                            <NotificationCenter />
                            <UserInfo />
                        </div>
                    </div>
                </div>
            </header>
            <div className="p-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-card p-6 rounded-lg shadow border">
                    <h2 className="text-xl font-semibold mb-4">Elements by Type</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={typeData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={(props: any) => `${props.name} ${(props.percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="value"
                                >
                                    {typeData.map((entry: any, index: number) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-lg shadow border">
                    <h2 className="text-xl font-semibold mb-4">Elements by Layer</h2>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={layerData}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis type="number" />
                                <YAxis dataKey="name" type="category" width={150} />
                                <Tooltip />
                                <Legend />
                                <Bar dataKey="value" fill="#82ca9d" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
            </div>
        </div>
    );
}
