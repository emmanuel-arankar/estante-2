import { useState, useEffect } from 'react';
import { useNavigate, useLoaderData, Form, useNavigation } from 'react-router-dom';
import { doc, collection, query, where, getDocs } from 'firebase/firestore';
import { 
  ArrowLeft, Save, User, MapPin, Link as LinkIcon, Cake, Check, X, Loader2 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RichTextEditor } from '../components/ui/rich-text-editor';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { motion } from 'framer-motion';
import { User as UserModel } from '../models';

const convertFirestoreDate = (date: any): Date | null => {
  if (!date) return null;
  if (typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
  }
  if (date instanceof Date) return date;
  const d = new Date(date);
  return !isNaN(d.getTime()) ? d : null;
}

export const EditProfile = () => {
  const profile = useLoaderData() as UserModel;
  const { user } = useAuth();
  const navigate = useNavigate();
  const navigation = useNavigation();
  const isSubmitting = navigation.state === 'submitting';

  const [nickname, setNickname] = useState(profile.nickname || '');
  const [nicknameStatus, setNicknameStatus] = useState<'idle' | 'checking' | 'available' | 'taken' | 'invalid'>(profile.nickname ? 'available' : 'idle');
  const [nicknameCheckTimeout, setNicknameCheckTimeout] = useState<NodeJS.Timeout | null>(null);
  const [bioContent, setBioContent] = useState(profile.bio || '');

  const date = convertFirestoreDate(profile.birthDate);
  const defaultBirthDay = date ? date.getDate().toString() : '';
  const defaultBirthMonth = date ? (date.getMonth() + 1).toString() : '';
  const defaultBirthYear = date ? date.getFullYear().toString() : '';

  const checkNicknameAvailability = async (newNickname: string): Promise<boolean> => {
    if (!newNickname || newNickname.length < 3) return false;
    const q = query(collection(db, 'users'), where('nickname', '==', newNickname));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return querySnapshot.docs[0].id === user?.uid;
    }
    return true;
  };

  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const cleaned = e.target.value.replace(/[^a-z0-9-_]/g, '').toLowerCase();
    setNickname(cleaned);

    if (nicknameCheckTimeout) clearTimeout(nicknameCheckTimeout);
    if (cleaned === profile.nickname) {
        setNicknameStatus('available');
        return;
    }
    if (!cleaned || cleaned.length < 3) {
      setNicknameStatus('idle');
      return;
    }
    setNicknameStatus('checking');
    const timeout = setTimeout(async () => {
      const isAvailable = await checkNicknameAvailability(cleaned);
      setNicknameStatus(isAvailable ? 'available' : 'taken');
    }, 500);
    setNicknameCheckTimeout(timeout);
  };
  
  // ... (getNicknameStatusIcon, getNicknameStatusMessage, getNicknameStatusColor) ...

  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString());
  const months = Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }) }));
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 100 }, (_, i) => (currentYear - i).toString());

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-4 mb-4">
                <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="rounded-full">
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <CardTitle className="text-2xl">Editar Perfil</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Form method="post" action="/profile/edit" className="space-y-4">
                {/* Campos do Formulário */}
                <div className="space-y-2">
                  <label htmlFor="displayName" className="text-sm font-medium text-gray-700">Nome</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="displayName" name="displayName" type="text" defaultValue={profile.displayName} className="pl-10" required />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="nickname" className="text-sm font-medium text-gray-700">Apelido</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm text-gray-500">@</span>
                    <Input id="nickname" name="nickname" type="text" value={nickname} onChange={handleNicknameChange} className="pl-10" required />
                    {/* ... (ícone de status) ... */}
                  </div>
                  {/* ... (mensagem de status) ... */}
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Bio</label>
                  <input type="hidden" name="bio" value={bioContent} />
                  <RichTextEditor content={bioContent} onChange={setBioContent} maxLength={500} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Data de Nascimento</label>
                  <div className="flex space-x-2">
                    <Select name="birthDay" defaultValue={defaultBirthDay}>
                        <SelectTrigger><SelectValue placeholder="Dia" /></SelectTrigger>
                        <SelectContent>{days.map(day => <SelectItem key={day} value={day}>{day}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select name="birthMonth" defaultValue={defaultBirthMonth}>
                        <SelectTrigger><SelectValue placeholder="Mês" /></SelectTrigger>
                        <SelectContent>{months.map(month => <SelectItem key={month.value} value={month.value}>{month.label}</SelectItem>)}</SelectContent>
                    </Select>
                    <Select name="birthYear" defaultValue={defaultBirthYear}>
                        <SelectTrigger><SelectValue placeholder="Ano" /></SelectTrigger>
                        <SelectContent>{years.map(year => <SelectItem key={year} value={year}>{year}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="location" className="text-sm font-medium text-gray-700">Localização</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="location" name="location" type="text" defaultValue={profile.location} className="pl-10" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="website" className="text-sm font-medium text-gray-700">Website</label>
                  <div className="relative">
                    <LinkIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input id="website" name="website" type="url" defaultValue={profile.website} className="pl-10" />
                  </div>
                </div>

                <div className="flex space-x-4 pt-6">
                  <Button type="button" variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-full">Cancelar</Button>
                  <Button type="submit" disabled={isSubmitting || nicknameStatus !== 'available'} className="flex-1 bg-emerald-600 hover:bg-emerald-700 rounded-full">
                    {isSubmitting ? <LoadingSpinner size="sm" /> : <><Save className="h-4 w-4 mr-2" /> Salvar Alterações</>}
                  </Button>
                </div>
              </Form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
};