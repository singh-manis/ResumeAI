import { prisma } from '../index.js';

const XP_THRESHOLDS = [0, 100, 300, 600, 1000, 1500, 2100, 2800, 3600, 4500, 5500]; // Level 1 to 10+

export const addXP = async (userId, amount, source = 'ACTIVITY') => {
    console.log(`DEBUG: addXP called for ${userId}, amount: ${amount}, source: ${source}`);
    try {
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            console.error(`DEBUG: User ${userId} not found in addXP`);
            throw new Error('User not found');
        }

        // Handle potentially missing/undefined fields for existing users
        let currentXP = user.xp || 0;
        let currentLevel = user.level || 1;
        let currentStreak = user.streak || 0;
        let lastActivityDate = user.lastActivityDate ? new Date(user.lastActivityDate) : new Date(0); // Epoch if missing

        let newXP = currentXP + amount;
        let newLevel = currentLevel;

        // Check for level up
        for (let i = XP_THRESHOLDS.length - 1; i >= 0; i--) {
            if (newXP >= XP_THRESHOLDS[i]) {
                newLevel = i + 1;
                break;
            }
        }

        // Update streak if activity is on a new day
        const lastActivity = lastActivityDate;
        const today = new Date();
        const isSameDay = lastActivity.toDateString() === today.toDateString();
        const isNextDay = new Date(lastActivity.setDate(lastActivity.getDate() + 1)).toDateString() === today.toDateString();

        let newStreak = currentStreak;
        if (isNextDay) {
            newStreak += 1;
        } else if (!isSameDay) {
            const dayDiff = Math.floor((today - lastActivity) / (1000 * 60 * 60 * 24));
            if (dayDiff > 1) newStreak = 1;
        }

        const updatedUser = await prisma.user.update({
            where: { id: userId },
            data: {
                xp: newXP,
                level: newLevel,
                streak: newStreak,
                lastActivityDate: new Date()
            }
        });

        console.log(`DEBUG: User updated. New XP: ${newXP}, Level: ${newLevel}`);

        // Log analytics event for graph
        const analytics = await prisma.analytics.create({
            data: {
                userId: userId,
                eventType: source, // e.g., 'QUIZ_COMPLETION', 'INTERVIEW_SESSION'
                eventData: { amount: amount }
            }
        });
        console.log('DEBUG: Analytics created:', analytics);

        return {
            xp: updatedUser.xp,
            level: updatedUser.level,
            streak: updatedUser.streak,
            leveledUp: newLevel > currentLevel
        };

    } catch (error) {
        console.error('Error adding XP:', error);
        throw error;
    }
};

export const getGamificationStats = async (req, res) => {
    try {
        const userId = req.user.id;
        console.log(`DEBUG: getGamificationStats for ${userId}`);

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { xp: true, level: true, streak: true }
        });

        // XP for next level
        const currentLevelIdx = user.level - 1;
        const nextLevelXP = XP_THRESHOLDS[currentLevelIdx + 1] || (XP_THRESHOLDS[XP_THRESHOLDS.length - 1] + (user.level - XP_THRESHOLDS.length + 1) * 1000);
        const currentLevelStartXP = XP_THRESHOLDS[currentLevelIdx] || 0;

        const xpProgress = {
            current: user.xp,
            next: nextLevelXP,
            start: currentLevelStartXP,
            percentage: Math.min(100, Math.max(0, ((user.xp - currentLevelStartXP) / (nextLevelXP - currentLevelStartXP)) * 100))
        };

        // Calculate weekly activity
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        console.log(`DEBUG: Fetching analytics since ${sevenDaysAgo.toISOString()}`);

        const analyticsEvents = await prisma.analytics.findMany({
            where: {
                userId: userId,
                createdAt: {
                    gte: sevenDaysAgo
                }
            }
        });

        console.log(`DEBUG: Found ${analyticsEvents.length} analytics events`);

        const activityMap = {};
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { weekday: 'short' });
            activityMap[dateStr] = 0;
        }

        analyticsEvents.forEach(event => {
            const dateStr = new Date(event.createdAt).toLocaleDateString('en-US', { weekday: 'short' });
            if (activityMap[dateStr] !== undefined) {
                activityMap[dateStr]++;
            }
        });

        const weeklyActivity = Object.keys(activityMap).reverse().map(day => ({
            name: day,
            activity: activityMap[day]
        }));

        // Check if daily challenge is completed (e.g., at least 1 activity today)
        const todayStr = new Date().toLocaleDateString('en-US', { weekday: 'short' });
        const dailyChallengeCompleted = activityMap[todayStr] > 0;

        console.log(`DEBUG: Today: ${todayStr}, Count: ${activityMap[todayStr]}, Completed: ${dailyChallengeCompleted}`);

        res.json({ ...user, xpProgress, weeklyActivity, dailyChallengeCompleted });
    } catch (error) {
        console.error('Error fetching gamification stats:', error);
        res.status(500).json({ message: 'Failed to fetch stats' });
    }
};
