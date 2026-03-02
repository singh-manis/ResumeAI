import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

console.log("Testing gemini-pro...");
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-pro" });

try {
    const result = await model.generateContent("Hello");
    console.log("Success:", await result.response.text());
} catch (error) {
    console.error("Error:", error);
}
