import { generateQuiz } from '../services/aiService.js';
import { addXP } from './gamificationController.js';

export const createQuiz = async (req, res) => {
    try {
        const { domain, difficulty, numQuestions } = req.body;

        if (!domain || !difficulty) {
            return res.status(400).json({ message: 'Domain and difficulty are required' });
        }

        const quiz = await generateQuiz(domain, difficulty, numQuestions);

        // Award XP for generating/starting a quiz (small amount)
        // Ideally XP is awarded on completion, but for now we award for engagement
        if (req.user) {
            try {
                await addXP(req.user.id, 10);

                // Log activity for the graph
                // We'll add this next, but first fixing the ID crash
            } catch (xpError) {
                console.error('Failed to award XP:', xpError);
                // Continue execution - don't fail quiz generation just because XP failed
            }
        }

        res.json({ quiz });
    } catch (error) {
        console.error('Create Quiz Error:', error);
        res.status(500).json({ message: 'Failed to generate quiz' });
    }
};

export const submitQuiz = async (req, res) => {
    console.log(`DEBUG: submitQuiz called for user ${req.user.id}`);
    try {
        const { score, totalQuestions } = req.body;
        const userId = req.user.id;

        console.log(`DEBUG: Score: ${score}, Total: ${totalQuestions}, User: ${userId}`);

        // Base XP for completing
        let xpAwarded = 20;

        // Bonus XP for good score
        if (score >= 70) xpAwarded += 30; // Total 50
        if (score === 100) xpAwarded += 20; // Total 70

        console.log(`DEBUG: Awarding ${xpAwarded} XP...`);
        const result = await addXP(userId, xpAwarded, 'QUIZ_COMPLETION');
        console.log('DEBUG: addXP result:', result);

        res.json({
            message: 'Quiz submitted successfully',
            xpEarned: xpAwarded
        });
    } catch (error) {
        console.error('Submit Quiz Error:', error);
        res.status(500).json({
            message: error.message || 'Failed to submit quiz results',
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};
