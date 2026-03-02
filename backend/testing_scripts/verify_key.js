import dotenv from 'dotenv';
dotenv.config();

const API_KEY = process.env.GEMINI_API_KEY;
const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

console.log("Checking available models...");

try {
    const response = await fetch(URL);
    const data = await response.json();

    if (!response.ok) {
        console.error("Error:", response.status, response.statusText);
        console.error("Details:", JSON.stringify(data, null, 2));
    } else {
        console.log("Success! Available models:");
        if (data.models) {
            data.models.forEach(m => console.log(`- ${m.name}`));
        } else {
            console.log("No models found?", data);
        }
    }
} catch (err) {
    console.error("Fetch failed:", err);
}
