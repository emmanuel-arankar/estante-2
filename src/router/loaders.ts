import { redirect } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserNotifications, getPendingRequestCount } from '../services/firestore'; 
import { toastErrorClickable } from '@/components/ui/toast';
import { queryClient } from '../lib/queryClient'; // # atualizado

// Helper para pegar o usuário atual, essencial para loaders
const getCurrentUser = () => {
  return auth.currentUser;
};

const userQuery = (userId: string) => ({
  queryKey: ['users', userId],
  queryFn: async () => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Response('Not Found', { status: 404 });
    }
    return { id: docSnap.id, ...docSnap.data() };
  },
});

const userByNicknameQuery = (nickname: string) => ({
    queryKey: ['users', 'nickname', nickname],
    queryFn: async () => {
        const q = query(collection(db, 'users'), where('nickname', '==', nickname));
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            throw new Response('Not Found', { status: 404, statusText: 'Usuário não encontrado' });
        }
        const userDoc = snapshot.docs[0];
        return { id: userDoc.id, ...userDoc.data() };
    },
});

const notificationsQuery = (userId: string) => ({
    queryKey: ['notifications', userId],
    queryFn: () => getUserNotifications(userId),
});

export const profileLoader = async ({ params }: any) => {
  const { nickname } = params;
  if (!nickname) return redirect('/');

  if (nickname === 'me') {
    const user = getCurrentUser();
    if (!user) return redirect('/login');
    return await queryClient.ensureQueryData(userQuery(user.uid));
  }

  try {
    return await queryClient.ensureQueryData(userByNicknameQuery(nickname));
  } catch (error) {
    toastErrorClickable('Usuário não encontrado.');
    return redirect('/');
  }
};

export const editProfileLoader = async () => {
  const user = getCurrentUser();
  if (!user) return redirect('/login');
  return await queryClient.ensureQueryData(userQuery(user.uid));
};

export const notificationsLoader = async () => {
  const user = getCurrentUser();
  if (!user) return redirect('/login');
  return await queryClient.ensureQueryData(notificationsQuery(user.uid));
};