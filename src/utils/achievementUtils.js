// Add or modify this function to properly calculate total time
export const updateUserAchievements = async (userId, sessionTime) => {
  const db = getDatabase();
  const userRef = ref(db, `users/${userId}/profile/achievements`);
  
  try {
    const snapshot = await get(userRef);
    const currentData = snapshot.val() || {};
    
    // Calculate new total time in minutes
    const currentTotalTime = currentData.totalTime || 0;
    const newTotalTime = currentTotalTime + (sessionTime / 60); // Convert seconds to minutes
    
    // Update achievements in database
    await update(userRef, {
      totalTime: newTotalTime,
      points: currentData.points || 0
    });
    
  } catch (error) {
    console.error("Error updating achievements:", error);
  }
};