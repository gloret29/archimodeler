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
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const appearanceFormSchema = z.object({
    theme: z.enum(["light", "dark", "system"]),
});

type AppearanceFormValues = z.infer<typeof appearanceFormSchema>;

export default function AppearanceSettingsPage() {
    const { theme, setTheme } = useTheme();
    const t = useTranslations('Settings');
    const [mounted, setMounted] = useState(false);

    const form = useForm<AppearanceFormValues>({
        resolver: zodResolver(appearanceFormSchema),
        defaultValues: {
            theme: "system",
        },
    });

    // Wait for mount to avoid hydration mismatch
    useEffect(() => {
        setMounted(true);
    }, []);

    // Update form value when theme changes externally (e.g. initial load)
    useEffect(() => {
        if (mounted && theme) {
            form.setValue("theme", theme as "light" | "dark" | "system");
        }
    }, [theme, form, mounted]);

    function onSubmit(data: AppearanceFormValues) {
        setTheme(data.theme);
    }

    if (!mounted) {
        return null; // or a skeleton loader
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">{t('appearanceTitle')}</h3>
                <p className="text-sm text-muted-foreground">
                    {t('appearanceDescription')}
                </p>
            </div>
            <Separator />
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                    <FormField
                        control={form.control}
                        name="theme"
                        render={({ field }) => (
                            <FormItem className="space-y-1">
                                <FormLabel>{t('themeLabel')}</FormLabel>
                                <FormDescription>
                                    {t('themeDescription')}
                                </FormDescription>
                                <FormMessage />
                                <RadioGroup
                                    onValueChange={(val) => {
                                        field.onChange(val);
                                        setTheme(val); // Apply immediately for better UX
                                    }}
                                    defaultValue={field.value}
                                    value={field.value}
                                    className="grid max-w-md grid-cols-2 gap-8 pt-2"
                                >
                                    <FormItem>
                                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                            <FormControl>
                                                <RadioGroupItem value="light" className="sr-only" />
                                            </FormControl>
                                            <div className="items-center rounded-md border-2 border-muted p-1 hover:border-accent">
                                                <div className="space-y-2 rounded-sm bg-[#ecedef] p-2">
                                                    <div className="space-y-2 rounded-md bg-white p-2 shadow-sm">
                                                        <div className="h-2 w-[80px] rounded-lg bg-[#ecedef]" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-white p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-[#ecedef]" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-[#ecedef]" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="block w-full p-2 text-center font-normal">
                                                {t('themeLight')}
                                            </span>
                                        </FormLabel>
                                    </FormItem>
                                    <FormItem>
                                        <FormLabel className="[&:has([data-state=checked])>div]:border-primary">
                                            <FormControl>
                                                <RadioGroupItem value="dark" className="sr-only" />
                                            </FormControl>
                                            <div className="items-center rounded-md border-2 border-muted bg-popover p-1 hover:bg-accent hover:text-accent-foreground">
                                                <div className="space-y-2 rounded-sm bg-slate-950 p-2">
                                                    <div className="space-y-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                                        <div className="h-2 w-[80px] rounded-lg bg-slate-400" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                                    </div>
                                                    <div className="flex items-center space-x-2 rounded-md bg-slate-800 p-2 shadow-sm">
                                                        <div className="h-4 w-4 rounded-full bg-slate-400" />
                                                        <div className="h-2 w-[100px] rounded-lg bg-slate-400" />
                                                    </div>
                                                </div>
                                            </div>
                                            <span className="block w-full p-2 text-center font-normal">
                                                {t('themeDark')}
                                            </span>
                                        </FormLabel>
                                    </FormItem>
                                </RadioGroup>
                            </FormItem>
                        )}
                    />
                </form>
            </Form>
        </div>
    );
}