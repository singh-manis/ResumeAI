import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
    console.log("API Key:", process.env.GEMINI_API_KEY ? "Present" : "Missing");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Note: older SDKs might not have listModels on the instance directly or at all?
    // But 0.24.1 might. Actually usually it's not on the client instance but on a manager.
    // Let's just try to generate content with gemini-pro which is older and usually available.

    try {
        console.log("Trying gemini-pro...");
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });
        const result = await model.generateContent("Hello");
        console.log("gemini-pro success:", await result.response.text());
    } catch (e) {
        console.log("gemini-pro failed:", e.message);
    }
}

listModels();
