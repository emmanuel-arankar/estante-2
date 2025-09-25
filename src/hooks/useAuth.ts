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
    console.log('🔄 Iniciando listener de autenticação');

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔥 onAuthStateChanged disparado:', firebaseUser ? 'usuário logado' : 'usuário não logado');
      
      try {
        setError(null);
        setUser(firebaseUser);

        if (firebaseUser) {
          console.log('📄 Carregando perfil do usuário...');
          try {
            const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
            
              console.log('📦 Dados brutos do Firestore:', userData);
            
              // Função helper para converter datas do Firestore
              const convertFirestoreDate = (date: any) => {
                if (!date) return new Date();
                try {
                  return date.toDate ? date.toDate() : new Date(date);
                } catch (error) {
                  console.warn('Erro ao converter data:', error);
                  return new Date();
                }
              };
              
              const createdAt = convertFirestoreDate(userData.createdAt);
              const updatedAt = convertFirestoreDate(userData.updatedAt);
              const joinedAt = convertFirestoreDate(userData.joinedAt) || createdAt;
              const birthDate = userData.birthDate ? convertFirestoreDate(userData.birthDate) : null;
            
              const finalProfile: User = {
                id: firebaseUser.uid,
                email: userData.email ?? firebaseUser.email ?? '',
                displayName: userData.displayName ?? firebaseUser.displayName ?? 'Usuário',
                nickname: userData.nickname ?? '',
                photoURL: userData.photoURL ?? firebaseUser.photoURL ?? null,
                bio: userData.bio ?? '',
                location: userData.location ?? '',
                website: userData.website ?? '',
                birthDate: birthDate,
                createdAt: createdAt,
                updatedAt: updatedAt,
                joinedAt: joinedAt,
                booksRead: userData.booksRead ?? 0,
                currentlyReading: userData.currentlyReading ?? 0,
                followers: userData.followers ?? 0,
                following: userData.following ?? 0,
              };
            
              console.log('✅ Perfil final construído:', finalProfile);
            
              setProfile(finalProfile);
              setLoading(false);
            } else {
              console.log('⚠️ Perfil não existe no Firestore');
              setProfile(null);
              setLoading(false);
            } 
          } catch (profileError) {
            console.error('❌ Erro ao carregar perfil:', profileError);
            setProfile(null);
            setLoading(false); // ✅ Loading finalizado: usuário logado mas erro no perfil
            // Não definir como erro crítico, usuário ainda está autenticado
          }
        } else {
          console.log('👤 Usuário não está logado');
          setProfile(null);
          setLoading(false); // ✅ Loading finalizado: usuário não logado
        }
      } catch (error) {
        console.error('❌ Erro crítico na autenticação:', error);
        setError(error instanceof Error ? error.message : 'Erro de autenticação');
        setUser(null);
        setProfile(null);
        setLoading(false); // ✅ Loading finalizado: erro crítico
      }
    });

    return () => unsubscribe();
  }, [setUser, setProfile, setLoading, setError]);

  return {
    user,
    profile,
    loading,
    error,
  };
};
