import { useState, useEffect, useCallback, useRef } from 'react';
import { useMemo } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { useAuth } from './useAuth';
import Fuse from 'fuse.js';
import {
  DenormalizedFriendship,
  FriendshipStats,
  UseFriendsResult,
  FriendshipActions,
  SortOption,
  SortDirection
} from '../models/friendship';
import {
  getDenormalizedFriends,
  getDenormalizedFriendRequests,
  getDenormalizedSentRequests,
  subscribeToDenormalizedFriends,
  subscribeToDenormalizedRequests,
  subscribeToDenormalizedSentRequests,
  sendDenormalizedFriendRequest,
  acceptDenormalizedFriendRequest,
  rejectDenormalizedFriendRequest,
  removeDenormalizedFriend,
} from '../services/denormalizedFriendships';
import { toastSuccessClickable, toastErrorClickable } from '@/components/ui/toast';

// ==================== CACHE INTELIGENTE ====================
interface FriendsCache {
  [key: string]: {
    data: DenormalizedFriendship[];
    timestamp: number;
    lastDoc?: DocumentSnapshot;
  };
}

const friendsCache: FriendsCache = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

const getCacheKey = (userId: string, type: string) => `${userId}_${type}`;

const isCacheValid = (timestamp: number) => {
  return Date.now() - timestamp < CACHE_DURATION;
};

/**
 * Hook principal para gerenciar amizades denormalizadas
 * ✅ Carregamento inteligente de TODOS os amigos
 * ✅ Dados completos sem queries extras
 * ✅ Tempo real com onSnapshot
 * ✅ Cache inteligente e virtualização
 * ✅ Busca e ordenação global
 */
export const useDenormalizedFriends = (): UseFriendsResult & FriendshipActions => {
  const { user } = useAuth();
  
  // Estados principais
  const [friends, setFriends] = useState<DenormalizedFriendship[]>([]);
  const [allFriends, setAllFriends] = useState<DenormalizedFriendship[]>([]);
  const [requests, setRequests] = useState<DenormalizedFriendship[]>([]);
  const [sentRequests, setSentRequests] = useState<DenormalizedFriendship[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Estados de busca e ordenação
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortOption>('friendshipDate');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Estados de paginação
  const [hasMoreFriends, setHasMoreFriends] = useState(true);
  const lastFriendDoc = useRef<DocumentSnapshot | null>(null);
  
  // Refs para cleanup
  const unsubscribeFriends = useRef<(() => void) | null>(null);
  const unsubscribeRequests = useRef<(() => void) | null>(null);
  const unsubscribeSentRequests = useRef<(() => void) | null>(null);

  // ==================== BUSCA FUZZY ====================
  
  const fuseOptions = useMemo(() => ({
    keys: [
      { name: 'friend.displayName', weight: 0.6 },
      { name: 'friend.nickname', weight: 0.4 },
    ],
    threshold: 0.3,
    includeScore: true,
    minMatchCharLength: 2,
  }), []);
  
  const friendsFuse = useMemo(() => new Fuse(allFriends, fuseOptions), [allFriends, fuseOptions]);
  const requestsFuse = useMemo(() => new Fuse(requests, fuseOptions), [requests, fuseOptions]);
  const sentRequestsFuse = useMemo(() => new Fuse(sentRequests, fuseOptions), [sentRequests, fuseOptions]);

  // ==================== ORDENAÇÃO INTELIGENTE ====================
  
  const sortFriends = useCallback((friendsToSort: DenormalizedFriendship[]) => {
  if (sortField === 'default') {
    return [...friendsToSort].sort((a, b) => {
      const dateA = a.friendshipDate?.getTime() || a.createdAt.getTime();
      const dateB = b.friendshipDate?.getTime() || b.createdAt.getTime();
      return dateB - dateA; // Decrescente (mais recente primeiro)
    });
  }
  
  return [...friendsToSort].sort((a, b) => {
    let valueA: any, valueB: any;
    
    switch (sortField) {
      case 'name':
        valueA = a.friend.displayName.toLowerCase();
        valueB = b.friend.displayName.toLowerCase();
        break;
      case 'nickname':
        valueA = a.friend.nickname.toLowerCase();
        valueB = b.friend.nickname.toLowerCase();
        break;
      case 'friendshipDate':
        valueA = a.friendshipDate?.getTime() || a.createdAt.getTime();
        valueB = b.friendshipDate?.getTime() || b.createdAt.getTime();
        break;
      default:
        return 0;
    }
    
    // Lógica de ordenação
    if (valueA < valueB) return sortDirection === 'asc' ? -1 : 1;
    if (valueA > valueB) return sortDirection === 'asc' ? 1 : -1;
    return 0;
  });
}, [sortField, sortDirection]);

  // ==================== FILTROS E BUSCA APLICADOS A TODA A LISTA ====================
  
  const filteredAndSortedFriends = useMemo(() => {
    let filtered = allFriends;
    
    // Aplicar busca fuzzy se houver query
    if (searchQuery.trim()) {
      const results = friendsFuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }
    
    // Aplicar ordenação
    return sortFriends(filtered);
  }, [allFriends, searchQuery, friendsFuse, sortFriends]);

  const filteredAndSortedRequests = useMemo(() => {
    let filtered = requests;
    
    if (searchQuery.trim()) {
      const results = requestsFuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }
    
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [requests, searchQuery, requestsFuse]);

  const filteredAndSortedSentRequests = useMemo(() => {
    let filtered = sentRequests;
    
    if (searchQuery.trim()) {
      const results = sentRequestsFuse.search(searchQuery);
      filtered = results.map(result => result.item);
    }
    
    return filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [sentRequests, searchQuery, sentRequestsFuse]);

  // ==================== CARREGAMENTO INTELIGENTE DE TODOS OS AMIGOS ====================
  
  /**
   * Carrega TODOS os amigos em batches otimizados (estratégia de redes sociais)
   */
  const loadAllFriends = useCallback(async (refresh = false) => {
    if (!user?.uid) return;
    
    const cacheKey = getCacheKey(user.uid, 'friends');
    
    // Verificar cache primeiro
    if (!refresh && friendsCache[cacheKey] && isCacheValid(friendsCache[cacheKey].timestamp)) {
      console.log('📦 Usando dados do cache para amigos');
      setAllFriends(friendsCache[cacheKey].data);
      setFriends(friendsCache[cacheKey].data.slice(0, 50)); // Primeiros 50 para compatibilidade
      setLoading(false);
      return;
    }
    
    if (refresh) {
      setAllFriends([]);
      setFriends([]);
      lastFriendDoc.current = null;
      setHasMoreFriends(true);
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const allFriendsData: DenormalizedFriendship[] = [];
      let hasMore = true;
      let lastDoc = lastFriendDoc.current;
      let batchCount = 0;
      const maxBatches = 20; // Limite de segurança (20 * 100 = 2000 amigos max)
      
      while (hasMore && batchCount < maxBatches) {
        console.log(`📄 Carregando batch ${batchCount + 1} de amigos...`);
        
        const result = await getDenormalizedFriends(user.uid, 100, lastDoc);
        
        if (result.friends.length > 0) {
          // Filtrar duplicatas
          const existingIds = new Set(allFriendsData.map(f => f.id));
          const newFriends = result.friends.filter(f => !existingIds.has(f.id));
          
          allFriendsData.push(...newFriends);
          lastDoc = result.lastDoc;
          hasMore = result.hasMore && newFriends.length > 0;
          
          console.log(`✅ Batch ${batchCount + 1}: ${newFriends.length} novos amigos. Total: ${allFriendsData.length}`);
        } else {
          hasMore = false;
        }
        
        batchCount++;
        
        // Pequena pausa para não sobrecarregar o Firestore
        if (hasMore && batchCount < maxBatches) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`🎯 Carregamento completo: ${allFriendsData.length} amigos em ${batchCount} batches`);
      
      // Atualizar estados
      setAllFriends(allFriendsData);
      setFriends(allFriendsData.slice(0, 50)); // Primeiros 50 para compatibilidade
      lastFriendDoc.current = lastDoc;
      setHasMoreFriends(hasMore);
      
      // Salvar no cache
      friendsCache[cacheKey] = {
        data: allFriendsData,
        timestamp: Date.now(),
        lastDoc
      };
      
    } catch (err) {
      console.error('Erro ao carregar amigos:', err);
      setError('Erro ao carregar amigos');
      toastErrorClickable('Erro ao carregar lista de amigos');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);
  
  // ==================== SETUP LISTENERS ====================
  
  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    console.log('🔄 Configurando listeners de amizades para:', user.uid);
    setLoading(true);
    setError(null);

    // Listener para amigos
    unsubscribeFriends.current = subscribeToDenormalizedFriends(
      user.uid,
      (friendsData) => {
        console.log('👥 Amigos atualizados:', friendsData.length);
        setAllFriends(friendsData);
        setFriends(friendsData.slice(0, 50)); // Compatibilidade
        setLoading(false);
      },
      100 // Limite inicial maior
    );

    // Listener para solicitações recebidas
    unsubscribeRequests.current = subscribeToDenormalizedRequests(
      user.uid,
      (requestsData) => {
        console.log('📨 Solicitações recebidas:', requestsData.length);
        setRequests(requestsData);
      }
    );

    // Listener para solicitações enviadas
    unsubscribeSentRequests.current = subscribeToDenormalizedSentRequests(
      user.uid,
      (sentRequestsData) => {
        console.log('📤 Solicitações enviadas:', sentRequestsData.length);
        setSentRequests(sentRequestsData);
      }
    );

    // Carregar todos os amigos inicialmente
    loadAllFriends(true);
    // Cleanup function
    return () => {
      console.log('🧹 Limpando listeners de amizades');
      unsubscribeFriends.current?.();
      unsubscribeRequests.current?.();
      unsubscribeSentRequests.current?.();
    };
  }, [user?.uid, loadAllFriends]);

  // ==================== PAGINAÇÃO ====================
  
  /**
   * Carrega mais amigos (paginação)
   */
  const loadMoreFriends = useCallback(async () => {
    if (!user?.uid || loadingMore || !hasMoreFriends || allFriends.length === 0) return;
  
    setLoadingMore(true);
    try {
      console.log('📄 Carregando mais amigos. Atual:', allFriends.length, 'LastDoc:', !!lastFriendDoc.current);
      
      const result = await getDenormalizedFriends(
        user.uid,
        100, // 100 amigos por página
        lastFriendDoc.current || undefined
      );
  
      console.log('📄 Novos amigos carregados:', result.friends.length, 'HasMore:', result.hasMore);
  
      if (result.friends.length > 0) {
        // ✅ Filtrar duplicatas baseado no ID
        const existingIds = new Set(allFriends.map(f => f.id));
        const newFriends = result.friends.filter(f => !existingIds.has(f.id));
        
        console.log('📄 Amigos únicos a adicionar:', newFriends.length);
        
        if (newFriends.length > 0) {
          setAllFriends(prev => {
            const updated = [...prev, ...newFriends];
            // Atualizar cache
            const cacheKey = getCacheKey(user.uid, 'friends');
            friendsCache[cacheKey] = {
              data: updated,
              timestamp: Date.now(),
              lastDoc: result.lastDoc
            };
            return updated;
          });
          setFriends(prev => [...prev, ...newFriends]);
          lastFriendDoc.current = result.lastDoc || null;
          setHasMoreFriends(result.hasMore);
        } else {
          // Se não há novos amigos únicos, não há mais o que carregar
          setHasMoreFriends(false);
        }
      } else {
        setHasMoreFriends(false);
      }
    } catch (err) {
      console.error('Erro ao carregar mais amigos:', err);
      setError('Erro ao carregar mais amigos');
    } finally {
      setLoadingMore(false);
    }
  }, [user?.uid, loadingMore, hasMoreFriends, allFriends.length]);

  // ==================== REFRESH ====================
  
  /**
   * Recarrega todos os dados
   */
  const refreshData = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);
    lastFriendDoc.current = null;
    setHasMoreFriends(true);
    
    // Limpar cache
    const cacheKey = getCacheKey(user.uid, 'friends');
    delete friendsCache[cacheKey];

    try {
      // Recarregar dados iniciais
      const [requestsData, sentRequestsData] = await Promise.all([
        getDenormalizedFriendRequests(user.uid),
        getDenormalizedSentRequests(user.uid)
      ]);

      setRequests(requestsData);
      setSentRequests(sentRequestsData);
      
      // Recarregar todos os amigos
      await loadAllFriends(true);
    } catch (err) {
      console.error('Erro ao recarregar dados:', err);
      setError('Erro ao recarregar dados');
    } finally {
      setLoading(false);
    }
  }, [user?.uid, loadAllFriends]);

  // ==================== AÇÕES DE AMIZADE ====================
  
  /**
   * Envia solicitação de amizade
   */
  const sendFriendRequest = useCallback(async (targetUserId: string) => {
    if (!user?.uid) {
      toastErrorClickable('Você precisa estar logado');
      return;
    }

    try {
      await sendDenormalizedFriendRequest(user.uid, targetUserId);
      toastSuccessClickable('Solicitação de amizade enviada!');
    } catch (err) {
      console.error('Erro ao enviar solicitação:', err);
      toastErrorClickable('Erro ao enviar solicitação de amizade');
      throw err;
    }
  }, [user?.uid]);

  /**
   * Aceita solicitação de amizade
   */
  const acceptFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user?.uid) {
      toastErrorClickable('Você precisa estar logado');
      return;
    }

    // Encontrar a solicitação para pegar o friendId
    const request = requests.find(r => r.id === friendshipId);
    if (!request) {
      toastErrorClickable('Solicitação não encontrada');
      return;
    }

    try {
      await acceptDenormalizedFriendRequest(user.uid, request.friendId);
      toastSuccessClickable(`Agora você e ${request.friend.displayName} são amigos!`);
      
      // Limpar cache para forçar recarregamento
      const cacheKey = getCacheKey(user.uid, 'friends');
      delete friendsCache[cacheKey];
    } catch (err) {
      console.error('Erro ao aceitar solicitação:', err);
      toastErrorClickable('Erro ao aceitar solicitação');
      throw err;
    }
  }, [user?.uid, requests]);

  /**
   * Rejeita solicitação de amizade
   */
  const rejectFriendRequest = useCallback(async (friendshipId: string) => {
    if (!user?.uid) {
      toastErrorClickable('Você precisa estar logado');
      return;
    }

    // Encontrar a solicitação para pegar o friendId
    const request = requests.find(r => r.id === friendshipId);
    if (!request) {
      toastErrorClickable('Solicitação não encontrada');
      return;
    }

    try {
      await rejectDenormalizedFriendRequest(user.uid, request.friendId);
      toastSuccessClickable('Solicitação rejeitada');
    } catch (err) {
      console.error('Erro ao rejeitar solicitação:', err);
      toastErrorClickable('Erro ao rejeitar solicitação');
      throw err;
    }
  }, [user?.uid, requests]);

  /**
   * Remove amizade
   */
  const removeFriend = useCallback(async (friendshipId: string) => {
    if (!user?.uid) {
      toastErrorClickable('Você precisa estar logado');
      return;
    }

    // Encontrar o amigo para pegar o friendId
    const friend = allFriends.find(f => f.id === friendshipId);
    if (!friend) {
      toastErrorClickable('Amigo não encontrado');
      return;
    }

    try {
      await removeDenormalizedFriend(user.uid, friend.friendId);
      toastSuccessClickable(`${friend.friend.displayName} foi removido dos seus amigos`);
      
      // Limpar cache para forçar recarregamento
      const cacheKey = getCacheKey(user.uid, 'friends');
      delete friendsCache[cacheKey];
    } catch (err) {
      console.error('Erro ao remover amigo:', err);
      toastErrorClickable('Erro ao remover amigo');
      throw err;
    }
  }, [user?.uid, allFriends]);

  /**
   * Cancela todas as solicitações enviadas
   */
  const cancelAllSentRequests = useCallback(async () => {
    if (!user?.uid || sentRequests.length === 0) {
      toastErrorClickable('Nenhuma solicitação para cancelar');
      return;
    }
  
    try {
      // Criar um array de promessas para todas as exclusões
      const deletePromises = sentRequests.map(request => 
        rejectDenormalizedFriendRequest(user.uid, request.friendId)
      );
      
      // Executar todas as exclusões em paralelo
      await Promise.all(deletePromises);
      
      toastSuccessClickable(`Todas as solicitações (${sentRequests.length}) foram canceladas`);
    } catch (err) {
      console.error('Erro ao cancelar solicitações:', err);
      toastErrorClickable('Erro ao cancelar solicitações');
      throw err;
    }
  }, [user?.uid, sentRequests]);
  
  /**
   * Cancela uma solicitação enviada individual
   */
  const cancelSentRequest = useCallback(async (friendshipId: string) => {
    if (!user?.uid) {
      toastErrorClickable('Você precisa estar logado');
      return;
    }
  
    // Encontrar a solicitação para pegar o friendId
    const sentRequest = sentRequests.find(s => s.id === friendshipId);
    if (!sentRequest) {
      toastErrorClickable('Solicitação não encontrada');
      return;
    }
  
    try {
      await rejectDenormalizedFriendRequest(user.uid, sentRequest.friendId);
      toastSuccessClickable('Solicitação cancelada');
    } catch (err) {
      console.error('Erro ao cancelar solicitação:', err);
      toastErrorClickable('Erro ao cancelar solicitação');
      throw err;
    }
  }, [user?.uid, sentRequests]);
  
  // ==================== ESTATÍSTICAS ====================
  
  const stats: FriendshipStats = {
    totalFriends: allFriends.length,
    pendingRequests: requests.length,
    sentRequests: sentRequests.length,
  };

  // ==================== RETORNO ====================
  
  return {
    // Dados
    friends: filteredAndSortedFriends, // ✅ Lista filtrada e ordenada
    allFriends, // ✅ Lista completa para debug/analytics
    requests: filteredAndSortedRequests,
    sentRequests: filteredAndSortedSentRequests,
    stats,
    
    // Estados
    loading,
    loadingMore,
    error,
    hasMoreFriends,
    
    // Controles de busca e ordenação
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    
    // Ações
    loadAllFriends,
    loadMoreFriends,
    refreshData,
    sendFriendRequest,
    acceptFriendRequest,
    rejectFriendRequest,
    removeFriend,
    cancelSentRequest,
    cancelAllSentRequests,
  };
};

/**
 * Hook simplificado apenas para estatísticas
 */
export const useFriendshipStats = () => {
  const { stats, loading } = useDenormalizedFriends();
  return { stats, loading };
};

/**
 * Hook para verificar status de amizade com usuário específico
 */
export const useFriendshipStatus = (targetUserId: string) => {
  const { friends, requests, sentRequests } = useDenormalizedFriends();
  
  const status = (() => {
    if (friends.some(f => f.friendId === targetUserId)) return 'friends';
    if (requests.some(r => r.friendId === targetUserId)) return 'request_received';
    if (sentRequests.some(s => s.friendId === targetUserId)) return 'request_sent';
    return 'none';
  })();
  
  return status;
};