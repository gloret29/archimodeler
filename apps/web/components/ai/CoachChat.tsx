'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, Send, Sparkles } from 'lucide-react';
import { API_CONFIG } from '@/lib/api/config';
import { useTranslations } from 'next-intl';

interface Message {
    role: 'user' | 'assistant';
    content: string;
}

interface CoachChatProps {
    sidebarWidth?: number;
}

export default function CoachChat({ sidebarWidth = 320 }: CoachChatProps) {
    const t = useTranslations('Coach');
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSend = async () => {
        if (!input.trim()) return;

        const userMsg: Message = { role: 'user', content: input };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setLoading(true);

        try {
            const res = await API_CONFIG.fetch('/ai/coach', {
                method: 'POST',
                body: JSON.stringify({ question: userMsg.content })
            });
            const data = await res.text();
            setMessages(prev => [...prev, { role: 'assistant', content: data }]);
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'assistant', content: t('error') }]);
        } finally {
            setLoading(false);
        }
    };

    // Calculate position to be left of the Repository sidebar
    const margin = 16; // 1rem = 16px
    const rightPosition = sidebarWidth + margin;

    if (!isOpen) {
        return (
            <Button
                className="fixed bottom-4 rounded-full w-12 h-12 shadow-lg z-40"
                onClick={() => setIsOpen(true)}
                style={{ right: `${rightPosition}px` }}
            >
                <MessageCircle />
            </Button>
        );
    }

    return (
        <Card className="fixed bottom-4 w-96 h-[500px] shadow-xl flex flex-col z-30" style={{ right: `${rightPosition}px` }}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-500" />
                    {t('title')}
                </CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>X</Button>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col p-0">
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.length === 0 && (
                            <p className="text-sm text-muted-foreground text-center mt-8">
                                {t('welcomeMessage')}
                            </p>
                        )}
                        {messages.map((msg, i) => (
                            <div
                                key={i}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div
                                    className={`max-w-[80%] rounded-lg p-3 text-sm ${msg.role === 'user'
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted'
                                        }`}
                                >
                                    {msg.content}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="flex justify-start">
                                <div className="bg-muted rounded-lg p-3 text-sm animate-pulse">{t('thinking')}</div>
                            </div>
                        )}
                    </div>
                </ScrollArea>
                <div className="p-4 border-t flex gap-2">
                    <Textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        placeholder={t('askQuestion')}
                        className="min-h-[40px] max-h-[100px]"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend();
                            }
                        }}
                    />
                    <Button size="icon" onClick={handleSend} disabled={loading}>
                        <Send className="w-4 h-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
