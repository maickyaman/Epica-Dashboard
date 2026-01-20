import { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { auth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
      } else {
        await createUserWithEmailAndPassword(auth, email, password);
      }
    } catch (err: unknown) {
      let errorMessage = 'Errore sconosciuto';

      if (err instanceof Error) {
        if (err.message.includes('auth/invalid-email')) {
          errorMessage = 'Email non valida';
        } else if (err.message.includes('auth/user-not-found')) {
          errorMessage = 'Utente non trovato';
        } else if (err.message.includes('auth/wrong-password')) {
          errorMessage = 'Password errata';
        } else if (err.message.includes('auth/invalid-credential')) {
          errorMessage = 'Credenziali non valide';
        } else if (err.message.includes('auth/email-already-in-use')) {
          errorMessage = 'Email già in uso';
        } else if (err.message.includes('auth/weak-password')) {
          errorMessage = 'Password troppo debole (minimo 6 caratteri)';
        } else if (
          err.message.includes('auth/configuration-not-found') ||
          err.message.includes('auth/invalid-api-key')
        ) {
          errorMessage = 'Errore di configurazione Firebase. Verificare le credenziali in .env';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-primary/10 text-primary">
            <Lock className="h-10 w-10" />
          </div>
          <div>
            <CardTitle className="text-3xl">Epica Cloud</CardTitle>
            <CardDescription>
              Accedi alla piattaforma protetta dell'evento.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="email@esempio.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="La tua password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && (
              <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : isLogin ? (
                'Accedi'
              ) : (
                'Registrati'
              )}
            </Button>
          </form>
          <Button
            variant="link"
            className="mt-4 w-full text-muted-foreground"
            onClick={() => setIsLogin(!isLogin)}
          >
            {isLogin ? 'Crea un nuovo account' : 'Hai già un account? Accedi'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
