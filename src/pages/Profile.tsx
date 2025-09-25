import { useState, useEffect } from 'react';
import { useNavigate, useLoaderData } from 'react-router-dom';
import {
  MapPin,
  Link as LinkIcon,
  Calendar,
  BookOpen,
  Users,
  Edit3,
  Cake,
  UserPlus,
  UserCheck,
  MessageCircle,
  Camera
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '../hooks/useAuth';
import { User as UserModel } from '../models';
import { sendDenormalizedFriendRequest } from '../services/denormalizedFriendships';
import { useFriendshipStatus } from '../hooks/useDenormalizedFriends';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { ProfilePhotoMenu } from '../components/profile/ProfilePhotoMenu';
import { PhotoViewer } from '../components/profile/PhotoViewer';
import { AvatarEditorModal } from '../components/ui/avatar-editor-modal';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { getUserAvatars } from '../services/firestore';

// Função para converter datas do Firestore com segurança
const convertFirestoreDate = (date: any): Date | null => {
  if (!date) return null;
  // Se for um Timestamp do loader (serializado)
  if (typeof date === 'object' && date.seconds) {
    return new Date(date.seconds * 1000 + (date.nanoseconds || 0) / 1000000);
  }
  // Se já for um objeto Date
  if (date instanceof Date) {
    return date;
  }
  // Se for uma string ou número
  const d = new Date(date);
  if (!isNaN(d.getTime())) {
    return d;
  }
  return null;
}

export const Profile = () => {
  const initialProfileUser = useLoaderData() as UserModel;
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState<UserModel>(initialProfileUser);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAvatarData, setCurrentAvatarData] = useState<{ uploadedAt?: Date; id?: string; }>({});
  
  const friendshipStatus = useFriendshipStatus(profileUser?.id || '');

  useEffect(() => {
    setProfileUser(initialProfileUser);
    setIsOwnProfile(currentUser?.uid === initialProfileUser?.id);
  }, [initialProfileUser, currentUser]);
  
  useEffect(() => {
    const fetchAvatarData = async () => {
      if (!profileUser?.id) return;
      
      try {
        const avatars = await getUserAvatars(profileUser.id);
        const currentAvatar = avatars.find(avatar => avatar.isCurrent);
        
        if (currentAvatar) {
          setCurrentAvatarData({
            uploadedAt: currentAvatar.uploadedAt,
            id: currentAvatar.id
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do avatar:', error);
      }
    };
  
    fetchAvatarData();
  }, [profileUser?.id]);

  const handleEditProfile = () => {
    navigate('/profile/edit');
  };

  const handleSendFriendRequest = async () => {
    if (!currentUser || !profileUser) return;
    
    setActionLoading(true);
    try {
      await sendDenormalizedFriendRequest(currentUser.uid, profileUser.id);
      toastSuccessClickable('Solicitação de amizade enviada!');
    } catch (error) {
      console.error('Erro ao enviar solicitação:', error);
      toastErrorClickable('Erro ao enviar solicitação de amizade');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpdate = (newPhotoURL: string) => {
    setProfileUser(prev => ({ ...prev!, photoURL: newPhotoURL }));
    setShowPhotoEditor(false);
    
    if (isOwnProfile) {
      window.location.reload();
    }
  };

  if (!profileUser) {
    return (
        <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Usuário não encontrado</h2>
                <p className="text-gray-600 mb-4">O perfil que você está procurando não existe.</p>
                <Button onClick={() => navigate('/')}>Voltar ao início</Button>
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-80px)] bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                <div className="relative">
                  {isOwnProfile ? (
                    <ProfilePhotoMenu
                      currentPhotoURL={profileUser.photoURL}
                      onView={() => setShowPhotoViewer(true)}
                      onEdit={() => setShowPhotoEditor(true)}
                      trigger={
                        <div className="relative cursor-pointer hover:opacity-80 transition">
                          <OptimizedAvatar
                            src={profileUser.photoURL}
                            alt={profileUser.displayName}
                            fallback={profileUser.displayName}
                            size="xl"
                          />
                        </div>
                      }
                    />
                  ) : (
                    <OptimizedAvatar
                      src={profileUser.photoURL}
                      alt={profileUser.displayName}
                      fallback={profileUser.displayName}
                      size="xl"
                    />
                  )}
                  {isOwnProfile && (
                    <Button
                      size="icon"
                      variant="outline"
                      className="absolute -bottom-2 -right-2 rounded-full bg-white hover:bg-gray-50 border-2"
                      onClick={() => setShowPhotoEditor(true)}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profileUser.displayName}
                      </h1>
                      <p className="text-gray-600 mb-2">@{profileUser.nickname}</p>
                      {profileUser.bio && (
                        <div 
                          className="text-gray-700 mb-4 prose prose-sm max-w-none"
                          dangerouslySetInnerHTML={{ __html: profileUser.bio }}
                        />
                      )}
                    </div>
                    
                    {isOwnProfile ? (
                      <Button 
                        variant="outline" 
                        className="rounded-full"
                        onClick={handleEditProfile}
                      >
                        <Edit3 className="h-4 w-4 mr-2" />
                        Editar Perfil
                      </Button>
                    ) : (
                      <div className="flex space-x-2">
                        {friendshipStatus === 'friends' ? (
                          <>
                            <Button 
                              variant="outline" 
                              className="rounded-full"
                              disabled={actionLoading}
                            >
                              <UserCheck className="h-4 w-4 mr-2" />
                              Amigos
                            </Button>
                            <Button 
                              variant="outline" 
                              className="rounded-full"
                              onClick={() => navigate(`/chat/${profileUser.id}`)}
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              Mensagem
                            </Button>
                          </>
                        ) : friendshipStatus === 'request_sent' ? (
                          <Button 
                            variant="outline" 
                            className="rounded-full"
                            disabled
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Solicitação Enviada
                          </Button>
                        ) : friendshipStatus === 'request_received' ? (
                          <Button 
                            variant="outline" 
                            className="rounded-full"
                            onClick={() => {}} // TODO: Implementar aceitar solicitação
                            disabled={actionLoading}
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Solicitação Recebida
                          </Button>
                        ) : (
                          <Button 
                            className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                            onClick={handleSendFriendRequest}
                            disabled={actionLoading}
                          >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Adicionar Amigo
                          </Button>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-6">
                    {profileUser.location && (
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-3 text-gray-400" />
                        <span>{profileUser.location}</span>
                      </div>
                    )}
                    {profileUser.website && (
                      <div className="flex items-center">
                        <LinkIcon className="h-4 w-4 mr-3 text-gray-400" />
                        <a 
                          href={profileUser.website} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-emerald-600 hover:underline"
                        >
                          {profileUser.website}
                        </a>
                      </div>
                    )}
                    {profileUser.birthDate && (
                      <div className="flex items-center">
                        <Cake className="h-4 w-4 mr-3 text-gray-400" />
                        <span>
                          Nasceu em {format(convertFirestoreDate(profileUser.birthDate)!, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        Membro {formatDistanceToNow(convertFirestoreDate(profileUser.joinedAt)!, { addSuffix: true, locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="posts">Posts</TabsTrigger>
              <TabsTrigger value="books">Livros</TabsTrigger>
              <TabsTrigger value="reviews">Resenhas</TabsTrigger>
              <TabsTrigger value="friends">Amigos</TabsTrigger>
              <TabsTrigger value="activity">Atividade</TabsTrigger>
            </TabsList>
            
            <TabsContent value="posts" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Posts Recentes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum post ainda</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
      
      {showPhotoViewer && profileUser.photoURL && (
        <PhotoViewer
          imageUrl={profileUser.photoURL}
          onClose={() => setShowPhotoViewer(false)}
          userAvatar={profileUser.photoURL}
          userName={profileUser.displayName}
          userId={profileUser.id}
          avatarId={currentAvatarData.id}
          postDate={currentAvatarData.uploadedAt 
            ? format(currentAvatarData.uploadedAt, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
            : "Data não disponível"}
        />
      )}
      
      {showPhotoEditor && (
        <AvatarEditorModal
          currentPhotoURL={profileUser.photoURL}
          onSave={handlePhotoUpdate}
          onCancel={() => setShowPhotoEditor(false)}
        />
      )}
    </div>
  );
};