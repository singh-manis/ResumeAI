import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

console.log("Testing startChat with empty history...");

try {
    const chat = model.startChat({
        history: [] // Explicitly empty
    });

    console.log("startChat successful with empty history.");

    const result = await chat.sendMessage("Hello");
    console.log("Response:", await result.response.text());
} catch (error) {
    console.error("Error:", error);
}
