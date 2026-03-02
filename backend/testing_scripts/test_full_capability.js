import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: "You are a helpful assistant."
});

console.log("Testing full capability (System Instruction + History)...");

const history = [
    {
        role: "user",
        parts: [{ text: "Hello, who are you?" }]
    },
    {
        role: "model",
        parts: [{ text: "I am a helpful assistant." }]
    }
];

try {
    const chat = model.startChat({
        history: history
    });

    const result = await chat.sendMessage("What can you do?");
    console.log("Success:", await result.response.text());
} catch (error) {
    console.error("Error Status:", error.status);
    console.error("Error Details:", JSON.stringify(error, null, 2));
}
