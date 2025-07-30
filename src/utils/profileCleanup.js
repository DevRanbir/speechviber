import { getDatabase, ref, remove } from 'firebase/database';

export const removeUserProfile = async (uid) => {
  try {
    const database = getDatabase();
    const userRef = ref(database, `users/${uid}`);
    await remove(userRef);
    console.log('Profile successfully removed');
    return true;
  } catch (error) {
    console.error('Error removing profile:', error);
    return false;
  }
};