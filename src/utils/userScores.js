import { db } from '../firebase/config';
import { ref, push, get, update } from 'firebase/database';

export const saveScore = async (userId, gameType, score) => {
  const scoresRef = ref(db, `users/${userId}/scores/${gameType}`);
  await push(scoresRef, {
    score,
    timestamp: new Date().toISOString()
  });
};

export const getUserScores = async (userId, gameType) => {
  const scoresRef = ref(db, `users/${userId}/scores/${gameType}`);
  const snapshot = await get(scoresRef);
  return snapshot.exists() ? Object.values(snapshot.val()) : [];
};

export const updateUserProfile = async (userId, data) => {
  const userRef = ref(db, `users/${userId}`);
  await update(userRef, data);
};