
import dotenv from 'dotenv';
import { generateQuiz } from './src/services/aiService.js';

dotenv.config();

console.log("Testing Cascade Quiz Generation...");
console.log("API KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

async function runTest() {
    try {
        const questions = await generateQuiz("React", "Medium", 3);
        console.log("Success! Generated Question IDs:", questions.map(q => q.id));
        console.log("First question:", questions[0].question);
    } catch (error) {
        console.error("Failed:", error.message);
    }
}

runTest();
