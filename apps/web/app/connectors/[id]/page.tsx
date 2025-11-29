'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function ConnectorDetailPage() {
    const params = useParams();
    const [dataSource, setDataSource] = useState<any>(null);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        if (params.id) {
            // Mock fetch for now as we don't have a single get endpoint yet, or we reuse findAll and filter
            // Ideally we should implement GET /connectors/:id
        }
    }, [params.id]);

    const handleSync = async () => {
        setSyncing(true);
        try {
            const res = await fetch(`http://localhost:3001/connectors/${params.id}/sync`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
                }
            });
            const result = await res.json();
            alert(`Sync complete! Synced ${result.synced} elements.`);
        } catch (err) {
            console.error(err);
            alert('Sync failed');
        } finally {
            setSyncing(false);
        }
    };

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Connector Configuration</h1>
                <Button onClick={handleSync} disabled={syncing}>
                    {syncing ? 'Syncing...' : 'Sync Now'}
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Configuration form placeholder (URL, Credentials)</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Mapping</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">Mapping UI placeholder (Source Column -&gt; Target Attribute)</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
