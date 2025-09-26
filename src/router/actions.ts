// src/router/actions.ts

import { redirect } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseAuthProfile,
} from 'firebase/auth';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { generateUniqueNickname } from '../utils/nickname';
import { syncDenormalizedUserData } from '../services/denormalizedFriendships';
import { queryClient } from '../lib/queryClient';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '@/components/ui/toast';
import { User } from '../models';

// Query reutilizável para buscar o perfil de um usuário
const userQuery = (userId: string) => ({
  queryKey: ['users', userId],
  queryFn: async () => {
    const docRef = doc(db, 'users', userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      throw new Error('User not found');
    }
    return { id: docSnap.id, ...docSnap.data() } as User;
  },
});

export const loginAction = async ({ request }: any) => {
  const formData = await request.formData();
  const { email, password } = Object.fromEntries(formData);

    try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email as string,
      password as string
    );
    const user = userCredential.user;

    // # atualizado: Pré-aquece o cache ANTES de redirecionar. Esta é a chave da sincronia!
    const profileData = await queryClient.fetchQuery(userQuery(user.uid));

    toastSuccessClickable(`Bem-vindo(a) de volta, ${profileData.displayName}!`);
    return redirect('/profile/me'); // # atualizado: redireciona para um perfil com slug "me"
  } catch (error: any) {
    toastErrorClickable('Email ou senha inválidos.');
    return { error: 'Falha no login' };
  }
};

export const registerAction = async ({ request }: any) => {
  const formData = await request.formData();
  const { email, password, displayName } = Object.fromEntries(formData);
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email as string,
      password as string
    );
    const user = userCredential.user;
    await updateFirebaseAuthProfile(user, { displayName: displayName as string });
    const nickname = await generateUniqueNickname(displayName as string);

    const newProfileData: Omit<User, 'id'> = {
      displayName: displayName as string,
      nickname,
      email: email as string,
      photoURL: user.photoURL || '',
      bio: '',
      location: '',
      website: '',
      birthDate: undefined,
      joinedAt: new Date(),
      booksRead: 0,
      currentlyReading: 0,
      followers: 0,
      following: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await setDoc(doc(db, 'users', user.uid), newProfileData);

    // # atualizado: Coloca o perfil recém-criado diretamente no cache.
    queryClient.setQueryData(['users', user.uid], {
      id: user.uid,
      ...newProfileData,
    });

    toastSuccessClickable(`Conta criada com sucesso, ${displayName}!`);
    return redirect('/');
  } catch (error: any) {
    toastErrorClickable('Não foi possível criar a conta. O email já pode estar em uso.');
    return { error: 'Falha no registro' };
  }
};

export const editProfileAction = async ({ request }: any) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const user = auth.currentUser;

  if (!user) return redirect('/login');

  try {
    let birthDate = null;
    if (data.birthDay && data.birthMonth && data.birthYear) {
      birthDate = new Date(
        parseInt(data.birthYear as string),
        parseInt(data.birthMonth as string) - 1,
        parseInt(data.birthDay as string)
      );
    }

    await updateDoc(doc(db, 'users', user.uid), {
      displayName: data.displayName,
      nickname: data.nickname,
      bio: data.bio || '',
      location: data.location || '',
      website: data.website || '',
      birthDate: birthDate,
      updatedAt: new Date(),
    });

    await syncDenormalizedUserData(user.uid);

    // Invalida o cache para forçar o loader a buscar dados frescos na próxima vez
    queryClient.invalidateQueries({ queryKey: ['users', user.uid] });

    toastSuccessClickable('Perfil salvo com sucesso!');
    return redirect('/profile/me');
  } catch (error) {
    toastErrorClickable('Erro ao salvar o perfil.');
    return { error: 'Falha ao salvar' };
  }
};