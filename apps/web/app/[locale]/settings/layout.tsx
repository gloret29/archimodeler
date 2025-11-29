"use client";

import React from 'react';
import { Link, usePathname } from '@/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { User, Palette, Globe, Home } from 'lucide-react';

interface SidebarNavProps extends React.HTMLAttributes<HTMLElement> {
    items: {
        href: string;
        title: string;
        icon: React.ReactNode;
    }[];
}

function SidebarNav({ className, items, ...props }: SidebarNavProps) {
    const pathname = usePathname();

    return (
        <nav
            className={cn(
                "flex space-x-2 lg:flex-col lg:space-x-0 lg:space-y-1",
                className
            )}
            {...props}
        >
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "justify-start flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                        pathname === item.href
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground"
                    )}
                >
                    {item.icon}
                    {item.title}
                </Link>
            ))}
        </nav>
    );
}

const sidebarNavItems = [
    {
        title: "Profile",
        href: "/settings/profile",
        icon: <User className="h-4 w-4" />,
    },
    {
        title: "Appearance",
        href: "/settings/appearance",
        icon: <Palette className="h-4 w-4" />,
    },
    // {
    //     title: "Language",
    //     href: "/settings/language",
    //     icon: <Globe className="h-4 w-4" />,
    // },
];

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="hidden space-y-6 p-10 pb-16 md:block">
            <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                    <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                    <p className="text-muted-foreground">
                        Manage your account settings and set e-mail preferences.
                    </p>
                </div>
                <Link href="/home">
                    <Button variant="outline" size="sm" className="gap-2">
                        <Home className="h-4 w-4" />
                        Back to Home
                    </Button>
                </Link>
            </div>
            <div className="my-6 border-t border-border" />
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <aside className="-mx-4 lg:w-1/5">
                    <SidebarNav items={sidebarNavItems} />
                </aside>
                <div className="flex-1 lg:max-w-2xl">{children}</div>
            </div>
        </div>
    );
}
