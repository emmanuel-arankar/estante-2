import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  GoogleAuthProvider, 
  signInWithPopup, 
  setPersistence, 
  browserSessionPersistence, 
  browserLocalPersistence 
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Eye, EyeOff, Mail, Lock, Chrome } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { auth, db } from '../../services/firebase';
import { LoadingSpinner } from '../ui/loading-spinner';
import { generateUniqueNickname } from '../../utils/nickname';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  rememberMe: z.boolean().default(false),
});

type LoginForm = z.infer<typeof loginSchema>;

export const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  });

  const handleSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      // Configurar persistência baseada na opção "Lembrar-me"
      const persistence = data.rememberMe ? browserLocalPersistence : browserSessionPersistence;
      await setPersistence(auth, persistence);
      
      await signInWithEmailAndPassword(auth, data.email, data.password);
      
      toastSuccessClickable('Login realizado com sucesso!')
      
      console.log('🔄 Redirecionando para perfil...');
      navigate('/profile/me');
    } catch (error: any) {
      console.error('❌ Erro no login:', error);
      let errorMessage = 'Erro ao fazer login. Verifique suas credenciais.';
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Usuário não encontrado.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Senha incorreta.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email inválido.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'Conta desabilitada.';
      }
      
      toastErrorClickable(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const createUserProfile = async (user: any) => {
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    
    if (!userDoc.exists()) {
      // Criar perfil se não existir (login com Google)
      const nickname = await generateUniqueNickname(user.displayName || user.email);
      
      await setDoc(doc(db, 'users', user.uid), {
        id: user.uid,
        displayName: user.displayName || user.email.split('@')[0],
        nickname,
        email: user.email,
        photoURL: user.photoURL || '',
        bio: '',
        location: '',
        website: '',
        joinedAt: new Date(),
        booksRead: 0,
        currentlyReading: 0,
        followers: 0,
        following: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
  };
  const handleGoogleLogin = async () => {
    setIsLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Criar perfil se necessário
      await createUserProfile(result.user);
      
      toastSuccessClickable('Login com Google realizado com sucesso!');
      console.log('🔄 Redirecionando para perfil...');
      navigate('/profile/me');
    } catch (error) {
      toastErrorClickable('Erro ao fazer login com Google.');
      console.log('Erro no login com Google:', error);
    } finally {
      setIsLoading(false);
    }
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
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="email"
                placeholder="Seu email"
                className="pl-10 font-sans"
                {...form.register('email')}
              />
            </div>
            {form.formState.errors.email && (
              <p className="text-sm text-red-600 font-sans">
                {form.formState.errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="Sua senha"
                className="pl-10 pr-10 font-sans"
                {...form.register('password')}
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
            {form.formState.errors.password && (
              <p className="text-sm text-red-600 font-sans">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                {...form.register('rememberMe')}
              />
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
            disabled={isLoading}
          >
            {isLoading ? <LoadingSpinner size="sm" /> : 'Entrar'}
          </Button>
        </form>

        <Separator />

        <Button
          variant="outline"
          onClick={handleGoogleLogin}
          className="w-full rounded-full font-sans"
          disabled={isLoading}
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
