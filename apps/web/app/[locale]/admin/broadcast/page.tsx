"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api } from '@/lib/api/client';
import { AlertCircle, Send, CheckCircle2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function BroadcastPage() {
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [severity, setSeverity] = useState<'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS'>('INFO');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            const result = await api.post<{ count: number }>('/notifications/broadcast', {
                title: title.trim(),
                message: message.trim(),
                severity,
            });

            setSuccess(`Message envoyé avec succès à ${result.count} utilisateur(s) !`);
            setTitle('');
            setMessage('');
            setSeverity('INFO');
        } catch (err: any) {
            setError(err.message || 'Erreur lors de l\'envoi du message');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">Diffusion de messages</h1>
                <p className="text-muted-foreground mt-2">
                    Envoyer un message à tous les utilisateurs de la plateforme
                </p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Nouveau message</CardTitle>
                    <CardDescription>
                        Ce message sera visible dans la zone de notifications de tous les utilisateurs
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="title">Titre *</Label>
                            <Input
                                id="title"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                placeholder="Titre du message"
                                required
                                maxLength={200}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="severity">Niveau de sévérité</Label>
                            <Select value={severity} onValueChange={(value: any) => setSeverity(value)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="INFO">Information (Bleu)</SelectItem>
                                    <SelectItem value="SUCCESS">Succès (Vert)</SelectItem>
                                    <SelectItem value="WARNING">Avertissement (Jaune)</SelectItem>
                                    <SelectItem value="ERROR">Erreur (Rouge)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">Message *</Label>
                            <Textarea
                                id="message"
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                placeholder="Contenu du message"
                                required
                                rows={6}
                                maxLength={1000}
                            />
                            <p className="text-xs text-muted-foreground">
                                {message.length}/1000 caractères
                            </p>
                        </div>

                        {error && (
                            <Alert variant="destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription>{error}</AlertDescription>
                            </Alert>
                        )}

                        {success && (
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                                <CheckCircle2 className="h-4 w-4 text-green-600" />
                                <AlertDescription className="text-green-800 dark:text-green-200">
                                    {success}
                                </AlertDescription>
                            </Alert>
                        )}

                        <div className="flex justify-end gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setTitle('');
                                    setMessage('');
                                    setSeverity('INFO');
                                    setError(null);
                                    setSuccess(null);
                                }}
                                disabled={loading}
                            >
                                Réinitialiser
                            </Button>
                            <Button type="submit" disabled={loading || !title.trim() || !message.trim()}>
                                <Send className="mr-2 h-4 w-4" />
                                {loading ? 'Envoi en cours...' : 'Envoyer à tous les utilisateurs'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}

