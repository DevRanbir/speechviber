import { getDatabase, ref, update } from 'firebase/database';

const ranks = {
  starter: { name: 'Starter', pointsNeeded: 0 },
  bronze: { name: 'Bronze', pointsNeeded: 100 },
  silver: { name: 'Silver', pointsNeeded: 300 },
  gold: { name: 'Gold', pointsNeeded: 600 },
  platinum: { name: 'Platinum', pointsNeeded: 1000 },
  diamond: { name: 'Diamond', pointsNeeded: 2000 },
  master: { name: 'Master', pointsNeeded: 5000 }
};

export const getRankInfo = (rank) => ranks[rank] || ranks.starter;

export const getNextRank = (currentRank) => {
  const rankOrder = Object.keys(ranks);
  const currentIndex = rankOrder.indexOf(currentRank);
  return rankOrder[currentIndex + 1] || currentRank;
};

export const updateAchievements = async (userId, activityData) => {
  const db = getDatabase();
  const achievementRef = ref(db, `users/${userId}/profile/achievements`);

  // Calculate points based on activity
  const pointsEarned = calculatePoints(activityData);
  const timeSpent = parseInt(activityData.duration) || 0;

  try {
    // Get current achievements
    const snapshot = await get(ref(db, `users/${userId}/profile/achievements`));
    const currentAchievements = snapshot.val() || {
      totalTime: 0,
      totalSeconds: 0,
      points: 0,
      currentRank: 'starter',
      currentStage: 'Novice'
    };

    // Update achievements
    const updatedAchievements = {
      totalTime: (currentAchievements.totalTime || 0) + Math.floor(timeSpent / 60),
      totalSeconds: (currentAchievements.totalSeconds || 0) + (timeSpent % 60),
      points: (currentAchievements.points || 0) + pointsEarned,
      currentRank: calculateRank((currentAchievements.points || 0) + pointsEarned),
      currentStage: calculateStage((currentAchievements.points || 0) + pointsEarned)
    };

    await update(achievementRef, updatedAchievements);
    return updatedAchievements;
  } catch (error) {
    console.error('Error updating achievements:', error);
    throw error;
  }
};

const calculatePoints = (activity) => {
  const basePoints = {
    'Interview Practice': 20,
    'Word Power': 15,
    'Grammar Check': 15,
    'Pronunciation': 15,
    'Debate': 25,
    'Story': 10,
    'Practice': 10
  };

  const score = parseInt(activity.score) || 0;
  const basePoint = basePoints[activity.type] || 10;
  return Math.round(basePoint * (score / 100 + 0.5));
};

const calculateRank = (points) => {
  if (points >= 5000) return 'master';
  if (points >= 2000) return 'diamond';
  if (points >= 1000) return 'platinum';
  if (points >= 600) return 'gold';
  if (points >= 300) return 'silver';
  if (points >= 100) return 'bronze';
  return 'starter';
};

const calculateStage = (points) => {
  if (points >= 5000) return 'Master Speaker';
  if (points >= 2000) return 'Expert';
  if (points >= 1000) return 'Advanced';
  if (points >= 600) return 'Intermediate';
  if (points >= 300) return 'Skilled';
  if (points >= 100) return 'Beginner';
  return 'Novice';
};