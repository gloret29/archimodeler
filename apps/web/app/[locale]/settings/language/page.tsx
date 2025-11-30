"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { useTranslations, useLocale } from "next-intl";
import { useRouter, usePathname } from "@/navigation";
import { useTransition, useEffect, useState } from "react";
import { api } from '@/lib/api/client';

const languageFormSchema = z.object({
    language: z.enum(["en", "fr"]),
});

type LanguageFormValues = z.infer<typeof languageFormSchema>;

export default function LanguageSettingsPage() {
    const t = useTranslations('Settings');
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();
    const [isPending, startTransition] = useTransition();
    const [saving, setSaving] = useState(false);
    const [userLocale, setUserLocale] = useState<string | null>(null);

    const form = useForm<LanguageFormValues>({
        resolver: zodResolver(languageFormSchema),
        defaultValues: {
            language: locale as "en" | "fr",
        },
    });

    useEffect(() => {
        // Fetch user's locale preference from backend
        const fetchUserLocale = async () => {
            try {
                const user = await api.get<{ locale?: string }>('/users/me');
                if (user.locale && ['en', 'fr'].includes(user.locale)) {
                    setUserLocale(user.locale);
                    form.setValue('language', user.locale as "en" | "fr");
                }
            } catch (error) {
                console.error('Failed to fetch user locale:', error);
            }
        };
        fetchUserLocale();
    }, [form]);

    const saveLocale = async (newLocale: string): Promise<void> => {
        try {
            setSaving(true);
            await api.put('/users/me/locale', { locale: newLocale });
        } catch (error) {
            console.error('Failed to save locale preference:', error);
            throw error; // Re-throw to allow caller to handle
        } finally {
            setSaving(false);
        }
    };

    function onSubmit(data: LanguageFormValues) {
        startTransition(() => {
            router.replace(pathname, { locale: data.language });
        });
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{t('languageTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('languageDescription')}
                </p>
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="language"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>{t('languageLabel')}</FormLabel>
                                <FormDescription>
                                    {t('languageDescription2')}
                                </FormDescription>
                                <FormMessage />
                                <RadioGroup
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        // Save locale preference to backend first
                                        saveLocale(val).then(() => {
                                            // Then redirect to the new locale
                                            startTransition(() => {
                                                router.replace(pathname, { locale: val });
                                            });
                                        });
                                    }}
                                    defaultValue={field.value}
                                    value={field.value}
                                    className="grid max-w-md gap-4 pt-2"
                                    disabled={isPending}
                                >
                                    <FormItem>
                                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                                            <FormControl>
                                                <RadioGroupItem value="en" className="sr-only" />
                                            </FormControl>
                                            <div className="flex items-center gap-3 rounded-md border-2 border-muted p-4 hover:border-accent">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                                                    🇬🇧
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">English</div>
                                                    <div className="text-sm text-muted-foreground">United States</div>
                                                </div>
                                            </div>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary cursor-pointer">
                                            <FormControl>
                                                <RadioGroupItem value="fr" className="sr-only" />
                                            </FormControl>
                                            <div className="flex items-center gap-3 rounded-md border-2 border-muted p-4 hover:border-accent">
                                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                                                    🇫🇷
                                                </div>
                                                <div className="flex-1">
                                                    <div className="font-medium">Français</div>
                                                    <div className="text-sm text-muted-foreground">France</div>
                                                </div>
                                            </div>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormItem>
                        )}
                    />

                    {/* Language changes are applied immediately, so no submit button needed */}
                    {/* <Button type="submit" disabled={isPending}>
                        {isPending ? t('Common.loading') : t('updateLanguage')}
                    </Button> */}
                </form>
            </Form>
        </div>
    );
}
