import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, query, collection, where, getDocs } from 'firebase/firestore';
import { 
  User, 
  MapPin, 
  Link as LinkIcon, 
  Calendar, 
  BookOpen, 
  Users, 
  Settings,
  Camera,
  Edit3,
  Cake,
  UserPlus,
  UserMinus,
  UserCheck,
  MessageCircle
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '../components/ui/loading-spinner';
import { useAuth } from '../hooks/useAuth';
import { db } from '../services/firebase';
import { User as UserModel } from '../models';
import { sendFriendRequest, followUser, unfollowUser, getUserAvatars } from '../services/firestore';
import { sendDenormalizedFriendRequest } from '../services/denormalizedFriendships';
import { useFriendshipStatus } from '../hooks/useDenormalizedFriends';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';
import { useImageLoad } from '../hooks/useImageLoad';
import { ProfilePhotoMenu } from '../components/profile/ProfilePhotoMenu';
import { PhotoViewer } from '../components/profile/PhotoViewer';
import { AvatarEditorModal } from '../components/ui/avatar-editor-modal';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';

export const Profile = () => {
  const { nickname } = useParams<{ nickname: string }>();
  const { user: currentUser, profile: currentProfile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [profileUser, setProfileUser] = useState<UserModel | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [showPhotoEditor, setShowPhotoEditor] = useState(false);
  const [showPhotoViewer, setShowPhotoViewer] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  
  // ✅ Usar hook denormalizado para verificar status de amizade
  const friendshipStatus = useFriendshipStatus(profileUser?.id || '');


  // Controle do carregamento do avatar
  const { isLoaded: isAvatarLoaded } = useImageLoad(
    nickname === 'me' ? currentProfile?.photoURL : profileUser?.photoURL
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (nickname === 'me') {
      if (!currentUser) {
        toastErrorClickable('Você precisa estar logado para ver seu perfil');
        navigate('/login');
        return;
      }

      if (!currentProfile || !isAvatarLoaded) {
        return;
      }

      setProfileUser(currentProfile);
      setIsOwnProfile(true);
      setLoading(false);
      return;
    }

    loadProfile();
  }, [authLoading, nickname, currentUser, currentProfile, isAvatarLoaded]);

  const [currentAvatarData, setCurrentAvatarData] = useState<{
    uploadedAt?: Date;
    id?: string;
  }>({});

  // Busca os dados do avatar quando o perfil for carregado
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
  
  const loadProfile = async () => {
    if (!isAvatarLoaded && profileUser?.photoURL) {
      return;
    }
    
    setLoading(true);

    try {
      if (!nickname) {
        navigate('/');
        return;
      }

      const q = query(
        collection(db, 'users'),
        where('nickname', '==', nickname)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        toastErrorClickable('Usuário não encontrado');
        navigate('/');
        return;
      }

      const userData = {
        ...querySnapshot.docs[0].data(),
        id: querySnapshot.docs[0].id,
      } as UserModel;

      // Converter datas do Firestore para objetos Date válidos
      const convertFirestoreDate = (date: any) => {
        if (!date) return null;
        try {
          return date.toDate ? date.toDate() : new Date(date);
        } catch (error) {
          console.warn('Erro ao converter data:', error);
          return null;
        }
      };

      // Garantir que as datas estão no formato correto
      userData.createdAt = convertFirestoreDate(userData.createdAt) || new Date();
      userData.updatedAt = convertFirestoreDate(userData.updatedAt) || new Date();
      userData.joinedAt = convertFirestoreDate(userData.joinedAt) || userData.createdAt;
      userData.birthDate = convertFirestoreDate(userData.birthDate);
      setProfileUser(userData);
      setIsOwnProfile(currentUser?.uid === userData.id);
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
      toastErrorClickable('Erro ao carregar perfil');
      navigate('/');
    } finally {
      if (isAvatarLoaded || !profileUser?.photoURL) {
        setLoading(false);
      }
    }
  };

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

  const handleFollow = async () => {
    if (!currentUser || !profileUser) return;
    
    setActionLoading(true);
    try {
      await followUser(currentUser.uid, profileUser.id);
      toastSuccessClickable('Agora você está seguindo este usuário!');
    } catch (error) {
      console.error('Erro ao seguir usuário:', error);
      toastErrorClickable('Erro ao seguir usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnfollow = async () => {
    if (!currentUser || !profileUser) return;
    
    setActionLoading(true);
    try {
      await unfollowUser(currentUser.uid, profileUser.id);
      toastSuccessClickable('Você deixou de seguir este usuário');
    } catch (error) {
      console.error('Erro ao deixar de seguir usuário:', error);
      toastErrorClickable('Erro ao deixar de seguir usuário');
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpdate = (newPhotoURL: string) => {
    if (profileUser) {
      setProfileUser({
        ...profileUser,
        photoURL: newPhotoURL
      });
    }
    
    // Forçar recarregamento do perfil do useAuth se for o próprio usuário
    if (isOwnProfile && currentProfile) {
      // O useAuth será atualizado automaticamente pelo onAuthStateChanged
      window.location.reload(); // Força reload para garantir sincronização
    }
  };

  if (loading || !isAvatarLoaded) {
    return (
      <div className="min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="flex flex-col items-center justify-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-lg text-gray-600 font-medium">
            {!isAvatarLoaded ? 'Carregando avatar...' : 'Carregando perfil...'}
          </p>
        </div>
      </div>
    );
  }

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
        {/* Header do Perfil */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="mb-8">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:items-center space-y-6 md:space-y-0 md:space-x-8">
                {/* Avatar */}
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

                {/* Informações do Usuário */}
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
                          <>
                            <Button 
                              className="rounded-full bg-emerald-600 hover:bg-emerald-700"
                              onClick={handleSendFriendRequest}
                              disabled={actionLoading}
                            >
                              <UserPlus className="h-4 w-4 mr-2" />
                              Adicionar Amigo
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Informações Adicionais */}
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
                          Nasceu em {(() => {
                            try {
                              const date = profileUser.birthDate;
                              if (!date) return 'Data não disponível';
                              
                              const validDate = date.toDate ? date.toDate() : new Date(date); 
                              
                              // Verificar se a data é válida
                              if (isNaN(validDate.getTime())) {
                                return 'Data inválida';
                              }
                              
                              return format(validDate, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
                            } catch (error) {
                              console.error('Erro ao formatar data de nascimento:', error);
                              return 'Data de aniversário inválida';
                            }
                          })()}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-3 text-gray-400" />
                      <span>
                        Membro desde {(() => {
                          try {
                            const date = profileUser.joinedAt || profileUser.createdAt;
                            if (!date) return 'Data não disponível';
                            
                            // Se for um Timestamp do Firestore
                            const validDate = date.toDate ? date.toDate() : new Date(date);
                            
                            // Verificar se a data é válida
                            if (isNaN(validDate.getTime())) {
                              return 'Data não disponível';
                            }
                            
                            return formatDistanceToNow(validDate, { addSuffix: true, locale: ptBR });
                          } catch (error) {
                            console.error('Erro ao formatar data:', error);
                            return 'Data não disponível';
                          }
                        })()}
                      </span>
                    </div>
                  </div>

                  {/* Estatísticas 
                  <div className="flex space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {profileUser.booksRead || 0}
                      </div>
                      <div className="text-sm text-gray-600">Livros lidos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {profileUser.currentlyReading || 0}
                      </div>
                      <div className="text-sm text-gray-600">Lendo agora</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {profileUser.friends?.length || 0}
                      </div>
                      <div className="text-sm text-gray-600">Amigos</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {profileUser.followers || 0}
                      </div>
                      <div className="text-sm text-gray-600">Seguidores</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-900">
                        {profileUser.following || 0}
                      </div>
                      <div className="text-sm text-gray-600">Seguindo</div>
                    </div>
                  </div> */}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Tabs de Conteúdo */}
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
            
            <TabsContent value="books" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Estante de Livros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhum livro na estante ainda</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="reviews" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Resenhas</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma resenha ainda</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="friends" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Amigos ({profileUser.friends?.length || 0})</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {isOwnProfile ? 'Você ainda não tem amigos' : 'Nenhum amigo para mostrar'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="activity" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Nenhuma atividade recente</p>
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
          onSave={(newPhotoURL) => {
            handlePhotoUpdate(newPhotoURL);
            setShowPhotoEditor(false);
          }}
          onCancel={() => setShowPhotoEditor(false)}
        />
      )}
    </div>
  );
};