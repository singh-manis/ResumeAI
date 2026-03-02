import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
// Trying 2.5 flash
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

console.log("Testing gemini-2.5-flash direct...");

try {
    const result = await model.generateContent("Hello");
    console.log("Success:", await result.response.text());
} catch (error) {
    console.log("Error Status:", error.status);
    console.log("Error Details:", JSON.stringify(error, null, 2));
    if (error.response) {
        // console.log("Response:", await error.response.text());
    }
}
