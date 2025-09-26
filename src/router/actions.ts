import { db } from '../services/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { User } from '../models';

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
