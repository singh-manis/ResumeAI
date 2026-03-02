import dotenv from 'dotenv';
import { chatWithCareerBot } from './src/services/aiService.js';

dotenv.config();

console.log("Testing chatWithCareerBot with updated model...");

try {
    const response = await chatWithCareerBot("Hello, I need help with my resume.");
    console.log("Success! Response from AI:");
    console.log(JSON.stringify(response, null, 2));
} catch (error) {
    console.error("Test Failed:", error);
}
