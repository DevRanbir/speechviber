import { getDatabase, ref, push, serverTimestamp, get, update } from 'firebase/database';

let activityCheckInterval;
let lastActiveTime = Date.now();
const ACTIVITY_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const startActivityTracking = (userId) => {
  lastActiveTime = Date.now();

  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }

  activityCheckInterval = setInterval(async () => {
    const currentTime = Date.now();
    const timeSpentMinutes = Math.floor((currentTime - lastActiveTime) / 60000);
    
    if (timeSpentMinutes >= 10) {
      const db = getDatabase();
      const achievementsRef = ref(db, `users/${userId}/profile/achievements`);
      
      try {
        const snapshot = await get(achievementsRef);
        const currentAchievements = snapshot.val() || {
          points: 0,
          totalTime: 0
        };

        // Ensure values are numbers and not NaN
        const newPoints = (currentAchievements.points || 0) + 1;
        const newTotalTime = (currentAchievements.totalTime || 0) + 10; // Add 10 minutes

        await update(achievementsRef, {
          points: newPoints,
          totalTime: newTotalTime
        });

        lastActiveTime = currentTime;
      } catch (error) {
        console.error('Error updating points:', error);
      }
    }
  }, ACTIVITY_CHECK_INTERVAL);
};

export const stopActivityTracking = () => {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }
};