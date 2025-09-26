import { auth } from '../services/firebase';
import { getPendingRequestCount } from '../services/firestore';

export const getCurrentUser = () => {
  return auth.currentUser;
};

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
