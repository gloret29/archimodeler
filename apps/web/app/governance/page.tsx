'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface ChangeRequest {
    id: string;
    title: string;
    status: string;
    requester: { name: string; email: string };
    modelPackage: { name: string };
    createdAt: string;
}

export default function GovernancePage() {
    const [requests, setRequests] = useState<ChangeRequest[]>([]);

    useEffect(() => {
        // Fetch change requests
        fetch('http://localhost:3002/workflow/change-requests', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
            }
        })
            .then(res => res.json())
            .then(data => setRequests(data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold">Model Governance</h1>
                <Button>New Change Request</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Change Requests</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Model Package</TableHead>
                                <TableHead>Requester</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Created At</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="font-medium">{req.title}</TableCell>
                                    <TableCell>{req.modelPackage?.name}</TableCell>
                                    <TableCell>{req.requester?.name || req.requester?.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'APPROVED' ? 'default' : req.status === 'PUBLISHED' ? 'secondary' : 'outline'}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>{new Date(req.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <Link href={`/governance/${req.id}`}>
                                            <Button variant="ghost" size="sm">Review</Button>
                                        </Link>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
