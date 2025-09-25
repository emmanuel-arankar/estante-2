import { useState } from 'react';
import { Form, Link, useNavigation } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { LoadingSpinner } from '../ui/loading-spinner';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { auth } from '../../services/firebase';

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  // Lógica para login com Google permanece no cliente
  const handleGoogleLogin = async () => {
    // ... (a lógica do handleGoogleLogin permanece a mesma)
  };

  return (
    <Card className="w-full max-w-md shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center font-sans">Entrar</CardTitle> 
        <p className="text-center text-gray-600 font-sans">
          Entre em sua conta para continuar
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <Form method="post" action="/login" className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                name="email"
                placeholder="Seu email"
                className="pl-10 font-sans"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Sua senha"
                className="pl-10 pr-10 font-sans"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox id="rememberMe" name="rememberMe" />
              <label
                htmlFor="rememberMe"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 font-sans"
              >
                Lembrar-me
              </label>
            </div>
            <Link
              to="/forgot-password"
              className="text-sm text-emerald-600 hover:underline font-sans"
            >
              Esqueci minha senha
            </Link>
          </div>

          <Button
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-full font-sans"
            disabled={isSubmitting}
          >
            {isSubmitting ? <LoadingSpinner size="sm" /> : 'Entrar'}
          </Button>
        </Form>

        <Separator />

        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          className="w-full rounded-full font-sans"
          disabled={isSubmitting}
        >
          <Chrome className="h-4 w-4 mr-2" />
          Entrar com Google
        </Button>

        <div className="text-center text-sm">
          <span className="text-gray-600 font-sans">Não tem uma conta? </span>
          <Link to="/register" className="text-emerald-600 hover:underline font-medium font-sans">
            Cadastre-se
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};