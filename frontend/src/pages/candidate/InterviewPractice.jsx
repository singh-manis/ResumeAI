import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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

    const speak = (text) => {
        if (isMuted || !synth) return;

        // Cancel previous speech
        synth.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1;
        utterance.pitch = 1;
        utterance.volume = 1;
        synth.speak(utterance);
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

    const handleStartInterview = async () => {
        if (!config.role || !config.techStack || !config.experience) {
            toast.error("Please fill in all fields");
            return;
        }

        setLoading(true);
        try {
            const res = await interviewPracticeAPI.start(config);
            setMessages([
                {
                    role: 'assistant',
                    content: res.data.message
                }
            ]);
            setStep('interview');
            speak(res.data.message);
        } catch (error) {
            console.error("Start interview error:", error);
            toast.error("Failed to start interview");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (message = input) => {
        if (!message.trim() || loading) return;

        synth.cancel(); // Stop speaking if user interrupts
        const userMessage = { role: 'user', content: message.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const res = await interviewPracticeAPI.chat({
                message: message.trim(),
                history: messages,
                context: config
            });

            const assistantMessage = {
                role: 'assistant',
                content: res.data.response
            };
            setMessages(prev => [...prev, assistantMessage]);
            speak(res.data.response);
        } catch (error) {
            console.error("Interview chat error:", error);
            toast.error("Failed to send message");
        } finally {
            setLoading(false);
            inputRef.current?.focus();
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
                                            {msg.content.split('\n').map((line, i) => (
                                                <p key={i}>{line}</p>
                                            ))}
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
