import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send,
    Bot,
    User,
    Sparkles,
    Loader,
    FileText,
    TrendingUp,
    Lightbulb,
    RefreshCw,
    BotMessageSquare,
    Target
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../services/api';
import './Chat.css';

const suggestedQuestions = [
    {
        icon: <FileText size={18} />,
        text: "How can I improve my resume?",
        category: "resume"
    },
    {
        icon: <Target size={18} />,
        text: "What skills should I learn for better job matches?",
        category: "skills"
    },
    {
        icon: <TrendingUp size={18} />,
        text: "What are the top in-demand skills in tech?",
        category: "career"
    },
    {
        icon: <Lightbulb size={18} />,
        text: "How do I prepare for technical interviews?",
        category: "interview"
    }
];

const Chat = () => {
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hello! I'm your AI Career Advisor. I can help you with resume improvements, career guidance, interview prep, and more. How can I assist you today?"
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (message = input) => {
        if (!message.trim() || loading) return;

        const userMessage = { role: 'user', content: message.trim() };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setLoading(true);

        try {
            const response = await api.post('/match/chat', {
                message: message.trim(),
                history: messages.slice(-10) // Send last 10 messages for context
            });

            const assistantMessage = {
                role: 'assistant',
                content: response.data.response || "I apologize, but I couldn't generate a response. Please try again."
            };
            setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
            console.error('Chat error:', error);
            const errorMessage = {
                role: 'assistant',
                content: "I'm having trouble connecting right now. Please try again in a moment."
            };
            setMessages(prev => [...prev, errorMessage]);
            toast.error('Failed to get response');
        } finally {
            setLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSuggestionClick = (question) => {
        handleSend(question);
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([
            {
                role: 'assistant',
                content: "Chat cleared! How can I help you today?"
            }
        ]);
    };

    return (
        <div className="chat-page">
            <div className="chat-container">
                {/* Header */}
                <div className="chat-header">
                    <div className="chat-header-info">
                        <div className="bot-avatar">
                            <BotMessageSquare size={24} />
                        </div>
                        <div>
                            <h1>AI Career Advisor</h1>
                            <span className="status online">Online</span>
                        </div>
                    </div>
                    <button className="clear-chat-btn" onClick={clearChat}>
                        <RefreshCw size={18} />
                        Clear Chat
                    </button>
                </div>

                {/* Messages */}
                <div className="chat-messages">
                    <AnimatePresence>
                        {messages.map((message, index) => (
                            <motion.div
                                key={index}
                                className={`message ${message.role}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div className="message-avatar">
                                    {message.role === 'assistant' ? (
                                        <BotMessageSquare size={20} />
                                    ) : (
                                        <User size={20} />
                                    )}
                                </div>
                                <div className="message-content">
                                    <div className="message-text">
                                        {message.content.split('\n').map((line, i) => (
                                            <p key={i}>{line}</p>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {loading && (
                        <motion.div
                            className="message assistant"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <div className="message-avatar">
                                <BotMessageSquare size={20} />
                            </div>
                            <div className="message-content">
                                <div className="typing-indicator">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    <div ref={messagesEndRef} />
                </div>

                {/* Suggestions */}
                {messages.length <= 2 && (
                    <div className="suggestions">
                        <p className="suggestions-label">Try asking:</p>
                        <div className="suggestions-grid">
                            {suggestedQuestions.map((q, index) => (
                                <button
                                    key={index}
                                    className="suggestion-btn"
                                    onClick={() => handleSuggestionClick(q.text)}
                                >
                                    {q.icon}
                                    <span>{q.text}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Input */}
                <div className="chat-input-container">
                    <div className="chat-input-wrapper">
                        <textarea
                            ref={inputRef}
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me about your career..."
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className="send-btn"
                            onClick={() => handleSend()}
                            disabled={!input.trim() || loading}
                        >
                            {loading ? (
                                <Loader size={20} className="spin" />
                            ) : (
                                <Send size={20} />
                            )}
                        </button>
                    </div>
                    <p className="input-hint">Press Enter to send, Shift+Enter for new line</p>
                </div>
            </div>
        </div>
    );
};

export default Chat;
