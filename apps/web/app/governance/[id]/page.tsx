'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Home } from 'lucide-react';
import { Link } from '@/navigation';
import { useTranslations } from 'next-intl';
import { useDialog } from '@/contexts/DialogContext';
import { api } from '@/lib/api/client';

export default function ChangeRequestDetailPage() {
    const params = useParams();
    const router = useRouter();
    const t = useTranslations('Home');
    const [request, setRequest] = useState<any>(null);

    useEffect(() => {
        if (params.id) {
            api.get(`/workflow/change-requests/${params.id}`)
                .then((data: any) => setRequest(data))
                .catch(err => console.error(err));
        }
    }, [params.id]);

    const handleAction = async (action: 'approve' | 'reject' | 'publish' | 'submit') => {
        try {
            await api.put(`/workflow/change-requests/${params.id}/${action}`, {});
            // Refresh
            window.location.reload();
        } catch (err) {
            console.error(err);
            alert('Action failed');
        }
    };

    if (!request) return <div className="p-8">Loading...</div>;

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold mb-2">{request.title}</h1>
                    <div className="flex items-center gap-4 text-muted-foreground">
                        <span>{request.modelPackage?.name}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>Requested by {request.requester?.name || request.requester?.email}</span>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Link href="/home">
                        <Button variant="outline" title={t('backToHome')}>
                            <Home className="mr-2 h-4 w-4" />
                            {t('backToHome')}
                        </Button>
                    </Link>
                    <Badge className="text-lg px-4 py-1">{request.status}</Badge>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-8">
                <div className="col-span-2 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Description</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p>{request.description || 'No description provided.'}</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Visual Diff</CardTitle>
                        </CardHeader>
                        <CardContent className="h-96 bg-slate-50 flex items-center justify-center border-dashed border-2 rounded-md">
                            <p className="text-muted-foreground">Visual Diff Component Placeholder (Before vs After)</p>
                            {/* TODO: Implement actual visual diff using React Flow */}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="flex flex-col gap-4">
                            {request.status === 'DRAFT' && (
                                <Button onClick={() => handleAction('submit')} className="w-full">Submit for Review</Button>
                            )}
                            {request.status === 'IN_REVIEW' && (
                                <>
                                    <Button onClick={() => handleAction('approve')} className="w-full bg-green-600 hover:bg-green-700">Approve</Button>
                                    <Button onClick={() => handleAction('reject')} variant="destructive" className="w-full">Reject</Button>
                                </>
                            )}
                            {request.status === 'APPROVED' && (
                                <Button onClick={() => handleAction('publish')} className="w-full">Publish</Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
