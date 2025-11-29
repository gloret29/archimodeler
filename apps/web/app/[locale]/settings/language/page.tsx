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
import { useTransition } from "react";

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

    const form = useForm<LanguageFormValues>({
        resolver: zodResolver(languageFormSchema),
        defaultValues: {
            language: locale as "en" | "fr",
        },
    });

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
                                        // Apply immediately for better UX
                                        startTransition(() => {
                                            router.replace(pathname, { locale: val });
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
