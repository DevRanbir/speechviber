import { getDatabase, ref, push, serverTimestamp, get, update } from 'firebase/database';
import { updateAchievements } from './achievementService';

let activityCheckInterval;
let lastActiveTime = Date.now();
const ACTIVITY_CHECK_INTERVAL = 10 * 60 * 1000; // 10 minutes in milliseconds

export const startActivityTracking = (userId) => {
  // Reset last active time
  lastActiveTime = Date.now();

  // Clear any existing interval
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }

  // Set up activity tracking
  activityCheckInterval = setInterval(async () => {
    const currentTime = Date.now();
    const timeSpentMinutes = Math.floor((currentTime - lastActiveTime) / 60000);
    
    if (timeSpentMinutes > 0) {
      const db = getDatabase();
      const achievementsRef = ref(db, `users/${userId}/profile/achievements`);
      
      try {
        const snapshot = await get(achievementsRef);
        const currentAchievements = snapshot.val() || {
          totalTime: 0,
          totalSeconds: 0,
          points: 0
        };

        await update(achievementsRef, {
          totalTime: currentAchievements.totalTime + timeSpentMinutes,
          totalSeconds: currentAchievements.totalSeconds + ((currentTime - lastActiveTime) / 1000) % 60
        });
      } catch (error) {
        console.error('Error updating activity time:', error);
      }
    }
    
    lastActiveTime = currentTime;
  }, ACTIVITY_CHECK_INTERVAL);

  // Add event listeners for user activity
  document.addEventListener('mousemove', updateLastActiveTime);
  document.addEventListener('keypress', updateLastActiveTime);
  document.addEventListener('click', updateLastActiveTime);
};

export const stopActivityTracking = () => {
  if (activityCheckInterval) {
    clearInterval(activityCheckInterval);
  }
  document.removeEventListener('mousemove', updateLastActiveTime);
  document.removeEventListener('keypress', updateLastActiveTime);
  document.removeEventListener('click', updateLastActiveTime);
};

const updateLastActiveTime = () => {
  lastActiveTime = Date.now();
};

export const saveActivity = async (userId, activityData) => {
  const db = getDatabase();
  const historyRef = ref(db, `users/${userId}/history/data/${serverTimestamp()}/activities`);

  try {
    await push(historyRef, {
      ...activityData,
      timestamp: serverTimestamp()
    });

    await updateAchievements(userId, activityData);
  } catch (error) {
    console.error('Error saving activity:', error);
    throw error;
  }
};