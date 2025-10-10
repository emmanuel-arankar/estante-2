import { ActionFunctionArgs, redirect } from "react-router-dom";
import { z } from "zod";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, User as FirebaseUser } from "firebase/auth";
import { auth } from "@/services/firebase";
import { PATHS } from "@/router/paths";
import { authStore } from "@/stores/authStore";
import { queryClient } from "@/lib/queryClient";
import { userQuery } from "@/features/users/user.queries";
import { User } from "@/models";
import { setSessionCookie } from "@/services/auth";
import { createUser } from "@/services/firestore"; 

// # atualizado: Definição dos schemas que estava faltando
const loginSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
});

const registerSchema = z.object({
  email: z.string().email({ message: "Email inválido" }),
  password: z.string().min(6, { message: "A senha deve ter no mínimo 6 caracteres" }),
  displayName: z.string().min(3, { message: "O nome deve ter no mínimo 3 caracteres" }),
  nickname: z.string().min(3, { message: "O nickname deve ter no mínimo 3 caracteres" }),
});


export const loginAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const validation = loginSchema.safeParse(data);

  if (!validation.success) {
    return { error: "Dados inválidos." };
  }

  const { email, password } = validation.data;

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const profile = await queryClient.fetchQuery(userQuery(firebaseUser.uid));
    
    authStore.getState().setUser(firebaseUser);
    authStore.getState().setProfile(profile as User);
    authStore.getState().setLoading(false);

    await setSessionCookie(firebaseUser);

    return redirect(PATHS.HOME);
  } catch (error: any) {
    const errorCode = error.code || "auth/unknown-error";
    return { error: errorCode };
  }
};

export const registerAction = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  const data = Object.fromEntries(formData);
  const validation = registerSchema.safeParse(data);

  if (!validation.success) {
    return { error: "Dados de registro inválidos." };
  }

  const { email, password, displayName, nickname } = validation.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // # atualizado: Usa a sua função 'createUser' e monta o objeto do perfil
    const newUserProfileData: Omit<User, 'id'> = {
      email: firebaseUser.email!,
      displayName,
      nickname,
      photoURL: firebaseUser.photoURL || '',
      role: 'user', // Define um role padrão
      // Outros campos com valores iniciais
      bio: '',
      location: '',
      website: '',
      birthDate: new Date(),
      joinedAt: new Date(),
      booksRead: 0,
      currentlyReading: 0,
      followers: 0,
      following: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await createUser(firebaseUser.uid, newUserProfileData);
    
    // Constrói o objeto de perfil completo para a store
    const newProfile: User = {
      id: firebaseUser.uid,
      ...newUserProfileData,
    };
    
    authStore.getState().setUser(firebaseUser);
    authStore.getState().setProfile(newProfile);
    authStore.getState().setLoading(false);

    await setSessionCookie(firebaseUser);
    
    return redirect(PATHS.HOME);
  } catch (error: any) {
    const errorCode = error.code || "auth/unknown-error";
    return { error: errorCode };
  }
};