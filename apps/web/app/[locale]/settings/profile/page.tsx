"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { api } from '@/lib/api/client';
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { useTranslations } from "next-intl";
import { useDialog } from '@/contexts/DialogContext';

const profileFormSchema = z.object({
    username: z
        .string()
        .min(2, {
            message: "Username must be at least 2 characters.",
        })
        .max(30, {
            message: "Username must not be longer than 30 characters.",
        }),
    email: z
        .string()
        .email({
            message: "Please enter a valid email address.",
        }),
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;

export default function ProfileSettingsPage() {
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const t = useTranslations('Settings');
    const tCommon = useTranslations('Common');
    const { alert } = useDialog();

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileFormSchema),
        defaultValues: {
            username: "",
            email: "",
        },
        mode: "onChange",
    });

    useEffect(() => {
        // Simulate fetching "me". In a real app, this would be /auth/me or similar.
        // Here we fetch all users and take the first one for demonstration.
        const fetchUser = async () => {
            try {
                const user = await api.get<{ id: string; name: string; email: string }>('/users/me');
                setUserId(user.id);
                form.reset({
                    username: user.name || "",
                    email: user.email || "",
                });
            } catch (error) {
                console.error("Failed to fetch user", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUser();
    }, [form]);

    async function onSubmit(data: ProfileFormValues) {
        if (!userId) return;

        try {
            await api.put(`/users/${userId}`, {
                name: data.username,
                email: data.email,
            });

            await alert({
                title: t('success'),
                message: t('profileUpdatedSuccessfully'),
                type: 'success',
            });
        } catch (error) {
            console.error(error);
            await alert({
                title: "Error",
                message: "Failed to update profile.",
                type: 'error',
            });
        }
    }

    if (isLoading) {
        return <div>{tCommon('loading')}</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{t('profileTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('profileDescription')}
                </p>
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="username"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('usernameLabel')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('usernamePlaceholder')} {...field} />
                                </FormControl>
                                <FormDescription>
                                    {t('usernameDescription')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('emailLabel')}</FormLabel>
                                <FormControl>
                                    <Input placeholder={t('emailPlaceholder')} {...field} />
                                </FormControl>
                                <FormDescription>
                                    {t('emailDescription')}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">{t('updateProfile')}</Button>
                </form>
            </Form>
        </div>
    );
}
