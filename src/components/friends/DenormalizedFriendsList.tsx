import React, { useState } from 'react';
import { Search, Users, UserPlus, Clock, MoreVertical, ChevronDown, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { OptimizedAvatar } from '@/components/ui/optimized-avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { useDenormalizedFriends } from '../../hooks/useDenormalizedFriends';
import { DenormalizedFriendship, SortOption, SortDirection } from '../../models/friendship';
import { formatDistanceToNow } from 'date-fns';
import { SortDropdown } from './SortDropdown';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';

/**
 * Componente para exibir um amigo individual
 */
interface FriendCardProps {
  friendship: DenormalizedFriendship;
  onAction: () => void;
  actionLabel: string;
  actionVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  showDate?: boolean;
}

const FriendCard = React.forwardRef<HTMLDivElement, FriendCardProps>(
  ({ friendship, onAction, actionLabel, actionVariant = 'outline', showDate = true }, ref) => {
    const { friend } = friendship;
    const [showMenu, setShowMenu] = useState(false);
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
      >
        <div className="flex items-start space-x-3 mb-3">
          <OptimizedAvatar
            src={friend.photoURL}
            alt={friend.displayName}
            fallback={friend.displayName}
            size="md"
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  <Link 
                    to={`/profile/${friend.nickname}`} 
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {friend.displayName}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 truncate">@{friend.nickname}</p>
              </div>
              
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onMouseEnter={() => setShowMenu(true)}
                  onMouseLeave={() => {
                    // Delay para permitir hover no menu
                    setTimeout(() => setShowMenu(false), 200);
                  }}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {showMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                    onMouseEnter={() => setShowMenu(true)}
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button
                      onClick={() => {
                        onAction();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Remover amigo
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {friend.bio && (
              <div 
                className="text-xs text-gray-500 mt-2 line-clamp-1 break-words"
                title={friend.bio.replace(/<[^>]*>/g, '')}
                dangerouslySetInnerHTML={{ __html: friend.bio }}
              />
            )}
          </div>
        </div>
        
        {showDate && friendship.friendshipDate && (
          <p className="text-xs text-gray-500 mb-3 mt-auto">
            Amigos desde {formatDistanceToNow(friendship.friendshipDate, { 
              addSuffix: true, 
              locale: ptBR 
            })}
          </p>
        )}
        
        <Button
          variant={actionVariant}
          size="sm"
          onClick={onAction}
          className="w-full mt-auto"
        >
          {actionLabel}
        </Button>
      </motion.div>
    );
  }
);

FriendCard.displayName = 'FriendCard';

/**
 * Componente para solicitações recebidas com botões duplos
 */
interface RequestCardProps {
  friendship: DenormalizedFriendship;
  onAccept: () => void;
  onReject: () => void;
}

const RequestCard = React.forwardRef<HTMLDivElement, RequestCardProps>(
  ({ friendship, onAccept, onReject }, ref) => {
    const { friend } = friendship;
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
      >
        <div className="flex items-start space-x-3 mb-3">
          <OptimizedAvatar
            src={friend.photoURL}
            alt={friend.displayName}
            fallback={friend.displayName}
            size="md"
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              <Link 
                to={`/profile/${friend.nickname}`} 
                className="hover:text-emerald-600 transition-colors"
              >
                {friend.displayName}
              </Link>
            </h3>
            <p className="text-sm text-gray-600 truncate">@{friend.nickname}</p>
            
            {friend.bio && (
              <div 
                className="text-xs text-gray-500 mt-2 line-clamp-1 break-words"
                title={friend.bio.replace(/<[^>]*>/g, '')}
                dangerouslySetInnerHTML={{ __html: friend.bio }}
              />
            )}
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-3 mt-auto">
          Enviado {formatDistanceToNow(friendship.createdAt, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
        
        <div className="flex space-x-2">
          <Button
            size="sm"
            onClick={onAccept}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700"
          >
            Aceitar
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onReject}
            className="flex-1"
          >
            Recusar
          </Button>
        </div>
      </motion.div>
    );
  }
);

RequestCard.displayName = 'RequestCard';

/**
 * Componente para solicitações enviadas com menu de exclusão
 */
interface SentRequestCardProps {
  friendship: DenormalizedFriendship;
  onCancel: () => void;
}

const SentRequestCard = React.forwardRef<HTMLDivElement, SentRequestCardProps>(
  ({ friendship, onCancel }, ref) => {
    const { friend } = friendship;
    const [showMenu, setShowMenu] = useState(false);
    const [isCanceling, setIsCanceling] = useState(false);
    
    const handleCancel = async () => {
      setIsCanceling(true);
      try {
        await onCancel();
      } finally {
        setIsCanceling(false);
        setShowMenu(false);
      }
    };
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex flex-col h-full"
      >
        <div className="flex items-start space-x-3 mb-3">
          <OptimizedAvatar
            src={friend.photoURL}
            alt={friend.displayName}
            fallback={friend.displayName}
            size="md"
            className="flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 truncate">
                  <Link 
                    to={`/profile/${friend.nickname}`} 
                    className="hover:text-emerald-600 transition-colors"
                  >
                    {friend.displayName}
                  </Link>
                </h3>
                <p className="text-sm text-gray-600 truncate">@{friend.nickname}</p>
              </div>
              
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onMouseEnter={() => setShowMenu(true)}
                  onMouseLeave={() => {
                    setTimeout(() => setShowMenu(false), 200);
                  }}
                  disabled={isCanceling}
                >
                  {isCanceling ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <MoreVertical className="h-4 w-4" />
                  )}
                </Button>
                
                {showMenu && !isCanceling && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                    onMouseEnter={() => setShowMenu(true)}
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button
                      onClick={handleCancel}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50 flex items-center"
                      disabled={isCanceling}
                    >
                      {isCanceling ? (
                        <>
                          <LoadingSpinner size="sm" className="mr-2" />
                          Cancelando...
                        </>
                      ) : (
                        'Excluir solicitação'
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {friend.bio && (
              <div 
                className="text-xs text-gray-500 mt-2 line-clamp-1 break-words"
                title={friend.bio.replace(/<[^>]*>/g, '')}
                dangerouslySetInnerHTML={{ __html: friend.bio }}
              />
            )}
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mb-3 mt-auto">
          Enviado {formatDistanceToNow(friendship.createdAt, { 
            addSuffix: true, 
            locale: ptBR 
          })}
        </p>
        
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          disabled
        >
          {isCanceling ? 'Cancelando...' : 'Pendente'}
        </Button>
      </motion.div>
    );
  }
);

SentRequestCard.displayName = 'SentRequestCard';

/**
 * Componente para item de amizade em visualização de lista
 */
interface FriendListItemProps {
  friendship: DenormalizedFriendship;
  onAction: () => void;
  actionLabel: string;
  actionVariant?: 'default' | 'destructive' | 'outline' | 'secondary';
  showDate?: boolean;
}

const FriendListItem = React.forwardRef<HTMLDivElement, FriendListItemProps>(
  ({ friendship, onAction, actionLabel, actionVariant = 'outline', showDate = true }, ref) => {
    const { friend } = friendship;
    const [showMenu, setShowMenu] = useState(false);
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center space-x-4"
      >
        <OptimizedAvatar
          src={friend.photoURL}
          alt={friend.displayName}
          fallback={friend.displayName}
          size="md"
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                <Link 
                  to={`/profile/${friend.nickname}`} 
                  className="hover:text-emerald-600 transition-colors"
                >
                  {friend.displayName}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 truncate">@{friend.nickname}</p>
              
              {showDate && friendship.friendshipDate && (
                <p className="text-xs text-gray-500 mt-1">
                  Amigos desde {formatDistanceToNow(friendship.friendshipDate, { 
                    addSuffix: true, 
                    locale: ptBR 
                  })}
                </p>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={actionVariant}
                size="sm"
                onClick={onAction}
              >
                {actionLabel}
              </Button>
              
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-8 w-8"
                  onMouseEnter={() => setShowMenu(true)}
                  onMouseLeave={() => setTimeout(() => setShowMenu(false), 200)}
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                
                {showMenu && (
                  <div 
                    className="absolute right-0 top-full mt-1 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-10"
                    onMouseEnter={() => setShowMenu(true)}
                    onMouseLeave={() => setShowMenu(false)}
                  >
                    <button
                      onClick={() => {
                        onAction();
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Remover amigo
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {friend.bio && (
            <div 
              className="text-xs text-gray-500 mt-2 line-clamp-2 break-words"
              title={friend.bio.replace(/<[^>]*>/g, '')}
              dangerouslySetInnerHTML={{ __html: friend.bio }}
            />
          )}
        </div>
      </motion.div>
    );
  }
);

FriendListItem.displayName = 'FriendListItem';

/**
 * Componente para item de solicitação recebida em visualização de lista
 */
interface RequestListItemProps {
  friendship: DenormalizedFriendship;
  onAccept: () => void;
  onReject: () => void;
}

const RequestListItem = React.forwardRef<HTMLDivElement, RequestListItemProps>(
  ({ friendship, onAccept, onReject }, ref) => {
    const { friend } = friendship;
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center space-x-4"
      >
        <OptimizedAvatar
          src={friend.photoURL}
          alt={friend.displayName}
          fallback={friend.displayName}
          size="md"
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                <Link 
                  to={`/profile/${friend.nickname}`} 
                  className="hover:text-emerald-600 transition-colors"
                >
                  {friend.displayName}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 truncate">@{friend.nickname}</p>
              
              <p className="text-xs text-gray-500 mt-1">
                Enviado {formatDistanceToNow(friendship.createdAt, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                size="sm"
                onClick={onAccept}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Aceitar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onReject}
              >
                Recusar
              </Button>
            </div>
          </div>
          
          {friend.bio && (
            <div 
              className="text-xs text-gray-500 mt-2 line-clamp-2 break-words"
              title={friend.bio.replace(/<[^>]*>/g, '')}
              dangerouslySetInnerHTML={{ __html: friend.bio }}
            />
          )}
        </div>
      </motion.div>
    );
  }
);

RequestListItem.displayName = 'RequestListItem';

/**
 * Componente para item de solicitação enviada em visualização de lista
 */
interface SentRequestListItemProps {
  friendship: DenormalizedFriendship;
  onCancel: () => void;
}

const SentRequestListItem = React.forwardRef<HTMLDivElement, SentRequestListItemProps>(
  ({ friendship, onCancel }, ref) => {
    const { friend } = friendship;
    const [isCanceling, setIsCanceling] = useState(false);
    
    const handleCancel = async () => {
      setIsCanceling(true);
      try {
        await onCancel();
      } finally {
        setIsCanceling(false);
      }
    };
    
    return (
      <motion.div
        ref={ref}
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow flex items-center space-x-4"
      >
        <OptimizedAvatar
          src={friend.photoURL}
          alt={friend.displayName}
          fallback={friend.displayName}
          size="md"
          className="flex-shrink-0"
        />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 truncate">
                <Link 
                  to={`/profile/${friend.nickname}`} 
                  className="hover:text-emerald-600 transition-colors"
                >
                  {friend.displayName}
                </Link>
              </h3>
              <p className="text-sm text-gray-600 truncate">@{friend.nickname}</p>
              
              <p className="text-xs text-gray-500 mt-1">
                Enviado {formatDistanceToNow(friendship.createdAt, { 
                  addSuffix: true, 
                  locale: ptBR 
                })}
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={isCanceling}
              >
                {isCanceling ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Cancelando...
                  </>
                ) : (
                  'Cancelar'
                )}
              </Button>
            </div>
          </div>
          
          {friend.bio && (
            <div 
              className="text-xs text-gray-500 mt-2 line-clamp-2 break-words"
              title={friend.bio.replace(/<[^>]*>/g, '')}
              dangerouslySetInnerHTML={{ __html: friend.bio }}
            />
          )}
        </div>
      </motion.div>
    );
  }
);

SentRequestListItem.displayName = 'SentRequestListItem';

/**
 * Componente para ações em massa em listas
 */
interface BulkActionsProps {
  onAction: () => void;
  actionLabel: string;
  count: number;
  variant?: 'default' | 'destructive';
  loading?: boolean;
  disabled?: boolean;
}

const BulkActions: React.FC<BulkActionsProps> = ({
  onAction,
  actionLabel,
  count,
  variant = 'default',
  loading = false,
  disabled = false
}) => {
  if (count === 0) return null;

  return (
    <Button
      variant={variant === 'destructive' ? 'destructive' : 'outline'}
      size="sm"
      onClick={onAction}
      className="ml-auto"
      disabled={disabled || loading}
    >
      {loading ? (
        <>
          <LoadingSpinner size="sm" className="mr-2" />
          Processando...
        </>
      ) : (
        `${actionLabel} todos (${count})`
      )}
    </Button>
  );
};

/**
 * Estado vazio para quando não há dados
 */
interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  icon: Icon, 
  title, description 
}) => (
  <div className="text-center py-12">
    <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
    <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

/**
 * Modal de confirmação para exclusão em massa
 */
interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  count: number;
  loading: boolean;
}

const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  loading
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Confirmar exclusão
        </h3>
        <p className="text-gray-600 mb-6">
          Tem certeza que deseja excluir todas as {count} solicitações enviadas?
          Esta ação não pode ser desfeita.
        </p>
        <div className="flex space-x-3 justify-end">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Excluindo...' : 'Excluir Todos'}
          </Button>
        </div>
      </div>
    </div>
  );
};

/**
 * Componente principal da lista de amigos denormalizada
 */
interface DenormalizedFriendsListProps {
  viewMode: 'grid' | 'list';
}

export const DenormalizedFriendsList: React.FC<DenormalizedFriendsListProps> = ({
  viewMode,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  
  const {
    friends,
    requests,
    sentRequests,
    stats,
    loading,
    loadingMore,
    error,
    hasMoreFriends,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    loadMoreFriends,
    refreshData,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    cancelSentRequest,
    cancelAllSentRequests,
  } = useDenormalizedFriends();

  const currentViewMode = viewMode;

  // Funções para ações em massa
  const acceptAllRequests = () => {
    requests.forEach(request => {
      acceptFriendRequest(request.id);
    });
  };

  const rejectAllRequests = () => {
    requests.forEach(request => {
      rejectFriendRequest(request.id);
    });
  };

  const handleDeleteAllSentRequests = async () => {
    setShowDeleteConfirm(false);
    setIsDeletingAll(true);
    try {
      await cancelAllSentRequests();
    } catch (error) {
      console.error('Erro ao excluir todas as solicitações:', error);
    } finally {
      setIsDeletingAll(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600">Carregando amigos...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-[400px] flex flex-col items-center justify-center">
        <p className="text-red-600 mb-4">{error}</p>
        <Button onClick={refreshData}>Tentar novamente</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Busca global - mantida no topo */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          type="text"
          placeholder="Buscar amigos por nome ou alcunha..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Tabs */}
      <Tabs defaultValue="friends" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="friends" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Amigos ({stats.totalFriends})</span>
          </TabsTrigger>
          <TabsTrigger value="requests" className="flex items-center space-x-2">
            <UserPlus className="h-4 w-4" />
            <span>Solicitações ({stats.pendingRequests})</span>
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Enviadas ({stats.sentRequests})</span>
          </TabsTrigger>
        </TabsList>

        {/* Aba de Amigos */}
        <TabsContent value="friends" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">
                {searchQuery ? 'Amigos encontrados' : 'Todos os amigos'}
                <span className="text-sm font-normal text-gray-500 ml-2">
                  ({friends.length})
                </span>
              </CardTitle>
              
              {/* Container para ordenação e refresh */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <SortDropdown
                  sortBy={sortField}
                  sortDirection={sortDirection}
                  onSortChange={(field, direction) => {
                    setSortField(field);
                    setSortDirection(direction);
                  }}
                />
                <Button 
                  onClick={refreshData} 
                  variant="outline" 
                  size="icon" 
                  className="h-8 w-8"
                  title="Recarregar amigos"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {friends.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title={searchQuery ? 'Nenhum amigo encontrado' : 'Nenhum amigo ainda'}
                  description={searchQuery ? 'Tente buscar por outro termo' : 'Comece adicionando amigos'}
                />
              ) : (
                <>
                  {/* Renderização condicional baseada no viewMode */}
                  {currentViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {friends.map((friendship) => (
                          <FriendCard
                            key={friendship.id}
                            friendship={friendship}
                            onAction={() => removeFriend(friendship.id)}
                            actionLabel="Remover"
                            actionVariant="outline"
                            showDate={true}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {friends.map((friendship) => (
                          <FriendListItem
                            key={friendship.id}
                            friendship={friendship}
                            onAction={() => removeFriend(friendship.id)}
                            actionLabel="Remover"
                            actionVariant="outline"
                            showDate={true}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                  
                  {/* Botão carregar mais */}
                  {hasMoreFriends && !searchQuery && friends.length > 0 && (
                    <div className="text-center mt-6">
                      <Button onClick={loadMoreFriends} variant="outline" disabled={loadingMore}>
                        {loadingMore ? (
                          <>
                            <LoadingSpinner size="sm" className="mr-2" />
                            Carregando...
                          </>
                        ) : (
                          'Carregar mais amigos'
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Abas de Solicitações (sem ordenação) */}
        <TabsContent value="requests" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Solicitações recebidas</CardTitle>
              <div className="flex space-x-2">
                <BulkActions
                  onAction={acceptAllRequests}
                  actionLabel="Aceitar"
                  count={requests.length}
                />
                <BulkActions
                  onAction={rejectAllRequests}
                  actionLabel="Recusar"
                  count={requests.length}
                  variant="destructive"
                />
              </div>
            </CardHeader>
            <CardContent>
              {requests.length === 0 ? (
                <EmptyState
                  icon={UserPlus}
                  title={searchQuery ? 'Nenhuma solicitação encontrada' : 'Nenhuma solicitação pendente'}
                  description={searchQuery ? 'Tente buscar por outro termo' : 'Quando alguém enviar uma solicitação, ela aparecerá aqui'}
                />
              ) : (
                <>
                  {/* Renderização condicional baseada no viewMode */}
                  {currentViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {requests.map((friendship) => (
                          <RequestCard
                            key={friendship.id}
                            friendship={friendship}
                            onAccept={() => acceptFriendRequest(friendship.id)}
                            onReject={() => rejectFriendRequest(friendship.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {requests.map((friendship) => (
                          <RequestListItem
                            key={friendship.id}
                            friendship={friendship}
                            onAccept={() => acceptFriendRequest(friendship.id)}
                            onReject={() => rejectFriendRequest(friendship.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle className="text-lg">Solicitações enviadas</CardTitle>
              <BulkActions
                onAction={() => setShowDeleteConfirm(true)}
                actionLabel="Excluir"
                count={sentRequests.length}
                variant="destructive"
                disabled={sentRequests.length === 0}
              />
            </CardHeader>
            <CardContent>
              {sentRequests.length === 0 ? (
                <EmptyState
                  icon={Clock}
                  title={searchQuery ? 'Nenhuma solicitação encontrada' : 'Nenhuma solicitação enviada'}
                  description={searchQuery ? 'Tente buscar por outro termo' : 'Solicitações que você enviou aparecerão aqui'}
                />
              ) : (
                <>
                  {/* Renderização condicional baseada no viewMode */}
                  {currentViewMode === 'grid' ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <AnimatePresence mode="popLayout">
                        {sentRequests.map((friendship) => (
                          <SentRequestCard
                            key={friendship.id}
                            friendship={friendship}
                            onCancel={() => cancelSentRequest(friendship.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <AnimatePresence mode="popLayout">
                        {sentRequests.map((friendship) => (
                          <SentRequestListItem
                            key={friendship.id}
                            friendship={friendship}
                            onCancel={() => cancelSentRequest(friendship.id)}
                          />
                        ))}
                      </AnimatePresence>
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal de confirmação */}
      <DeleteConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteAllSentRequests}
        count={sentRequests.length}
        loading={isDeletingAll}
      />
    </div>
  );
};