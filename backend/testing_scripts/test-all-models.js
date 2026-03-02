
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODELS = ["gemini-2.0-flash-001", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"];

console.log("Testing All Models Individually...");

async function runTest() {
    for (const modelName of MODELS) {
        console.log(`\n--- Testing ${modelName} ---`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say hello");
            const response = await result.response;
            console.log(`SUCCESS: ${modelName} responded: "${response.text()}"`);
        } catch (error) {
            console.error(`FAILURE: ${modelName} failed with: ${error.message}`);
            if (error.response) {
                console.error(`Status text: ${error.response.statusText}`);
            }
        }
    }
}

runTest();
