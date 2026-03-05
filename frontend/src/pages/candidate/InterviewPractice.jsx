import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
    MessageSquare,
    User,
    Bot,
    Send,
    Settings2,
    Mic,
    Loader2,
    Briefcase,
    Code2,
    GraduationCap,
    ArrowRight,
    StopCircle,
    MicOff,
    Volume2,
    VolumeX
} from 'lucide-react';
import { interviewPracticeAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './InterviewPractice.css';

const EXPERIENCE_LEVELS = ["Intern", "Junior", "Mid-Level", "Senior", "Lead"];

const InterviewPractice = () => {
    const [step, setStep] = useState('setup'); // setup, interview
    const [config, setConfig] = useState({
        role: '',
        techStack: '',
        experience: ''
    });
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const synth = window.speechSynthesis;
    const recognitionRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Initialize Speech Recognition
    useEffect(() => {
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev + (prev ? ' ' : '') + transcript);
                setIsRecording(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsRecording(false);
                toast.error('Voice input failed. Please try again.');
            };

            recognitionRef.current.onend = () => {
                setIsRecording(false);
            };
        }
    }, []);

    const speak = (text, cancel = true) => {
        if (isMuted || !synth) return;

        // Cancel previous speech if requested
        if (cancel) synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);

        // Try to find a better sounding English voice (e.g. Google or Microsoft natural voices)
        const voices = synth.getVoices();
        const preferredVoices = voices.filter(v => v.lang.startsWith('en') &&
            (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Premium')));

        if (preferredVoices.length > 0) {
            // Pick a professional sounding one (often UK or US female voices sound best)
            const bestVoice = preferredVoices.find(v => v.name.includes('Female') || v.name.includes('UK')) || preferredVoices[0];
            utterance.voice = bestVoice;
        } else {
            // Fallback to any English voice
            const engVoices = voices.filter(v => v.lang.startsWith('en'));
            if (engVoices.length > 0) utterance.voice = engVoices[0];
        }

        utterance.rate = 1.05; // Slightly faster for a more natural cadence
        utterance.pitch = 1.05; // Slightly higher pitch
        utterance.volume = 1;

        // Small delay to ensure voices are loaded (Chrome bug workaround)
        setTimeout(() => {
            synth.speak(utterance);
        }, 50);
    };

    const toggleRecording = () => {
        if (!recognitionRef.current) {
            toast.error('Speech recognition not supported in this browser');
            return;
        }

        if (isRecording) {
            recognitionRef.current.stop();
        } else {
            recognitionRef.current.start();
            setIsRecording(true);
        }
    };

    const processStream = async (res) => {
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';
        let sentenceBuffer = '';
        let isSpeakingStarted = false;

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');

            for (const line of lines) {
                if (line.startsWith('data: ') && !line.includes('[DONE]')) {
                    try {
                        const data = JSON.parse(line.slice(6));
                        if (data.text) {
                            fullText += data.text;
                            sentenceBuffer += data.text;

                            setMessages(prev => {
                                const newMsgs = [...prev];
                                // Update the last message (which should be the assistant's empty placeholder)
                                newMsgs[newMsgs.length - 1].content = fullText;
                                return newMsgs;
                            });

                            // Speak in chunks to avoid waiting for the full generation
                            if (/[.!?]\s/.test(sentenceBuffer) || sentenceBuffer.endsWith('\n')) {
                                speak(sentenceBuffer.trim(), !isSpeakingStarted);
                                isSpeakingStarted = true;
                                sentenceBuffer = '';
                            }
                        }
                    } catch (e) {
                        console.error('SSE Parse Error:', e, line);
                    }
                }
            }
        }
        // Speak remaining buffer
        if (sentenceBuffer.trim()) {
            speak(sentenceBuffer.trim(), !isSpeakingStarted);
        }
    };

    const handleStartInterview = async () => {
        if (!config.role || !config.techStack || !config.experience) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            setStep('interview');
            // Show typing indicator immediately while stream connects
            setMessages([{ role: 'assistant', content: '' }]);

            const res = await interviewPracticeAPI.streamStart(config);
            if (!res.ok) throw new Error("Stream start failed");
            await processStream(res);
        } catch (error) {
            console.error("Start interview error:", error);
            toast.error("Failed to start interview");
            setStep('setup');
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (message = input) => {
        if (!message.trim() || loading) return;

        synth.cancel(); // Stop speaking if user interrupts
        const userMessage = { role: 'user', content: message.trim() };

        // Add user message, and an empty assistant message to hold the incoming stream
        setMessages(prev => [...prev, userMessage, { role: 'assistant', content: '' }]);
        setInput('');
        setLoading(true);
        scrollToBottom();

        try {
            const res = await interviewPracticeAPI.streamChat({
                message: message.trim(),
                history: messages,
                context: config
            });
            if (!res.ok) throw new Error("Stream chat failed");
            await processStream(res);
        } catch (error) {
            console.error("Interview chat error:", error);
            toast.error("Failed to send message");
            // Remove the empty assistant message placeholder on error
            setMessages(prev => prev.slice(0, -1));
        } finally {
            setLoading(false);
            inputRef.current?.focus();
            scrollToBottom();
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const endInterview = () => {
        if (window.confirm("Are you sure you want to end the interview?")) {
            synth.cancel();
            setStep('setup');
            setMessages([]);
            setConfig({ role: '', techStack: '', experience: '' });
        }
    };

    return (
        <div className="interview-container">
            <div className="interview-header">
                <h1>
                    <MessageSquare className="icon" />
                    Mock Interview
                </h1>
                <p>Practice technical interviews with an AI interviewer</p>
            </div>

            <div className="interview-content">
                <AnimatePresence mode="wait">
                    {step === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="setup-card"
                        >
                            <h2>Interview Setup</h2>

                            <div className="form-group">
                                <label><Briefcase size={18} /> Target Role</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Frontend Developer"
                                    value={config.role}
                                    onChange={(e) => setConfig({ ...config, role: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label><Code2 size={18} /> Tech Stack</label>
                                <input
                                    type="text"
                                    placeholder="e.g. React, Node.js, TypeScript"
                                    value={config.techStack}
                                    onChange={(e) => setConfig({ ...config, techStack: e.target.value })}
                                />
                            </div>

                            <div className="form-group">
                                <label><GraduationCap size={18} /> Experience Level</label>
                                <div className="options-grid">
                                    {EXPERIENCE_LEVELS.map(exp => (
                                        <button
                                            key={exp}
                                            className={`option-btn ${config.experience === exp ? 'active' : ''}`}
                                            onClick={() => setConfig({ ...config, experience: exp })}
                                        >
                                            {exp}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="start-btn"
                                onClick={handleStartInterview}
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="spin" /> Setting up Interview...</>
                                ) : (
                                    <>Start Interview <ArrowRight size={20} /></>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {step === 'interview' && (
                        <motion.div
                            key="interview"
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="chat-interface"
                        >
                            <div className="chat-toolbar">
                                <div className="session-info">
                                    <span className="badge">{config.role}</span>
                                    <span className="badge outline">{config.experience}</span>
                                </div>
                                <div className="toolbar-actions">
                                    <button
                                        className={`icon-btn ${isMuted ? 'muted' : ''}`}
                                        onClick={() => {
                                            if (!isMuted) synth.cancel();
                                            setIsMuted(!isMuted);
                                        }}
                                        title={isMuted ? "Unmute AI" : "Mute AI"}
                                    >
                                        {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                    </button>
                                    <button className="end-btn" onClick={endInterview}>
                                        <StopCircle size={18} /> End Session
                                    </button>
                                </div>
                            </div>

                            <div className="messages-area">
                                {messages.map((msg, idx) => (
                                    <motion.div
                                        key={idx}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`message-bubble ${msg.role}`}
                                    >
                                        <div className="avatar">
                                            {msg.role === 'assistant' ? <Bot size={20} /> : <User size={20} />}
                                        </div>
                                        <div className="content">
                                            {msg.role === 'assistant' ? (
                                                <ReactMarkdown
                                                    className="markdown-content"
                                                    remarkPlugins={[remarkGfm]}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            ) : (
                                                msg.content.split('\n').map((line, i) => (
                                                    <p key={i}>{line}</p>
                                                ))
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                                {loading && (
                                    <div className="message-bubble assistant">
                                        <div className="avatar"><Bot size={20} /></div>
                                        <div className="content typing">
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                            <span className="dot"></span>
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            <div className="input-area">
                                <button
                                    className={`mic-btn ${isRecording ? 'recording' : ''}`}
                                    onClick={toggleRecording}
                                    title="Speak answer"
                                >
                                    {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
                                </button>
                                <textarea
                                    ref={inputRef}
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={isRecording ? "Listening..." : "Type your answer..."}
                                    className="chat-input"
                                    disabled={loading || isRecording}
                                />
                                <button
                                    className="send-msg-btn"
                                    onClick={() => handleSend()}
                                    disabled={!input.trim() || loading}
                                >
                                    <Send size={20} />
                                </button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default InterviewPractice;
