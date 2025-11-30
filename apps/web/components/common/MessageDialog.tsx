"use client";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useTranslations } from 'next-intl';
import { AlertCircle, CheckCircle2, Info, XCircle } from 'lucide-react';

interface MessageDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
    message: string;
    type?: 'info' | 'success' | 'error' | 'warning';
}

export function MessageDialog({
    open,
    onOpenChange,
    title,
    message,
    type = 'info',
}: MessageDialogProps) {
    const t = useTranslations('Common');
    
    const icons = {
        info: <Info className="h-5 w-5 text-blue-500" />,
        success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        error: <XCircle className="h-5 w-5 text-red-500" />,
        warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
    };
    
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {icons[type]}
                        {title}
                    </DialogTitle>
                    <DialogDescription className="pt-2">
                        {message}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button onClick={() => onOpenChange(false)}>
                        {t('ok') || 'OK'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

