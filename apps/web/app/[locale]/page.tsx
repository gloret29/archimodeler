'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import { API_CONFIG } from '@/lib/api/config';

import { useTranslations } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  const currentLocale = useLocale();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await API_CONFIG.fetch('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: email, password }),
      });

      if (!res.ok) {
        throw new Error('Invalid credentials');
      }

      const data = await res.json();
      localStorage.setItem('accessToken', data.access_token);
      
      // Fetch user to get their locale preference
      try {
        const userRes = await API_CONFIG.fetch('/users/me', {
          headers: {
            'Authorization': `Bearer ${data.access_token}`
          }
        });
        if (userRes.ok) {
          const user = await userRes.json();
          const userLocale = user.locale || currentLocale || 'en';
          // Redirect to user's preferred locale using next-intl router
          router.push('/home', { locale: userLocale });
        } else {
          // Fallback to current locale
          router.push('/home', { locale: currentLocale });
        }
      } catch (err) {
        // Fallback to current locale if user fetch fails
        router.push('/home', { locale: currentLocale });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main id="main-content" role="main" className="flex items-center justify-center min-h-screen bg-muted/40">
      <Card className="w-[400px] shadow-lg">
        <CardHeader className="space-y-1">
          <div className="flex justify-center mb-4" role="img" aria-label="ArchiModeler Logo">
            <div className="p-3 bg-primary rounded-full">
              <Lock className="w-6 h-6 text-primary-foreground" aria-hidden="true" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center" id="login-title">ArchiModeler</CardTitle>
          <CardDescription className="text-center" id="login-description">
            {t('loginSubtitle')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4" aria-labelledby="login-title" aria-describedby="login-description">
            <div className="space-y-2">
              <Label htmlFor="email">{t('emailLabel')}</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@archimodeler.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'email-error' : undefined}
                autoComplete="email"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">{t('passwordLabel')}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                aria-required="true"
                aria-invalid={error ? 'true' : 'false'}
                aria-describedby={error ? 'password-error' : undefined}
                autoComplete="current-password"
              />
            </div>
            {error && (
              <p 
                id="login-error" 
                className="text-sm text-red-500 text-center" 
                role="alert" 
                aria-live="assertive"
              >
                {error}
              </p>
            )}
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
              aria-busy={loading}
              aria-describedby={error ? 'login-error' : undefined}
            >
              {loading ? t('loggingIn') : t('loginButton')}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex justify-center">
          <p className="text-xs text-muted-foreground" role="note">
            Demo: admin@archimodeler.com / admin123
          </p>
        </CardFooter>
      </Card>
    </main>
  );
}
