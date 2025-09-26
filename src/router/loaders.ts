import { redirect } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserNotifications, getPendingRequestCount } from '../services/firestore';
import { queryClient } from '../lib/queryClient';
import { User } from '../models';

export const getCurrentUser = () => {
  return auth.currentUser;
};

export const userQuery = (userId: string) => ({
  queryKey: ['users', userId],
  queryFn: async (): Promise<User> => { 
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Response('Not Found', { status: 404 });
    }
    return { id: docSnap.id, ...docSnap.data() } as User;
  },
});

export const userByNicknameQuery = (nickname: string) => ({
    queryKey: ['users', 'nickname', nickname],
    queryFn: async () => {
        const q = query(collection(db, 'users'), where('nickname', '==', nickname));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            throw new Response('Not Found', { status: 404, statusText: 'User not found' });
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
    },
});

// # atualizado: O loader do layout agora é mais simples e não busca mais o perfil.
export const layoutLoader = async () => {
  const user = getCurrentUser();
  if (!user) {
    return { initialFriendRequests: 0 };
  }
  try {
    const initialFriendRequests = await getPendingRequestCount(user.uid);
    return { initialFriendRequests };
  } catch (error) {
    console.error("Layout loader error:", error);
    return { initialFriendRequests: 0 };
  }
};

const notificationsQuery = (userId: string) => ({
    queryKey: ['notifications', userId],
    queryFn: () => getUserNotifications(userId),
});

export const notificationsLoader = async () => {
  const user = getCurrentUser();
  if (!user) return redirect('/login');
  return await queryClient.ensureQueryData(notificationsQuery(user.uid));
};