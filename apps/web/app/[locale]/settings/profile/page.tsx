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
import { Input } from "@/components/ui/input";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";

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
                const token = localStorage.getItem('accessToken');
                const res = await fetch('http://localhost:3002/users', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const users = await res.json();
                if (users && users.length > 0) {
                    const user = users[0]; // Pick the first user
                    setUserId(user.id);
                    form.reset({
                        username: user.name || "",
                        email: user.email || "",
                    });
                }
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
            const token = localStorage.getItem('accessToken');
            const res = await fetch(`http://localhost:3002/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    name: data.username,
                    email: data.email,
                })
            });

            if (!res.ok) {
                throw new Error('Failed to update profile');
            }

            alert("Profile updated successfully!");
        } catch (error) {
            console.error(error);
            alert("Failed to update profile.");
        }
    }

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile</h3>
                <p className="text-sm text-muted-foreground">
                    This is how others will see you on the site.
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
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your name" {...field} />
                                </FormControl>
                                <FormDescription>
                                    This is your public display name.
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
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                    <Input placeholder="Your email" {...field} />
                                </FormControl>
                                <FormDescription>
                                    You can manage verified email addresses in your email settings.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                    <Button type="submit">Update profile</Button>
                </form>
            </Form>
        </div>
    );
}
