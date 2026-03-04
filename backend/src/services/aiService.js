import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const MODELS = [
    "models/gemini-2.0-flash",
    "models/gemini-1.5-flash",
    "models/gemini-2.5-flash",
];

// Helper for cascade generation (optimized for Render's 30s timeout)
const generateWithCascade = async (userPrompt, systemInstruction = null, jsonMode = false) => {
    let lastError = null;

    for (const modelName of MODELS) {
        console.log(`DEBUG: Trying model ${modelName}...`);
        try {
            const config = { model: modelName };
            if (systemInstruction) config.systemInstruction = systemInstruction;
            if (jsonMode) config.generationConfig = { responseMimeType: "application/json" };

            const model = genAI.getGenerativeModel(config);

            let attempts = 0;
            const maxAttempts = 2;

            while (attempts < maxAttempts) {
                try {
                    const result = await model.generateContent(userPrompt);
                    const response = await result.response;
                    return response.text();
                } catch (attemptError) {
                    console.warn(`Attempt ${attempts + 1} with ${modelName} failed:`, attemptError.message);
                    lastError = attemptError;
                    attempts++;

                    if (attemptError.message.includes('404')) break; // Invalid model, skip

                    if (attemptError.message.includes('429')) {
                        const retryMatch = attemptError.message.match(/retryDelay":"(\d+)(?:\.\d+)?s"/);
                        const waitTime = retryMatch ? (parseInt(retryMatch[1]) + 1) * 1000 : 3000;

                        // Smart Skip: If wait is too long (> 4s), skip to next model immediately
                        if (waitTime > 4000) {
                            console.warn(`Wait time ${waitTime}ms too long for ${modelName}. Skipping model.`);
                            break;
                        }

                        if (attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                            continue;
                        }
                    } else {
                        // Network error, short wait
                        if (attempts < maxAttempts) await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        } catch (setupError) {
            console.error(`Failed to setup model ${modelName}:`, setupError);
        }
    }
    throw lastError || new Error("All AI models failed.");
};

export const generateContent = async (prompt) => {
    return await generateWithCascade(prompt);
};

export const generateMatchExplanation = async (resumeData, job, score) => {
    try {
        const prompt = `
        Analyze the match between this candidate and job.
        Match Score: ${score}/100
        
        Job Title: ${job.title}
        Company: ${job.company}
        Key Skills Required: ${job.skills.map(s => s.skill.name).join(', ')}
        
        Candidate Skills: ${resumeData.skills ? resumeData.skills.map(s => s.name).join(', ') : 'Not specified'}
        Candidate Experience: ${resumeData.experience ? JSON.stringify(resumeData.experience) : 'Not specified'}
        
        Provide a brief, professional explanation (max 3 sentences) of why this is a good or bad match, highlighting key strengths and missing critical skills.
        `;
        return await generateWithCascade(prompt);
    } catch (error) {
        console.error('Match Explanation Error:', error);
        return "Match explanation unavailable at this time.";
    }
};

export const chatWithCareerBot = async (message, history = []) => {
    const systemPrompt = `You are an expert AI Career Advisor. precise, helpful, and encouraging.
    Format your responses using Markdown: **bold**, bullets, ### Headers.`;

    const historyText = history.map(h => `${h.role === 'user' ? 'User' : 'Model'}: ${h.content}`).join('\n');
    const fullPrompt = `${systemPrompt}\n\nChat History:\n${historyText}\n\nUser: ${message}\nModel:`;

    try {
        return { response: await generateWithCascade(fullPrompt) };
    } catch (error) {
        console.error('Career Bot Error:', error);
        throw error;
    }
};

export const chatWithAI = async (message, history = []) => {
    return await chatWithCareerBot(message, history).then(res => res.response);
};

export const generateQuiz = async (domain, difficulty, numQuestions) => {
    try {
        const prompt = `
        Generate a strictly valid JSON array of ${numQuestions} multiple-choice questions for a ${difficulty} level quiz on the topic of "${domain}".
        Each object: { "id": 1, "question": "...", "options": [...], "correctAnswer": "...", "explanation": "..." }
        Return ONLY raw JSON, no markdown.
        `;

        const text = await generateWithCascade(prompt, null, true);

        const jsonMatch = text.match(/\[[\s\S]*\]/);
        const jsonString = jsonMatch ? jsonMatch[0] : text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsedQuiz = JSON.parse(jsonString);

        if (Array.isArray(parsedQuiz) && parsedQuiz.length > 0) return parsedQuiz;
        throw new Error("Invalid structure");

    } catch (error) {
        console.error('Generate Quiz Final Error:', error);
        // Fallback to mock quiz
        console.log("Falling back to mock quiz data for domain:", domain);

        const MOCK_QUIZZES = {
            "React": [
                { id: 1, question: "What is the primary purpose of a React component?", options: ["To execute database queries", "To split the UI into independent, reusable pieces", "To handle server-side routing", "To manage global state only"], correctAnswer: "To split the UI into independent, reusable pieces", explanation: "Components let you split the UI into independent, reusable pieces, and think about each piece in isolation." },
                { id: 2, question: "Which hook is used to handle side effects?", options: ["useState", "useContext", "useEffect", "useReducer"], correctAnswer: "useEffect", explanation: "useEffect handles side effects like data fetching." },
                { id: 3, question: "What is JSX?", options: ["Syntax extension for JS", "New HTML", "CSS preprocessor", "DB query"], correctAnswer: "Syntax extension for JS", explanation: "JSX allows writing HTML-like code in JS." },
                { id: 4, question: "What is the virtual DOM?", options: ["Direct browser DOM copy", "Lightweight memory copy", "Database", "Plugin"], correctAnswer: "Lightweight memory copy", explanation: "Virtual DOM improves performance by minimizing direct DOM manipulation." },
                { id: 5, question: "How do you pass data to child components?", options: ["State", "Props", "Redux", "Context"], correctAnswer: "Props", explanation: "Props are read-only components." },
                { id: 6, question: "What is the default port for React app?", options: ["3000", "8080", "5000", "4200"], correctAnswer: "3000", explanation: "Create React App uses port 3000 by default." },
                { id: 7, question: "What is a controlled component?", options: ["Value controlled by React state", "Controlled by DOM", "Controlled by server", "None"], correctAnswer: "Value controlled by React state", explanation: "Input form elements whose value is controlled by React." },
                { id: 8, question: "Which method is used to update state?", options: ["updateState", "setState", "changeState", "modifyState"], correctAnswer: "setState", explanation: "Class components use setState, functional use the setter from useState." },
                { id: 9, question: "What is the use of useRef?", options: ["To store mutable values without re-rendering", "To cause re-renders", "To route pages", "To fetch data"], correctAnswer: "To store mutable values without re-rendering", explanation: "useRef persists values between renders without causing a re-render." },
                { id: 10, question: "What handles routing in React?", options: ["React Router", "React Pass", "React Path", "React Way"], correctAnswer: "React Router", explanation: "React Router is the standard routing library." },
                { id: 11, question: "What is Prop Drilling?", options: ["Passing props down multiple levels", "Drilling holes in props", "Creating new props", "Deleting props"], correctAnswer: "Passing props down multiple levels", explanation: "Prop drilling refers to the process of passing data from a parent component down to a deep child component." },
                { id: 12, question: "How do you optimize list rendering?", options: ["Use keys", "Use index", "Use random numbers", "Do nothing"], correctAnswer: "Use keys", explanation: "Keys help React identify which items have changed, are added, or are removed." },
                { id: 13, question: "What is Redux?", options: ["State management library", "Database", "CSS framework", "Server"], correctAnswer: "State management library", explanation: "Redux is a predictable state container for JavaScript apps." },
                { id: 14, question: "What is a Higher-Order Component?", options: ["Function taking a component and returning a new one", "A tall component", "A parent component", "A root component"], correctAnswer: "Function taking a component and returning a new one", explanation: "HOC is a pattern for reusing component logic." },
                { id: 15, question: "Can you use hooks in class components?", options: ["No", "Yes", "Only useState", "Only useEffect"], correctAnswer: "No", explanation: "Hooks only work in functional components." },
                { id: 16, question: "What is strict mode?", options: ["Highlight potential problems", "Enforce types", "Prevent errors", "Faster rendering"], correctAnswer: "Highlight potential problems", explanation: "Strict Mode is a tool for indicating potential problems in an application." },
                { id: 17, question: "What replaces componentDidMount in hooks?", options: ["useEffect with empty dependency array", "useState", "useLayoutEffect", "useMemo"], correctAnswer: "useEffect with empty dependency array", explanation: "useEffect(() => {}, []) runs once after mount." },
                { id: 18, question: "What is the Context API?", options: ["Share values like themes between components", "Fetch API", "Database API", "Routing API"], correctAnswer: "Share values like themes between components", explanation: "Context provides a way to pass data through the component tree without manually passing props." },
                { id: 19, question: "What is React Fragment?", options: ["Group children without adding extra node", "A piece of code", "A broken component", "An error"], correctAnswer: "Group children without adding extra node", explanation: "Fragments let you group a list of children without adding extra nodes to the DOM." },
                { id: 20, question: "What is the purpose of useMemo?", options: ["Memoize values to optimize performance", "Memorize user", "Remember state", "Cache routes"], correctAnswer: "Memoize values to optimize performance", explanation: "useMemo recomputes the memoized value only when one of the dependencies has changed." }
            ],
            "Node.js": [
                { id: 1, question: "What is the event loop?", options: ["Database query loop", "Synchronous handler", "Non-blocking I/O mechanism", "UI renderer"], correctAnswer: "Non-blocking I/O mechanism", explanation: "Allows Node.js to perform non-blocking I/O operations." },
                { id: 2, question: "Which module creates a web server?", options: ["fs", "http", "path", "os"], correctAnswer: "http", explanation: "The http module allows Node.js to transfer data over HTTP." },
                { id: 3, question: "What is npm?", options: ["Node Project Manager", "Node Package Manager", "New Project Module", "Network Protocol Manager"], correctAnswer: "Node Package Manager", explanation: "npm is the package manager for Node.js." },
                { id: 4, question: "How do you import a module in CommonJS?", options: ["import", "include", "require", "fetch"], correctAnswer: "require", explanation: "CommonJS uses require()." },
                { id: 5, question: "Which core module deals with file paths?", options: ["url", "path", "fs", "querystring"], correctAnswer: "path", explanation: "The path module provides utilities for working with file and directory paths." },
                { id: 6, question: "What is `process.env`?", options: ["User environment", "System environment variables", "Process ID", "Memory usage"], correctAnswer: "System environment variables", explanation: "Used to access environment variables." },
                { id: 7, question: "What is a Stream?", options: ["Data collection", "Handling streaming data", "Video buffer", "None"], correctAnswer: "Handling streaming data", explanation: "Streams are objects that let you read data from a source or write data to a destination in continuous fashion." }
            ],
            "JavaScript": [
                { id: 1, question: "typeof null returns?", options: ["null", "undefined", "object", "number"], correctAnswer: "object", explanation: "Legacy bug in JS." },
                { id: 2, question: "Keyword for constant variable?", options: ["var", "let", "const", "static"], correctAnswer: "const", explanation: "Const creates a read-only reference." },
                { id: 3, question: "What is a closure?", options: ["Function with outer scope access", "Closed function", "Database closer", "Window closer"], correctAnswer: "Function with outer scope access", explanation: "Closure gives access to an outer function's scope from an inner function." },
                { id: 4, question: "Which is NOT a primitive type?", options: ["String", "Number", "Boolean", "Object"], correctAnswer: "Object", explanation: "Object is a reference type." },
                { id: 5, question: "What does `NaN` stand for?", options: ["Not a Null", "Not a Number", "No and No", "None"], correctAnswer: "Not a Number", explanation: "Represents a value that is not a legal number." },
                { id: 6, question: "Which method adds element to end of array?", options: ["push", "pop", "shift", "unshift"], correctAnswer: "push", explanation: "push() adds to the end." }
            ],
            "SQL": [
                { id: 1, question: "Unpack SQL?", options: ["Structured Query Language", "Strong Question Language", "Structured Question List", "Simple Query Language"], correctAnswer: "Structured Query Language", explanation: "Standard language for relational databases." },
                { id: 2, question: "Extract data command?", options: ["GET", "OPEN", "EXTRACT", "SELECT"], correctAnswer: "SELECT", explanation: "SELECT retrieves data." },
                { id: 3, question: "Filter records clause?", options: ["FILTER", "WHERE", "HAVING", "GROUP BY"], correctAnswer: "WHERE", explanation: "WHERE filters records based on a condition." },
                { id: 4, question: "Sort result set?", options: ["SORT BY", "ORDER BY", "GROUP BY", "ALIGN"], correctAnswer: "ORDER BY", explanation: "ORDER BY sorts the result set." },
                { id: 5, question: "Unique values only?", options: ["SELECT UNIQUE", "SELECT DISTINCT", "SELECT DIFFERENT", "SELECT ONLY"], correctAnswer: "SELECT DISTINCT", explanation: "DISTINCT returns only distinct (different) values." },
                { id: 6, question: "Insert new data?", options: ["ADD", "INSERT INTO", "UPDATE", "CREATE"], correctAnswer: "INSERT INTO", explanation: "INSERT INTO is used to insert new records." }
            ],
            "Python": [
                { id: 1, question: "3 / 2 in Python 3?", options: ["1", "1.5", "1.0", "Error"], correctAnswer: "1.5", explanation: "Division always returns float in Python 3." },
                { id: 2, question: "List comprehension syntax?", options: ["[x for x in list]", "(x for x in list)", "{x for x in list}", "None"], correctAnswer: "[x for x in list]", explanation: "Concise way to create lists." },
                { id: 3, question: "Tuple vs List?", options: ["Tuple immutable", "List immutable", "No difference", "Tuple faster"], correctAnswer: "Tuple immutable", explanation: "Tuples cannot be changed after creation." },
                { id: 4, question: "Define a function?", options: ["func", "def", "lambda", "define"], correctAnswer: "def", explanation: "def keyword is used to define functions." },
                { id: 5, question: "Comment character?", options: ["//", "#", "/*", "--"], correctAnswer: "#", explanation: "# is used for single line comments." }
            ]
        };

        const pool = MOCK_QUIZZES[domain] || MOCK_QUIZZES["React"];

        // Shuffle and slice
        const shuffled = pool.sort(() => 0.5 - Math.random());
        return shuffled.slice(0, numQuestions).map((q, index) => ({
            ...q,
            id: index + 1 // Re-index for UI consistency
        }));
    }
};

const MOCK_INTERVIEW_QUESTIONS = {
    "Frontend": [
        "Can you describe a challenging UI bug you solved recently?",
        "How do you optimize the performance of a React application?",
        "Explain the concept of the Virtual DOM and how it differs from the real DOM.",
        "What are the key differences between Local Storage, Session Storage, and Cookies?",
        "How do you handle state management in a complex application?",
        "Describe your experience with CSS preprocessors like SASS or LESS.",
        "What is your approach to making a website responsive and mobile-friendly?"
    ],
    "Backend": [
        "How do you handle database migrations in a production environment?",
        "Explain the difference between SQL and NoSQL databases. When would you use each?",
        "What strategies do you use for API authentication and authorization?",
        "How do you ensure the security of your backend APIs?",
        "Describe a time you had to optimize a slow database query.",
        "What is your experience with microservices architecture?",
        "How do you handle error logging and monitoring in a backend service?"
    ],
    "Fullstack": [
        "How do you decide between Server-Side Rendering (SSR) and Client-Side Rendering (CSR)?",
        "Describe a full-stack feature you built from database to UI.",
        "How do you handle CORS issues during development?",
        "What is your preferred deployment strategy for a full-stack app?",
        "How do you manage dependencies and versioning across frontend and backend?"
    ],
    "General": [
        "Tell me about a project you are most proud of.",
        "How do you keep up with the latest industry trends?",
        "Describe a technical conflict you had with a team member and how you resolved it.",
        "What is your process for debugging a production issue?"
    ]
};

export const getMockInterviewResponse = (role, techStack, context = "start") => {
    // Determine category based on role or stack
    let category = "General";
    const lowerRole = role.toLowerCase();
    const lowerStack = techStack.toLowerCase();

    if (lowerRole.includes("front") || lowerStack.includes("react") || lowerStack.includes("vue") || lowerStack.includes("angular")) {
        category = "Frontend";
    } else if (lowerRole.includes("back") || lowerStack.includes("node") || lowerStack.includes("express") || lowerStack.includes("django")) {
        category = "Backend";
    } else if (lowerRole.includes("full") || lowerRole.includes("mern")) {
        category = "Fullstack";
    }

    const questions = MOCK_INTERVIEW_QUESTIONS[category] || MOCK_INTERVIEW_QUESTIONS["General"];
    const randomQuestion = questions[Math.floor(Math.random() * questions.length)];

    if (context === "start") {
        return `Hello! I see you're applying for a ${role} position. Since our connection to the AI server is a bit unstable right now, I'll allow us to continue with a standard interview flow.\n\nLet's start with this: ${randomQuestion}`;
    } else {
        return `That's a fair point. Let's move on to the next topic.\n\n${randomQuestion}`;
    }
};

export const startInterviewSession = async (role, techStack, experience) => {
    try {
        const prompt = `You are an expert technical interviewer for a ${role} position (Stack: ${techStack}, Exp: ${experience}). Start by introducing yourself briefly and asking the first technical question.`;
        return await generateWithCascade(prompt);
    } catch (error) {
        console.error('Start Interview Error (Falling back to mock):', error.message);
        return getMockInterviewResponse(role, techStack, "start");
    }
};

// Helper for stream cascade generation
const generateStreamWithCascade = async (userPrompt) => {
    let lastError = null;
    for (const modelName of MODELS) {
        console.log(`DEBUG Stream: Trying model ${modelName}...`);
        try {
            const model = genAI.getGenerativeModel({ model: modelName });

            let attempts = 0;
            const maxAttempts = 2;

            while (attempts < maxAttempts) {
                try {
                    return await model.generateContentStream(userPrompt);
                } catch (attemptError) {
                    console.warn(`Stream attempt ${attempts + 1} with ${modelName} failed:`, attemptError.message);
                    lastError = attemptError;
                    attempts++;

                    if (attemptError.message.includes('404')) break; // Invalid model, skip

                    if (attemptError.message.includes('429')) {
                        const retryMatch = attemptError.message.match(/retryDelay":"(\d+)(?:\.\d+)?s"/);
                        const waitTime = retryMatch ? (parseInt(retryMatch[1]) + 1) * 1000 : 3000;

                        // Smart Skip: If wait is too long (> 4s), skip to next model immediately
                        if (waitTime > 4000) {
                            console.warn(`Wait time ${waitTime}ms too long for ${modelName}. Skipping model.`);
                            break;
                        }

                        if (attempts < maxAttempts) {
                            await new Promise(resolve => setTimeout(resolve, waitTime));
                            continue;
                        }
                    } else {
                        // Network error, short wait
                        if (attempts < maxAttempts) await new Promise(resolve => setTimeout(resolve, 1000));
                    }
                }
            }
        } catch (setupError) {
            console.error(`Failed to setup stream model ${modelName}:`, setupError);
        }
    }
    throw lastError || new Error("All AI models failed for streaming.");
};

export const streamStartInterviewSession = async (role, techStack, experience) => {
    try {
        const prompt = `You are an expert technical interviewer for a ${role} position (Stack: ${techStack}, Exp: ${experience}). Start by introducing yourself briefly and asking the first technical question.`;
        return await generateStreamWithCascade(prompt);
    } catch (error) {
        console.error('Stream Start Interview Error:', error.message);
        throw error;
    }
};

export const chatInInterview = async (message, history, role, techStack, experience) => {
    try {
        const historyText = history.map(h => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n');
        const prompt = `
        You are an expert technical interviewer for a ${role} position (Stack: ${techStack}, Exp: ${experience}).
        
        Interview History:
        ${historyText}
        
        Candidate's latest answer: "${message}"
        
        Your Goal:
        1. Evaluate the answer.
        2. Ask the NEXT technical question.
        3. Be professional but conversational.
        `;
        return await generateWithCascade(prompt);
    } catch (error) {
        console.error('Interview Chat Error (Falling back to mock):', error.message);
        return getMockInterviewResponse(role, techStack, "chat");
    }
};

export const streamChatInInterview = async (message, history, role, techStack, experience) => {
    try {
        const historyText = history.map(h => `${h.role === 'user' ? 'Candidate' : 'Interviewer'}: ${h.content}`).join('\n');
        const prompt = `
        You are an expert technical interviewer for a ${role} position (Stack: ${techStack}, Exp: ${experience}).
        
        Interview History:
        ${historyText}
        
        Candidate's latest answer: "${message}"
        
        Your Goal:
        1. Evaluate the answer.
        2. Ask the NEXT technical question.
        3. Be professional but conversational.
        `;
        return await generateStreamWithCascade(prompt);
    } catch (error) {
        console.error('Stream Interview Chat Error:', error.message);
        throw error;
    }
};


export const evaluateResumeMatch = async (resumeText, jobDescription, jobRequirements) => {
    try {
        const prompt = `
        You are an expert technical ATS (Applicant Tracking System). 
        Analyze the following Candidate Resume against the Job Description and Requirements.
        
        Job Description:
        ${jobDescription}
        
        Job Requirements:
        ${jobRequirements || 'Not explicitly provided.'}
        
        Candidate Resume:
        ${resumeText.substring(0, 15000)} // truncate to avoid token limits just in case
        
        Return a strict JSON object with EXACTLY the following format:
        {
            "matchScore": <number between 0 and 100 representing overall fit>,
            "strengths": ["string", "string"], // key skills/experience they have that matches
            "gaps": ["string", "string"], // key requirements from the job they are missing
            "candidateFeedback": "A short, encouraging 2-sentence feedback tip for the candidate on how to improve their chances for roles like this."
        }
        Return ONLY raw JSON, no markdown formatting blocks.
        `;

        const text = await generateWithCascade(prompt, null, true);

        // Clean markdown block if present
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        const jsonString = jsonMatch ? jsonMatch[0] : text.replace(/\`\`\`json/g, '').replace(/\`\`\`/g, '').trim();

        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Evaluate Resume Error:', error);
        // Fallback gracefully
        return {
            matchScore: 50,
            strengths: ["Relevant industry interest"],
            gaps: ["Automated parsing failed to extract exact matching skills"],
            candidateFeedback: "We received your application! Ensure your resume highlights your core technical skills clearly."
        };
    }
};
