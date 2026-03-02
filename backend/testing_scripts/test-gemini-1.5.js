
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const MODEL_NAME = "gemini-1.5-flash";

console.log(`Testing ${MODEL_NAME} strictly...`);

async function runTest() {
    try {
        const model = genAI.getGenerativeModel({ model: MODEL_NAME });
        console.log("Model initialized.");
        const result = await model.generateContent("Hello, are you there?");
        const response = await result.response;
        console.log(`SUCCESS: Response: "${response.text()}"`);
    } catch (error) {
        console.error(`FAILURE: ${error.message}`);
        if (error.response) {
            console.error(`Status text: ${error.response.statusText}`);
        }
    }
}

runTest();
