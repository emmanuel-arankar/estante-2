import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuthStore } from '../stores/authStore';
import { User } from '../models';

export const useAuth = () => {
  const {
    user,
    profile,
    loading,
    error,
    setUser,
    setProfile,
    setLoading,
    setError,
  } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Usuário está logado, AGORA busca o perfil.
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            // Perfil encontrado, preenche a store.
            const userData = userDoc.data();
            const convertFirestoreDate = (date: any) => {
                if (!date) return new Date();
                return date.toDate ? date.toDate() : new Date(date);
            };
            const finalProfile: User = {
                id: firebaseUser.uid,
                email: userData.email ?? firebaseUser.email ?? '',
                displayName: userData.displayName ?? firebaseUser.displayName ?? 'Usuário',
                nickname: userData.nickname ?? '',
                photoURL: userData.photoURL ?? firebaseUser.photoURL ?? undefined,
                bio: userData.bio ?? '',
                location: userData.location ?? '',
                website: userData.website ?? '',
                birthDate: userData.birthDate ? convertFirestoreDate(userData.birthDate) : undefined,
                createdAt: convertFirestoreDate(userData.createdAt),
                updatedAt: convertFirestoreDate(userData.updatedAt),
                joinedAt: convertFirestoreDate(userData.joinedAt),
                booksRead: userData.booksRead ?? 0,
                currentlyReading: userData.currentlyReading ?? 0,
                followers: userData.followers ?? 0,
                following: userData.following ?? 0,
            };
            setUser(firebaseUser);
            setProfile(finalProfile);
          } else {
            // Usuário autenticado mas sem perfil no banco de dados.
            setUser(firebaseUser);
            setProfile(null);
            setError("Perfil do usuário não encontrado no banco de dados.");
          }
        } else {
          // Usuário está deslogado, limpa o estado.
          setUser(null);
          setProfile(null);
        }
      } catch (e) {
        const err = e instanceof Error ? e : new Error('Erro de autenticação');
        setError(err.message);
        setUser(null);
        setProfile(null);
      } finally {
        // # atualizado: O loading SÓ TERMINA aqui, após todo o processo.
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading, setError]);

  return { user, profile, loading, error };
};