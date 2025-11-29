'use client';

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Home } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function DashboardPage() {
    const t = useTranslations('Home');
    const [metrics, setMetrics] = useState<any>(null);

    useEffect(() => {
        fetch('http://localhost:3002/search/dashboard')
            .then(res => res.json())
            .then(data => setMetrics(data))
            .catch(err => console.error('Failed to fetch metrics', err));
    }, []);

    if (!metrics) return <div className="p-8">Loading dashboard metrics...</div>;

    const typeData = metrics.by_type?.buckets.map((b: any) => ({ name: b.key, value: b.doc_count })) || [];
    const layerData = metrics.by_layer?.buckets.map((b: any) => ({ name: b.key, value: b.doc_count })) || [];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Dashboard</h1>
                <Link href="/home">
                    <Button variant="outline" title={t('backToHome')}>
                        <Home className="mr-2 h-4 w-4" />
                        {t('backToHome')}
                    </Button>
                </Link>
            </div>

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
    );
}
