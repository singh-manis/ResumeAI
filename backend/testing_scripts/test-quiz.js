
import dotenv from 'dotenv';
import { generateQuiz } from './src/services/aiService.js';

dotenv.config();

console.log("Testing Quiz Generation...");
console.log("API KEY:", process.env.GEMINI_API_KEY ? "Present" : "Missing");

generateQuiz("React", "Beginner", 3)
    .then(quiz => {
        console.log("Quiz Generated Successfully:");
        console.log(JSON.stringify(quiz, null, 2));
    })
    .catch(err => {
        console.error("Quiz Generation Failed:");
        console.error(err);
    });
