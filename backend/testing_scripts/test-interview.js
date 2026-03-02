
import dotenv from 'dotenv';
import { startInterviewSession } from './src/services/aiService.js';

dotenv.config();

console.log("Testing Interview Start...");

async function runTest() {
    try {
        const response = await startInterviewSession("Frontend Developer", "React, Node.js", "Junior");
        console.log("Response Length:", response.length);
        console.log("Response Preview:", response.substring(0, 100));

        if (response.includes("Hello! I am your AI Interviewer. Since our connection is a bit slow")) {
            console.error("FAILURE: Still receiving fallback response!");
        } else {
            console.log("SUCCESS: Received real AI response!");
        }
    } catch (error) {
        console.error("CRITICAL FAILURE:", error.message);
    }
}

runTest();
