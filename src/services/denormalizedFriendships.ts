import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  writeBatch,
  DocumentSnapshot,
  QuerySnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db } from './firebase';
import { DenormalizedFriendship, DenormalizedUser } from '../models/friendship';
import { createNotification } from './firestore';

// ==================== SINCRONIZAÇÃO DE DADOS DENORMALIZADOS ====================

/**
 * Atualiza dados denormalizados quando usuário muda perfil
 * Deve ser chamada sempre que um usuário atualizar seu perfil
 */
export const syncDenormalizedUserData = async (userId: string) => {
  try {
    console.log('🔄 Sincronizando dados denormalizados para usuário:', userId);
    
    // Buscar dados atualizados do usuário
    const updatedUser = await getUserForDenormalization(userId);
    if (!updatedUser) {
      console.error('❌ Usuário não encontrado para sincronização:', userId);
      return;
    }

    const batch = writeBatch(db);
    let updateCount = 0;
    
    // Buscar todas as amizades onde este usuário é o "friend"
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('friendId', '==', userId)
    );
    
    const snapshot = await getDocs(friendshipsQuery);
    
    snapshot.docs.forEach(docSnapshot => {
      const friendshipRef = doc(db, 'friendships', docSnapshot.id);
      batch.update(friendshipRef, {
        'friend.displayName': updatedUser.displayName,
        'friend.nickname': updatedUser.nickname,
        'friend.photoURL': updatedUser.photoURL,
        'friend.bio': updatedUser.bio,
        'friend.location': updatedUser.location,
        updatedAt: serverTimestamp()
      });
      updateCount++;
    });
    
    if (updateCount > 0) {
      await batch.commit();
      console.log(`✅ ${updateCount} documentos de amizade atualizados para usuário ${userId}`);
    } else {
      console.log('ℹ️ Nenhum documento de amizade encontrado para atualizar');
    }
  } catch (error) {
    console.error('❌ Erro ao sincronizar dados denormalizados:', error);
    throw error;
  }
};

// ==================== FUNÇÕES AUXILIARES ====================

/**
 * Busca dados completos de um usuário para denormalização
 */
export const getUserForDenormalization = async (userId: string): Promise<DenormalizedUser | null> => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (!userDoc.exists()) return null;
    
    const userData = userDoc.data();
    return {
      id: userId,
      displayName: userData.displayName || 'Usuário',
      nickname: userData.nickname || '',
      photoURL: userData.photoURL || null,
      email: userData.email || '',
      bio: userData.bio || '',
      location: userData.location || '',
      joinedAt: userData.joinedAt?.toDate() || new Date(),
      lastActive: userData.lastActive?.toDate() || null,
    };
  } catch (error) {
    console.error('Erro ao buscar usuário para denormalização:', error);
    return null;
  }
};

/**
 * Atualiza dados denormalizados em todas as amizades de um usuário
 * Usado quando o usuário atualiza seu perfil
 */
export const updateDenormalizedUserData = async (userId: string, updatedData: Partial<DenormalizedUser>) => {
  try {
    const batch = writeBatch(db);
    
    // Buscar todas as amizades onde este usuário é o "friend"
    const friendshipsQuery = query(
      collection(db, 'friendships'),
      where('friendId', '==', userId)
    );
    
    const snapshot = await getDocs(friendshipsQuery);
    
    snapshot.docs.forEach(docSnapshot => {
      const friendshipRef = doc(db, 'friendships', docSnapshot.id);
      batch.update(friendshipRef, {
        'friend.displayName': updatedData.displayName,
        'friend.nickname': updatedData.nickname,
        'friend.photoURL': updatedData.photoURL,
        'friend.bio': updatedData.bio,
        'friend.location': updatedData.location,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    console.log(`✅ Dados denormalizados atualizados para usuário ${userId}`);
  } catch (error) {
    console.error('Erro ao atualizar dados denormalizados:', error);
    throw error;
  }
};

// ==================== OPERAÇÕES DE AMIZADE ====================

/**
 * Envia solicitação de amizade com denormalização completa
 */
export const sendDenormalizedFriendRequest = async (fromUserId: string, toUserId: string) => {
  try {
    const batch = writeBatch(db);
    
    // Buscar dados dos usuários para denormalização
    const [fromUser, toUser] = await Promise.all([
      getUserForDenormalization(fromUserId),
      getUserForDenormalization(toUserId)
    ]);
    
    if (!fromUser || !toUser) {
      throw new Error('Usuário não encontrado');
    }
    
    const timestamp = serverTimestamp();
    
    // Criar documento de amizade para o remetente (fromUser)
    const senderFriendshipRef = doc(collection(db, 'friendships'));
    batch.set(senderFriendshipRef, {
      userId: fromUserId,
      friendId: toUserId,
      status: 'pending',
      requestedBy: fromUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      friend: toUser // ✅ Dados denormalizados do destinatário
    });
    
    // Criar documento de amizade para o destinatário (toUser)
    const receiverFriendshipRef = doc(collection(db, 'friendships'));
    batch.set(receiverFriendshipRef, {
      userId: toUserId,
      friendId: fromUserId,
      status: 'pending',
      requestedBy: fromUserId,
      createdAt: timestamp,
      updatedAt: timestamp,
      friend: fromUser // ✅ Dados denormalizados do remetente
    });
    
    await batch.commit();
    
    // Criar notificação
    await createNotification({
      userId: toUserId,
      type: 'friend_request',
      fromUserId,
      message: 'enviou uma solicitação de amizade',
      read: false,
    });
    
    console.log(`✅ Solicitação de amizade enviada: ${fromUserId} → ${toUserId}`);
  } catch (error) {
    console.error('Erro ao enviar solicitação de amizade:', error);
    throw error;
  }
};

/**
 * Aceita solicitação de amizade
 */
export const acceptDenormalizedFriendRequest = async (userId: string, friendId: string) => {
  try {
    const batch = writeBatch(db);
    const friendshipDate = serverTimestamp();
    
    // Buscar documentos de amizade de ambos os usuários
    const [userFriendshipQuery, friendFriendshipQuery] = await Promise.all([
      getDocs(query(
        collection(db, 'friendships'),
        where('userId', '==', userId),
        where('friendId', '==', friendId),
        where('status', '==', 'pending')
      )),
      getDocs(query(
        collection(db, 'friendships'),
        where('userId', '==', friendId),
        where('friendId', '==', userId),
        where('status', '==', 'pending')
      ))
    ]);
    
    // Atualizar status para 'accepted' em ambos os documentos
    userFriendshipQuery.docs.forEach(docSnapshot => {
      batch.update(docSnapshot.ref, {
        status: 'accepted',
        friendshipDate,
        updatedAt: serverTimestamp()
      });
    });
    
    friendFriendshipQuery.docs.forEach(docSnapshot => {
      batch.update(docSnapshot.ref, {
        status: 'accepted',
        friendshipDate,
        updatedAt: serverTimestamp()
      });
    });
    
    await batch.commit();
    
    // Criar notificação de aceitação
    await createNotification({
      userId: friendId,
      type: 'friend_accept',
      fromUserId: userId,
      message: 'aceitou sua solicitação de amizade',
      read: false,
    });
    
    console.log(`✅ Amizade aceita: ${userId} ↔ ${friendId}`);
  } catch (error) {
    console.error('Erro ao aceitar solicitação de amizade:', error);
    throw error;
  }
};

/**
 * Rejeita solicitação de amizade
 */
export const rejectDenormalizedFriendRequest = async (userId: string, friendId: string) => {
  try {
    const batch = writeBatch(db);
    
    // Buscar e deletar documentos de amizade de ambos os usuários
    const [userFriendshipQuery, friendFriendshipQuery] = await Promise.all([
      getDocs(query(
        collection(db, 'friendships'),
        where('userId', '==', userId),
        where('friendId', '==', friendId),
        where('status', '==', 'pending')
      )),
      getDocs(query(
        collection(db, 'friendships'),
        where('userId', '==', friendId),
        where('friendId', '==', userId),
        where('status', '==', 'pending')
      ))
    ]);
    
    // Deletar ambos os documentos
    userFriendshipQuery.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    friendFriendshipQuery.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log(`✅ Solicitação rejeitada: ${userId} ✗ ${friendId}`);
  } catch (error) {
    console.error('Erro ao rejeitar solicitação de amizade:', error);
    throw error;
  }
};

/**
 * Remove amizade existente
 */
export const removeDenormalizedFriend = async (userId: string, friendId: string) => {
  try {
    const batch = writeBatch(db);
    
    // Buscar e deletar documentos de amizade de ambos os usuários
    const [userFriendshipQuery, friendFriendshipQuery] = await Promise.all([
      getDocs(query(
        collection(db, 'friendships'),
        where('userId', '==', userId),
        where('friendId', '==', friendId),
        where('status', '==', 'accepted')
      )),
      getDocs(query(
        collection(db, 'friendships'),
        where('userId', '==', friendId),
        where('friendId', '==', userId),
        where('status', '==', 'accepted')
      ))
    ]);
    
    // Deletar ambos os documentos
    userFriendshipQuery.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    friendFriendshipQuery.docs.forEach(docSnapshot => {
      batch.delete(docSnapshot.ref);
    });
    
    await batch.commit();
    console.log(`✅ Amizade removida: ${userId} ✗ ${friendId}`);
  } catch (error) {
    console.error('Erro ao remover amizade:', error);
    throw error;
  }
};

// ==================== QUERIES DE LEITURA ====================

/**
 * Busca amigos com paginação
 */
export const getDenormalizedFriends = async (
  userId: string,
  limitCount: number = 20,
  lastDoc?: DocumentSnapshot
) => {
  try {
    let q = query(
      collection(db, 'friendships'),
      where('userId', '==', userId),
      where('status', '==', 'accepted'),
      orderBy('friendshipDate', 'desc'),
      limit(limitCount)
    );
    
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }
    
    const snapshot = await getDocs(q);
    const friends: DenormalizedFriendship[] = [];
    const seenIds = new Set(); // Para evitar duplicatas
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const friendData = data.friend || {};
      
      // Evitar duplicatas por ID
      if (!seenIds.has(doc.id)) {
        seenIds.add(doc.id);
        
        friends.push({
          id: doc.id,
          userId: data.userId,
          friendId: data.friendId,
          status: data.status,
          requestedBy: data.requestedBy,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          friendshipDate: data.friendshipDate?.toDate() || null,
          friend: {
            id: friendData.id || data.friendId,
            displayName: friendData.displayName || 'Usuário',
            nickname: friendData.nickname || '',
            photoURL: friendData.photoURL || null,
            email: friendData.email || '',
            bio: friendData.bio || '',
            location: friendData.location || '',
            joinedAt: friendData.joinedAt?.toDate() || new Date(),
            lastActive: friendData.lastActive?.toDate() || null,
          }
        } as DenormalizedFriendship);
      }
    });
    
    return {
      friends,
      lastDoc: snapshot.docs[snapshot.docs.length - 1],
      hasMore: snapshot.docs.length === limitCount
    };
  } catch (error) {
    console.error('Erro ao buscar amigos:', error);
    throw error;
  }
};

/**
 * Busca solicitações recebidas
 */
export const getDenormalizedFriendRequests = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'friendships'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      where('requestedBy', '!=', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const requests: DenormalizedFriendship[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const friendData = data.friend || {};
      
      requests.push({
        id: doc.id,
        userId: data.userId,
        friendId: data.friendId,
        status: data.status,
        requestedBy: data.requestedBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        friendshipDate: data.friendshipDate?.toDate() || null,
        friend: {
          id: friendData.id || data.friendId, // Fallback para friendId se id não existir
          displayName: friendData.displayName || 'Usuário',
          nickname: friendData.nickname || '',
          photoURL: friendData.photoURL || null,
          email: friendData.email || '',
          bio: friendData.bio || '',
          location: friendData.location || '',
          joinedAt: friendData.joinedAt?.toDate() || new Date(),
          lastActive: friendData.lastActive?.toDate() || null,
        }
      } as DenormalizedFriendship);
    });
    
    return requests;
  } catch (error) {
    console.error('Erro ao buscar solicitações recebidas:', error);
    throw error;
  }
};

/**
 * Busca solicitações enviadas
 */
export const getDenormalizedSentRequests = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'friendships'),
      where('userId', '==', userId),
      where('status', '==', 'pending'),
      where('requestedBy', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(q);
    const sentRequests: DenormalizedFriendship[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const friendData = data.friend || {};
      
      sentRequests.push({
        id: doc.id,
        userId: data.userId,
        friendId: data.friendId,
        status: data.status,
        requestedBy: data.requestedBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        friendshipDate: data.friendshipDate?.toDate() || null,
        friend: {
          id: friendData.id || data.friendId, // Fallback para friendId se id não existir
          displayName: friendData.displayName || 'Usuário',
          nickname: friendData.nickname || '',
          photoURL: friendData.photoURL || null,
          email: friendData.email || '',
          bio: friendData.bio || '',
          location: friendData.location || '',
          joinedAt: friendData.joinedAt?.toDate() || new Date(),
          lastActive: friendData.lastActive?.toDate() || null,
        }
      } as DenormalizedFriendship);
    });
    
    return sentRequests;
  } catch (error) {
    console.error('Erro ao buscar solicitações enviadas:', error);
    throw error;
  }
};

// ==================== LISTENERS EM TEMPO REAL ====================

/**
 * Listener para amigos em tempo real
 */
export const subscribeToDenormalizedFriends = (
  userId: string,
  callback: (friends: DenormalizedFriendship[]) => void,
  limitCount: number = 50
): Unsubscribe => {
  const q = query(
    collection(db, 'friendships'),
    where('userId', '==', userId),
    where('status', '==', 'accepted'),
    orderBy('friendshipDate', 'desc'),
    limit(limitCount)
  );
  
  return onSnapshot(q, (snapshot) => {
    const friends: DenormalizedFriendship[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const friendData = data.friend || {};
      
      friends.push({
        id: doc.id,
        userId: data.userId,
        friendId: data.friendId,
        status: data.status,
        requestedBy: data.requestedBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        friendshipDate: data.friendshipDate?.toDate() || null,
        friend: {
          id: friendData.id || data.friendId, // Fallback para friendId se id não existir
          displayName: friendData.displayName || 'Usuário',
          nickname: friendData.nickname || '',
          photoURL: friendData.photoURL || null,
          email: friendData.email || '',
          bio: friendData.bio || '',
          location: friendData.location || '',
          joinedAt: friendData.joinedAt?.toDate() || new Date(),
          lastActive: friendData.lastActive?.toDate() || null,
        }
      } as DenormalizedFriendship);
    });
    
    callback(friends);
  });
};

/**
 * Listener para solicitações recebidas em tempo real
 */
export const subscribeToDenormalizedRequests = (
  userId: string,
  callback: (requests: DenormalizedFriendship[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'friendships'),
    where('userId', '==', userId),
    where('status', '==', 'pending'),
    where('requestedBy', '!=', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const requests: DenormalizedFriendship[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const friendData = data.friend || {};
      
      requests.push({
        id: doc.id,
        userId: data.userId,
        friendId: data.friendId,
        status: data.status,
        requestedBy: data.requestedBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        friendshipDate: data.friendshipDate?.toDate() || null,
        friend: {
          id: friendData.id || data.friendId, // Fallback para friendId se id não existir
          displayName: friendData.displayName || 'Usuário',
          nickname: friendData.nickname || '',
          photoURL: friendData.photoURL || null,
          email: friendData.email || '',
          bio: friendData.bio || '',
          location: friendData.location || '',
          joinedAt: friendData.joinedAt?.toDate() || new Date(),
          lastActive: friendData.lastActive?.toDate() || null,
        }
      } as DenormalizedFriendship);
    });
    
    callback(requests);
  });
};

/**
 * Listener para solicitações enviadas em tempo real
 */
export const subscribeToDenormalizedSentRequests = (
  userId: string,
  callback: (sentRequests: DenormalizedFriendship[]) => void
): Unsubscribe => {
  const q = query(
    collection(db, 'friendships'),
    where('userId', '==', userId),
    where('status', '==', 'pending'),
    where('requestedBy', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (snapshot) => {
    const sentRequests: DenormalizedFriendship[] = [];
    
    snapshot.docs.forEach(doc => {
      const data = doc.data();
      const friendData = data.friend || {};
      
      sentRequests.push({
        id: doc.id,
        userId: data.userId,
        friendId: data.friendId,
        status: data.status,
        requestedBy: data.requestedBy,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        friendshipDate: data.friendshipDate?.toDate() || null,
        friend: {
          id: friendData.id || data.friendId, // Fallback para friendId se id não existir
          displayName: friendData.displayName || 'Usuário',
          nickname: friendData.nickname || '',
          photoURL: friendData.photoURL || null,
          email: friendData.email || '',
          bio: friendData.bio || '',
          location: friendData.location || '',
          joinedAt: friendData.joinedAt?.toDate() || new Date(),
          lastActive: friendData.lastActive?.toDate() || null,
        }
      } as DenormalizedFriendship);
    });
    
    callback(sentRequests);
  });
};