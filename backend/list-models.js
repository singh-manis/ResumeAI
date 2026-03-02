
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

console.log("Fetching models...");

async function listModels() {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();

        console.log("Available Models:");
        if (json.models) {
            json.models.forEach(m => {
                // Filter for generateContent support
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No 'models' property in response:", json);
        }
    } catch (error) {
        console.error("Error fetching models:", error);
    }
}

listModels();
