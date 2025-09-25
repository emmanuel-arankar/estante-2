import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Eye, EyeOff, Mail, Lock, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth, db } from '../services/firebase';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { motion } from 'framer-motion';
import { generateUniqueNickname } from '../utils/nickname';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';

const getFirebaseErrorMessage = (error: any): string => {
  const code = error.code;
  
  const errorMap: { [key: string]: string } = {
    // Erros de autenticação
    'auth/email-already-in-use': 'Este email já está em uso. Tente fazer login.',
    'auth/invalid-email': 'Email inválido.',
    'auth/operation-not-allowed': 'Operação não permitida.',
    'auth/weak-password': 'Senha muito fraca. Use pelo menos 6 caracteres.',
    'auth/user-disabled': 'Esta conta foi desativada.',
    'auth/user-not-found': 'Usuário não encontrado.',
    'auth/wrong-password': 'Senha incorreta.',
    'auth/too-many-requests': 'Muitas tentativas. Tente novamente mais tarde.',
    'auth/requires-recent-login': 'Requer login recente.',
    'auth/provider-already-linked': 'Provedor já vinculado.',
    'auth/credential-already-in-use': 'Credencial já em uso.',
    
    // Erros gerais
    'permission-denied': 'Permissão negada.',
    'unavailable': 'Serviço indisponível.',
    'cancelled': 'Operação cancelada.',
    'deadline-exceeded': 'Tempo limite excedido.',
    
    // Default
    'unknown': 'Erro desconhecido. Tente novamente.'
  };

  return errorMap[code] || errorMap['unknown'];
};

const registerSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não conferem",
  path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      displayName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const handleSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      // Verificar se o email já existe ANTES de tentar criar
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );
      
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
      });

      // Gerar nickname único baseado no nome
      const nickname = await generateUniqueNickname(data.displayName);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        id: userCredential.user.uid,
        displayName: data.displayName,
        nickname,
        email: data.email,
        bio: '',
        location: '',
        website: '',
        birthDate: null,
        joinedAt: new Date(),
        booksRead: 0,
        currentlyReading: 0,
        followers: 0,
        following: 0,
        friends: [],
        friendRequests: [],
        sentFriendRequests: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      toastSuccessClickable('Conta criada com sucesso!');
      
      // Redirecionar imediatamente
      navigate('/profile/me');
    } catch (error: any) {
      console.error('Erro ao criar conta:', error);
      
      // Usar o utilitário para obter mensagem amigável
      const errorMessage = getFirebaseErrorMessage(error);
      toastErrorClickable(errorMessage);
      
      // Se for email já em uso, limpar o campo email
      if (error.code === 'auth/email-already-in-use') {
        form.setError('email', {
          type: 'manual',
          message: 'Este email já está em uso'
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gradient-to-br from-emerald-50 to-teal-50 flex items-center justify-center p-4 w-full overflow-x-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="w-full shadow-lg border-0">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl text-center font-sans">Criar Conta</CardTitle>
            <p className="text-gray-600">
              Junte-se à nossa comunidade de leitores
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
              <div className="space-y-2">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Seu nome"
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                    {...form.register('displayName')}
                  />
                </div>
                {form.formState.errors.displayName && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.displayName.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    placeholder="Seu email"
                    className="pl-10 bg-gray-50 border-gray-200 focus:bg-white"
                    {...form.register('email')}
                  />
                </div>
                {form.formState.errors.email && (
                  <p className="text-sm text-red-600">
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
                    className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white"
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
                  <p className="text-sm text-red-600">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirme sua senha"
                    className="pl-10 pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                    {...form.register('confirmPassword')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                {form.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 shadow-md"
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Cadastrar'}
              </Button>
            </form>

            <div className="text-center text-sm mt-4">
              <span className="text-gray-600">Já tem uma conta? </span>
              <Link 
                to="/login" 
                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
              >
                Faça login
              </Link>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};