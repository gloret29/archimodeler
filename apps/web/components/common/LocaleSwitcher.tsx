'use client';

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/navigation';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Globe } from 'lucide-react';

const locales = [
    { value: 'en', label: 'English' },
    { value: 'fr', label: 'Français' },
];

export function LocaleSwitcher() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const handleLocaleChange = (newLocale: string) => {
        // Replace the locale in the pathname
        const segments = pathname.split('/');
        segments[1] = newLocale; // Replace the locale segment
        const newPath = segments.join('/');
        router.push(newPath);
    };

    return (
        <div className="flex items-center gap-2">
            <Globe className="h-4 w-4 text-muted-foreground" />
            <Select value={locale} onValueChange={handleLocaleChange}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    {locales.map((loc) => (
                        <SelectItem key={loc.value} value={loc.value}>
                            {loc.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}

