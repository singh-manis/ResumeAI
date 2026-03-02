import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useSocket } from '../contexts/SocketContext';
import { messageAPI } from '../services/api';
import toast from 'react-hot-toast';
import { Send, User, Clock, Search, MessageSquare } from 'lucide-react';
import './Messages.css';

const Messages = () => {
    const { user } = useAuth();
    const { socket, isConnected } = useSocket();
    const location = useLocation();

    const [conversations, setConversations] = useState([]);
    const [activeConversation, setActiveConversation] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const messagesEndRef = useRef(null);

    // Load initial conversations or handle new chat request
    useEffect(() => {
        const initChat = async () => {
            await loadConversations();

            if (location.state?.startChat && location.state?.otherUserId) {
                try {
                    setLoading(true);
                    const response = await messageAPI.startConversation(
                        location.state.otherUserId,
                        location.state.jobId
                    );
                    const newConv = response.data.data.conversation;

                    // The conversation might be new or existing.
                    // If existing, it might already be in `conversations` array once it loads, 
                    // but we will explicitly load its messages and set it active
                    await loadMessages(newConv);

                    setConversations(prev => {
                        const exists = prev.find(c => c.id === newConv.id);
                        if (exists) return prev;
                        return [newConv, ...prev];
                    });
                } catch (error) {
                    toast.error('Failed to start conversation');
                } finally {
                    setLoading(false);
                }
            }
        };

        initChat();
    }, [location.state]);

    // Join socket room when active conversation changes
    useEffect(() => {
        if (!socket || !activeConversation) return;

        socket.emit('join_conversation', activeConversation.id);

        return () => {
            socket.emit('leave_conversation', activeConversation.id);
        };
    }, [socket, activeConversation]);

    // Listen for incoming messages
    useEffect(() => {
        if (!socket) return;

        const handleNewMessage = (message) => {
            if (activeConversation && message.conversationId === activeConversation.id) {
                setMessages(prev => [...prev, message]);
                scrollToBottom();
            }

            // Update conversation list
            setConversations(prev => prev.map(conv => {
                if (conv.id === message.conversationId) {
                    return {
                        ...conv,
                        lastMessage: message,
                        updatedAt: new Date().toISOString()
                    };
                }
                return conv;
            }).sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)));
        };

        socket.on('new_message', handleNewMessage);

        return () => {
            socket.off('new_message', handleNewMessage);
        };
    }, [socket, activeConversation]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const loadConversations = async () => {
        try {
            const response = await messageAPI.getConversations();
            setConversations(response.data.data.conversations || []);
        } catch (error) {
            toast.error('Failed to load conversations');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (conversation) => {
        try {
            setActiveConversation(conversation);
            const response = await messageAPI.getConversationMessages(conversation.id);
            setMessages(response.data.data.messages || []);
            setTimeout(scrollToBottom, 100);
        } catch (error) {
            toast.error('Failed to load messages');
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeConversation || !socket) return;

        const messageContent = newMessage.trim();
        setNewMessage(''); // optimistic clear

        try {
            // we will just emit via websocket to reduce standard http latency,
            // but the backend handler is configured to save to db then emit 
            socket.emit('send_message', {
                conversationId: activeConversation.id,
                senderId: user.id,
                content: messageContent
            });
            // We do NOT optimistic append to `messages` here, we rely on the `new_message` broadcast back to us to guarantee delivery.
        } catch (error) {
            toast.error('Failed to send message');
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '';
        const msgDate = new Date(dateString);
        const today = new Date();
        if (msgDate.toDateString() === today.toDateString()) {
            return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const filteredConversations = conversations.filter(conv => {
        const name = `${conv.participant?.firstName || ''} ${conv.participant?.lastName || ''}`.toLowerCase();
        return name.includes(searchTerm.toLowerCase());
    });

    return (
        <div className="messages-page fade-in">
            <div className="messages-layout">
                {/* Sidebar */}
                <div className="messages-sidebar">
                    <div className="sidebar-header">
                        <h2>Messages</h2>
                        <div className="search-bar">
                            <Search size={16} />
                            <input
                                type="text"
                                placeholder="Search conversations..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="conversations-list">
                        {loading ? (
                            <div className="loading-spinner">Loading...</div>
                        ) : filteredConversations.length > 0 ? (
                            filteredConversations.map(conv => (
                                <div
                                    key={conv.id}
                                    className={`conversation-item ${activeConversation?.id === conv.id ? 'active' : ''}`}
                                    onClick={() => loadMessages(conv)}
                                >
                                    <div className="avatar">
                                        {conv.participant?.avatar ? (
                                            <img src={conv.participant.avatar} alt="Avatar" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div className="conv-info">
                                        <div className="conv-header">
                                            <h4>{conv.participant?.firstName} {conv.participant?.lastName}</h4>
                                            <span className="time">{formatTime(conv.updatedAt)}</span>
                                        </div>
                                        <p className="last-message">
                                            {conv.lastMessage?.content || 'Started a conversation'}
                                        </p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="empty-conversations">
                                <MessageSquare size={32} />
                                <p>No conversations yet</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Active Chat Area */}
                <div className="active-chat">
                    {activeConversation ? (
                        <>
                            <div className="chat-header">
                                <div className="avatar">
                                    {activeConversation.participant?.avatar ? (
                                        <img src={activeConversation.participant.avatar} alt="Avatar" />
                                    ) : (
                                        <User size={24} />
                                    )}
                                </div>
                                <div className="chat-participant-info">
                                    <h3>{activeConversation.participant?.firstName} {activeConversation.participant?.lastName}</h3>
                                    {activeConversation.jobId && <span className="related-job">Regarding Job ID: {activeConversation.jobId.slice(0, 8)}...</span>}
                                </div>
                                {!isConnected && <div className="connection-status disconnected">Disconnected <Clock size={12} /></div>}
                            </div>

                            <div className="messages-container">
                                {messages.map((msg, index) => {
                                    const isMe = msg.senderId === user.id;
                                    return (
                                        <div key={msg.id || index} className={`message-wrapper ${isMe ? 'mine' : 'theirs'}`}>
                                            <div className="message-bubble">
                                                <p>{msg.content}</p>
                                                <span className="message-time">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={messagesEndRef} />
                            </div>

                            <form className="message-input-area" onSubmit={handleSendMessage}>
                                <input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={!isConnected}
                                />
                                <button type="submit" className="btn btn-primary send-btn" disabled={!newMessage.trim() || !isConnected}>
                                    <Send size={18} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="empty-chat-state">
                            <div className="icon-wrapper">
                                <MessageSquare size={48} />
                            </div>
                            <h3>Your Messages</h3>
                            <p>Select a conversation from the sidebar to start chatting</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Messages;
