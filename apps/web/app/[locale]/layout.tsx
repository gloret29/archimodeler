import type { Metadata } from "next";
import localFont from "next/font/local";
import "../globals.css";
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { ChatProvider } from "@/contexts/ChatContext"
import { DialogProvider } from "@/contexts/DialogContext"
import { LocaleSync } from "@/components/common/LocaleSync"
import { SkipToContent } from "@/components/accessibility/SkipToContent"
import { LiveRegion } from "@/components/accessibility/LiveRegion"

const geistSans = localFont({
    src: "../fonts/GeistVF.woff",
    variable: "--font-geist-sans",
});
const geistMono = localFont({
    src: "../fonts/GeistMonoVF.woff",
    variable: "--font-geist-mono",
});

export const metadata: Metadata = {
    title: "ArchiModeler",
    description: "Enterprise Architecture Modeling Tool",
};

export default async function RootLayout({
    children,
    params
}: Readonly<{
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
}>) {
    const { locale } = await params;
    const messages = await getMessages();

    return (
        <html lang={locale} suppressHydrationWarning>
            <body className={`${geistSans.variable} ${geistMono.variable}`}>
                <NextIntlClientProvider messages={messages}>
                    <ThemeProvider
                        attribute="class"
                        defaultTheme="system"
                        enableSystem
                        disableTransitionOnChange
                    >
                        <ChatProvider>
                            <DialogProvider>
                                <SkipToContent />
                                <LiveRegion message="" />
                                <LocaleSync />
                                {children}
                                <Toaster />
                            </DialogProvider>
                        </ChatProvider>
                    </ThemeProvider>
                </NextIntlClientProvider>
            </body>
        </html>
    );
}
