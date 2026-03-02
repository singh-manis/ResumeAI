
import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function findWorkingModel() {
    console.log("🔍 Fetching available models...");

    // 1. Fetch Models using REST API (to bypass library filtering if any)
    const API_KEY = process.env.GEMINI_API_KEY;
    const URL = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    let modelNames = [];

    try {
        const response = await fetch(URL);
        if (!response.ok) {
            console.error(`❌ API Error: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.error(text);
            return;
        }
        const data = await response.json();
        // Filter for models that support 'generateContent'
        modelNames = data.models
            .filter(m => m.supportedGenerationMethods.includes('generateContent'))
            .map(m => m.name); // e.g., "models/gemini-1.5-flash"

        console.log(`📋 Found ${modelNames.length} compatible models:`);
        modelNames.forEach(n => console.log(`   - ${n}`));

    } catch (error) {
        console.error("❌ Failed to fetch model list:", error.message);
        // Fallback list if list fails
        modelNames = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-1.0-pro"];
    }

    console.log("\n🧪 Testing models one by one...");

    for (const modelName of modelNames) {
        process.stdout.write(`Testing ${modelName}... `);
        try {
            // Strip 'models/' prefix for the SDK if needed, but SDK usually handles it. 
            // We'll try exact name first.
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent("Say 'OK'");
            const response = await result.response;
            const text = response.text();

            if (text) {
                console.log(`✅ SUCCESS!`);
                console.log(`🎉 WORKING MODEL FOUND: "${modelName}"`);
                console.log(`Response: ${text}`);
                return; // Stop after finding the first working one
            }
        } catch (error) {
            console.log(`❌ FAILED`);
            // console.error(`   Reason: ${error.message.split('\n')[0]}`);
            if (error.message.includes('429')) console.log("   (Rate Limited)");
            else if (error.message.includes('404')) console.log("   (Not Found)");
            else console.log(`   Error: ${error.message}`);
        }
    }

    console.log("\n💀 CONCLUSION: No working models found. The API Key might be invalid or quota exceeded.");
}

findWorkingModel();
