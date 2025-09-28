import { redirect } from 'react-router-dom';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseAuthProfile,
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../../services/firebase';
import { generateUniqueNickname } from '../../utils/nickname';
import { queryClient } from '../../lib/queryClient';
import {
  toastSuccessClickable,
  toastErrorClickable,
} from '../../components/ui/toast';
import { User } from '../../models';
import { userQuery } from '../users/user.queries';
import { PATHS } from '../../router/paths';

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
    const profileData = await queryClient.fetchQuery(userQuery(user.uid));
    toastSuccessClickable(`Bem-vindo(a) de volta, ${profileData.displayName}!`);
    return redirect(PATHS.PROFILE_ME);
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
    queryClient.setQueryData(['users', user.uid], {
      id: user.uid,
      ...newProfileData,
    });
    toastSuccessClickable(`Conta criada com sucesso, ${displayName}!`);
    return redirect(PATHS.PROFILE_ME);
  } catch (error: any) {
    toastErrorClickable(
      'Não foi possível criar a conta. O email já pode estar em uso.'
    );
    return { error: 'Falha no registro' };
  }
};