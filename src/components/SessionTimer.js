// Modify the handleSessionEnd function
const handleSessionEnd = async () => {
  const sessionDuration = Math.floor((Date.now() - sessionStart) / 1000); // Duration in seconds
  
  try {
    // Update achievements with session time
    await updateUserAchievements(currentUser.uid, sessionDuration);
    
    // Update other session-related data
    const sessionData = {
      duration: sessionDuration,
      timestamp: serverTimestamp(),
      type: sessionType
    };
    
    // Add session to user's history
    const newSessionRef = push(ref(database, `users/${currentUser.uid}/sessions`));
    await set(newSessionRef, sessionData);
    
    // Update total sessions count
    const userStatsRef = ref(database, `users/${currentUser.uid}/profile/stats`);
    const statsSnapshot = await get(userStatsRef);
    const currentStats = statsSnapshot.val() || {};
    
    await update(userStatsRef, {
      totalSessions: (currentStats.totalSessions || 0) + 1,
      totalTime: (currentStats.totalTime || 0) + sessionDuration
    });
    
  } catch (error) {
    console.error("Error saving session data:", error);
  }
};