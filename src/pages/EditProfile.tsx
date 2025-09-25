import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, useLoaderData } from 'react-router-dom';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ArrowLeft, 
  Save, 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Cake, 
  Check, 
  X, 
  Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '../components/ui/rich-text-editor';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../hooks/useAuth';
import { auth, db } from '../services/firebase';
import { motion } from 'framer-motion';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { syncDenormalizedUserData } from '../services/denormalizedFriendships';
import { User as UserModel } from '../models';

const editProfileSchema = z.object({
  displayName: z.string().min(2, 'O nome deve ter pelo menos 2 caracteres'),
  nickname: z.string()
    .min(3, 'O apelido deve ter pelo menos 3 caracteres')
    .max(25, 'O apelido deve ter no máximo 25 caracteres')
    .regex(/^[a-z0-9-_]+$/, 'Apenas letras minúsculas, números, hífens e underlines são permitidos'),
  bio: z.string().max(500, 'A bio deve ter no máximo 500 caracteres').optional(),
  location: z.string().max(50, 'A localização deve ter no máximo 50 caracteres').optional(),
  website: z.string().url('URL inválida').optional().or(z.literal('')),
  birthDay: z.string().optional(),
  birthMonth: z.string().optional(),
  birthYear: z.string().optional(),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

// # atualizado: Função de conversão de data movida para fora do componente para clareza
const convertFirestoreDate = (date: any): Date | null => {
  if (!date) return null;
  if (typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
  }
  if (date instanceof Date) {
    return date;
  }
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null;
}

export const EditProfile = () => {
  const profile = useLoaderData() as UserModel;
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>('idle');
  const [nicknameCheckTimeout, setNicknameCheckTimeout] = useState<NodeJS.Timeout | null>(null);

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      displayName: '',
      nickname: '',
      bio: '',
      location: '',
      website: '',
      birthDay: '',
      birthMonth: '',
      birthYear: '',
    },
  });

  // # atualizado: Lógica do useEffect simplificada e corrigida
  useEffect(() => {
    if (profile) {
      let birthDay = '', birthMonth = '', birthYear = '';
      const date = convertFirestoreDate(profile.birthDate);

      if (date) {
        birthDay = date.getDate().toString();
        birthMonth = (date.getMonth() + 1).toString();
        birthYear = date.getFullYear().toString();
      }

      form.reset({
        displayName: profile.displayName || '',
        nickname: profile.nickname || '',
        bio: profile.bio || '',
        location: profile.location || '',
        website: profile.website || '',
        birthDay,
        birthMonth,
        birthYear,
      });

      // Define o status inicial do nickname como 'available' se já pertencer ao usuário
      if(profile.nickname) {
        setNicknameStatus('available');
      }
    }
  }, [profile, form]);


  const checkNicknameAvailability = async (nickname: string): Promise<boolean> => {
    if (!nickname || nickname.length < 3) return false;
    
    try {
      const q = query(collection(db, 'users'), where('nickname', '==', nickname));
      const querySnapshot = await getDocs(q);
      
      if (!querySnapshot.empty) {
        const existingUser = querySnapshot.docs[0];
        return existingUser.id === user?.uid;
      }
      
      return true;
    } catch (error) {
      console.error('Erro ao verificar nickname:', error);
      return false;
    }
  };

  const handleNicknameChange = (inputValue: string) => {
    const cleaned = inputValue.replace(/[^a-z0-9-_]/g, '').toLowerCase();
    form.setValue('nickname', cleaned, { shouldDirty: true, shouldValidate: true });
  
    if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
  
    if (cleaned === profile.nickname) {
        setNicknameStatus('available');
        return;
    }

    if (!cleaned || cleaned.length < 3) {
      setNicknameStatus('idle');
      return;
    }
  
    if (!/^[a-z0-9-_]+$/.test(cleaned)) {
      setNicknameStatus('invalid');
      return;
    }
  
    setNicknameStatus('checking');
  
    const timeout = setTimeout(async () => {
      const isAvailable = await checkNicknameAvailability(cleaned);
      setNicknameStatus(isAvailable ? 'available' : 'taken');
    }, 500);
  
    setNicknameCheckTimeout(timeout);
  };

  useEffect(() => {
    return () => {
      if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
    };
  }, [nicknameCheckTimeout]);

  const handleSubmit = async (data: EditProfileForm) => {
    if (!user || !profile) return;
    
    if (nicknameStatus === 'taken' || nicknameStatus === 'invalid' || nicknameStatus === 'checking') {
      toastErrorClickable('Nickname não está disponível ou é inválido');
      return;
    }

    setIsLoading(true);
    try {
      let birthDate = null;
      if (data.birthDay && data.birthMonth && data.birthYear) {
        birthDate = new Date(
          parseInt(data.birthYear),
          parseInt(data.birthMonth) - 1,
          parseInt(data.birthDay)
        );
      }

      await updateProfile(user, { displayName: data.displayName });

      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName: data.displayName,
        nickname: data.nickname,
        bio: data.bio || '',
        location: data.location || '',
        website: data.website || '',
        birthDate: birthDate,
        updatedAt: new Date(),
      });

      await syncDenormalizedUserData(user.uid);

      toastSuccessClickable('Perfil atualizado com sucesso!');
      navigate('/profile/me');
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      toastErrorClickable('Erro ao atualizar perfil. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  const getNicknameStatusIcon = () => {
    switch (nicknameStatus) {
      case 'checking': return <Loader2 className="h-4 w-4 text-gray-400 animate-spin" />;
      case 'available': return <Check className="h-4 w-4 text-green-600" />;
      case 'taken': return <X className="h-4 w-4 text-red-600" />;
      case 'invalid': return <X className="h-4 w-4 text-red-600" />;
      default: return null;
    }
  };
  
  const getNicknameStatusMessage = () => {
    switch (nicknameStatus) {
      case 'checking': return 'Verificando...';
      case 'available': return 'Apelido disponível!';
      case 'taken': return 'Este apelido já está em uso';
      case 'invalid': return 'Formato inválido';
      default: return 'Seu identificador único no site';
    }
  };
  
  const getNicknameStatusColor = () => {
    switch (nicknameStatus) {
      case 'available': return 'text-green-600';
      case 'taken':
      case 'invalid': return 'text-red-600';
      default: return 'text-gray-500';
    }
  };

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card>
            <CardHeader className="space-y-1">
              <div className="flex items-center space-x-4 mb-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate(-1)}
                  className="rounded-full"
                >
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl">Editar Perfil</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Seu nome completo"
                      className="pl-10"
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
                  <label className="text-sm font-medium text-gray-700">Apelido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">@</span>
                    <Input
                      type="text"
                      placeholder="seu-nickname"
                      className={`pl-10 border-2 ${nicknameStatus === 'available' ? 'border-green-600' : ''} ${nicknameStatus === 'taken' || nicknameStatus === 'invalid' ? 'border-red-600' : ''}`}
                      {...form.register('nickname', {
                        onChange: (e) => handleNicknameChange(e.target.value),
                      })}
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {getNicknameStatusIcon()}
                    </div>
                  </div>
                  <p className={`text-sm ${getNicknameStatusColor()}`}>
                    {getNicknameStatusMessage()}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <RichTextEditor
                    content={form.watch('bio') || ''}
                    onChange={(content) => form.setValue('bio', content, { shouldValidate: true })}
                    placeholder="Conte um pouco sobre você..."
                    maxLength={500}
                    className="min-h-[120px]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Data de Nascimento</label>
                  <div className="flex space-x-2">
                    <Select onValueChange={(value) => form.setValue('birthDay', value)} value={form.watch('birthDay')}>
                      <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                      <SelectContent>{days.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={(value) => form.setValue('birthMonth', value)} value={form.watch('birthMonth')}>
                      <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                      <SelectContent>{months.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select onValueChange={(value) => form.setValue('birthYear', value)} value={form.watch('birthYear')}>
                      <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                      <SelectContent>{years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Localização</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="text"
                      placeholder="Cidade, Estado"
                      className="pl-10"
                      {...form.register('location')}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Website</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="url"
                      placeholder="https://seusite.com"
                      className="pl-10"
                      {...form.register('website')}
                    />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="flex-1 rounded-full"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isLoading || nicknameStatus === 'taken' || nicknameStatus === 'invalid' || nicknameStatus === 'checking'}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Salvar</>}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};