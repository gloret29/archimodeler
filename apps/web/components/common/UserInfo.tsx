"use client";

import { useEffect, useState, useTransition } from 'react';
import { User, LogOut, Settings, MessageCircle, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { api } from '@/lib/api/client';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useRouter, usePathname } from '@/navigation';
import { useTranslations, useLocale } from 'next-intl';
import { useSearchParams } from 'next/navigation';
import { useUnreadMessages } from '@/hooks/useUnreadMessages';
import { useChatSenders } from '@/hooks/useChatSenders';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useChatContext } from '@/contexts/ChatContext';

interface UserData {
    id: string;
    name: string;
    email: string;
    roles?: Array<{ name: string }>;
}

export function UserInfo() {
    const [user, setUser] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const [isPending, startTransition] = useTransition();
    const t = useTranslations('Home');
    const { getUnreadCount, getAllUnreadCount } = useUnreadMessages();
    const { getAllSenders } = useChatSenders();
    const { openChat } = useChatContext();

    useEffect(() => {
        const fetchUser = async () => {
            try {
                const token = localStorage.getItem('accessToken');
                if (!token) {
                    setLoading(false);
                    return;
                }

                const userData = await api.get<UserData>('/users/me');
                setUser(userData);
            } catch (error: any) {
                // Ne logger l'erreur que si ce n'est pas une erreur d'authentification attendue
                if (error.status === 401) {
                    // Token expired or invalid - redirection silencieuse
                    localStorage.removeItem('accessToken');
                    // Ne pas rediriger si on est déjà sur la page de login
                    if (window.location.pathname !== '/') {
                        router.push('/');
                    }
                } else {
                    // Autres erreurs (réseau, serveur, etc.)
                    console.error('Failed to fetch user:', error);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchUser();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem('accessToken');
        router.push('/');
    };

    const handleLanguageChange = async (newLocale: 'en' | 'fr') => {
        if (newLocale === locale) return; // Already on this locale

        try {
            // Save locale preference to backend
            await api.put('/users/me/locale', { locale: newLocale });
            
            // Build the new URL with search params preserved
            const searchString = searchParams.toString();
            const newPath = searchString ? `${pathname}?${searchString}` : pathname;
            
            // Change locale immediately, preserving search params
            // Use window.location to ensure query params are preserved
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const newPathWithLocale = currentPath.replace(`/${locale}`, `/${newLocale}`);
                const fullUrl = newPathWithLocale + (searchString ? `?${searchString}` : '');
                window.location.href = fullUrl;
            } else {
                startTransition(() => {
                    router.replace(newPath, { locale: newLocale });
                });
            }
        } catch (error) {
            console.error('Failed to change language:', error);
            // Still try to change locale even if save fails
            const searchString = searchParams.toString();
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const newPathWithLocale = currentPath.replace(`/${locale}`, `/${newLocale}`);
                const fullUrl = newPathWithLocale + (searchString ? `?${searchString}` : '');
                window.location.href = fullUrl;
            } else {
                const newPath = searchString ? `${pathname}?${searchString}` : pathname;
                startTransition(() => {
                    router.replace(newPath, { locale: newLocale });
                });
            }
        }
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    if (loading) {
        return (
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
                <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
        );
    }

    if (!user) {
        return null;
    }

    const totalUnread = getAllUnreadCount();
    const senders = getAllSenders();
    const sendersWithUnread = senders.filter(s => getUnreadCount(s.id) > 0);

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2 relative">
                    <div className="relative">
                        <Avatar className="h-8 w-8">
                            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                                {getInitials(user.name || user.email)}
                            </AvatarFallback>
                        </Avatar>
                        {totalUnread > 0 && (
                            <div className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
                                <span className="text-[10px] font-bold text-white">
                                    {totalUnread > 9 ? '9+' : totalUnread}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex flex-col items-start">
                        <span className="text-sm font-medium leading-none">
                            {user.name || user.email}
                        </span>
                        {user.roles && user.roles.length > 0 && (
                            <span className="text-xs text-muted-foreground leading-none mt-0.5">
                                {user.roles.map(r => r.name).join(', ')}
                            </span>
                        )}
                    </div>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{user.name || 'User'}</p>
                        <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {sendersWithUnread.length > 0 && (
                    <>
                        <div className="px-2 py-1.5">
                            <p className="text-xs font-semibold text-muted-foreground mb-1">Messages</p>
                            <ScrollArea className="h-48">
                                <div className="space-y-1">
                                    {sendersWithUnread.map((sender) => {
                                        const unreadCount = getUnreadCount(sender.id);
                                        return (
                                            <div
                                                key={sender.id}
                                                className="flex items-center gap-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                                                onClick={() => {
                                                    openChat(sender.id, sender.name, sender.color);
                                                }}
                                            >
                                                <div className="relative flex-shrink-0">
                                                    <div
                                                        className="h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                                                        style={{ backgroundColor: sender.color }}
                                                    >
                                                        {sender.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    {unreadCount > 0 && (
                                                        <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 flex items-center justify-center border-2 border-background">
                                                            <span className="text-[9px] font-bold text-white">
                                                                {unreadCount > 9 ? '9+' : unreadCount}
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium truncate">{sender.name}</p>
                                                    {sender.lastMessage && (
                                                        <p className="text-xs text-muted-foreground truncate">
                                                            {sender.lastMessage}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </ScrollArea>
                        </div>
                        <DropdownMenuSeparator />
                    </>
                )}
                
                <DropdownMenuItem onClick={() => router.push('/settings/profile')}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>{t('settings')}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                        <Languages className="mr-2 h-4 w-4" />
                        <span>{locale === 'fr' ? 'Français' : 'English'}</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                        <DropdownMenuItem 
                            onClick={() => handleLanguageChange('fr')}
                            className={locale === 'fr' ? 'bg-accent' : ''}
                        >
                            <span className="mr-2">🇫🇷</span>
                            <span>Français</span>
                            {locale === 'fr' && <span className="ml-auto text-xs">✓</span>}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                            onClick={() => handleLanguageChange('en')}
                            className={locale === 'en' ? 'bg-accent' : ''}
                        >
                            <span className="mr-2">🇬🇧</span>
                            <span>English</span>
                            {locale === 'en' && <span className="ml-auto text-xs">✓</span>}
                        </DropdownMenuItem>
                    </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>{t('logout')}</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

