'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api/client';

interface DataSource {
    id: string;
    name: string;
    type: string;
    lastSync: string;
}

export default function ConnectorsPage() {
    const [dataSources, setDataSources] = useState<DataSource[]>([]);

    useEffect(() => {
        api.get('/connectors')
            .then((data: any) => setDataSources(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Data Connectors</h1>
                <Button>New Data Source</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Configured Data Sources</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Type</TableHead>
                                <TableHead>Last Sync</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {dataSources.map((ds) => (
                                <TableRow key={ds.id}>
                                    <TableCell className="font-medium">{ds.name}</TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{ds.type}</Badge>
                                    </TableCell>
                                    <TableCell>{ds.lastSync ? new Date(ds.lastSync).toLocaleString() : 'Never'}</TableCell>
                                    <TableCell>
                                        <Link href={`/connectors/${ds.id}`}>
                                            <Button variant="ghost" size="sm">Configure</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {dataSources.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">No data sources configured.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
