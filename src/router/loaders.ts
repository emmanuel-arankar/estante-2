import { redirect } from 'react-router-dom';
import { auth, db } from '../services/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { getUserNotifications } from '../services/firestore';
import { toastErrorClickable } from '@/components/ui/toast';

// Helper para pegar o usuário atual, essencial para loaders
const getCurrentUser = () => {
  return auth.currentUser;
};

// Loader para a página de perfil
export const profileLoader = async ({ params }: any) => {
  const { nickname } = params;
  if (!nickname) {
    toastErrorClickable('Nickname não fornecido.');
    return redirect('/');
  }

  // Lógica para a rota /profile/me
  if (nickname === 'me') {
    const user = getCurrentUser();
    if (!user) {
      return redirect('/login');
    }
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    if (userDoc.exists()) {
      return { id: userDoc.id, ...userDoc.data() };
    }
    return redirect('/');
  }

  // Busca o perfil pelo nickname
  const q = query(collection(db, 'users'), where('nickname', '==', nickname));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    toastErrorClickable('Usuário não encontrado.');
    return redirect('/');
  }

  const userDoc = snapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() };
};

// Loader para a página de edição de perfil
export const editProfileLoader = async () => {
  const user = getCurrentUser();
  if (!user) {
    return redirect('/login');
  }
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (userDoc.exists()) {
    return { id: userDoc.id, ...userDoc.data() };
  }
  toastErrorClickable('Perfil não encontrado para edição.');
  return redirect('/');
};

// Loader para a página de notificações
export const notificationsLoader = async () => {
  const user = getCurrentUser();
  if (!user) {
    return redirect('/login');
  }
  const notifications = await getUserNotifications(user.uid);
  return notifications;
};