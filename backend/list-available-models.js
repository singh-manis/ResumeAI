
import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("Fetching models...");

async function listModels() {
    try {
        const response = await fetch(URL);
        if (!response.ok) {
            const text = await response.text();
            console.error(`Error: ${response.status} ${response.statusText}`);
            console.error(text);
            return;
        }
        const data = await response.json();
        const models = data.models;
        console.log("AVAILABLE MODELS:");
        if (models) {
            models.forEach(m => console.log(m.name, "-", m.supportedGenerationMethods.join(', ')));
        } else {
            console.log("No models found in response:", data);
        }
    } catch (error) {
        console.error("Error fetching models:", error.message);
    }
}

listModels();
