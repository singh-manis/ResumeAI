import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    BrainCircuit,
    CheckCircle2,
    XCircle,
    AlertCircle,
    Timer,
    Trophy,
    ArrowRight,
    RotateCcw,
    Loader2,
    LayoutGrid
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { quizAPI } from '../../services/api';
import toast from 'react-hot-toast';
import './QuizPractice.css';

const DOMAINS = [
    "React", "Node.js", "JavaScript", "Python", "Java",
    "SQL", "DevOps", "Cybersecurity", "Data Structures", "System Design"
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced"];

const QuizPractice = () => {
    const [step, setStep] = useState('setup'); // setup, quiz, result
    const [config, setConfig] = useState({
        domain: '',
        difficulty: '',
        numQuestions: 5
    });
    const [loading, setLoading] = useState(false);
    const [quizData, setQuizData] = useState([]);
    const [responses, setResponses] = useState({});
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [score, setScore] = useState(0);

    const handleStartQuiz = async () => {
        if (!config.domain || !config.difficulty) {
            toast.error("Please select both a domain and difficulty");
            return;
        }

        setLoading(true);
        try {
            const res = await quizAPI.generate(config);
            if (res.data.quiz && res.data.quiz.length > 0) {
                setQuizData(res.data.quiz);
                setStep('quiz');
                setResponses({});
                setCurrentQuestion(0);
                setScore(0);
            } else {
                toast.error("Failed to generate questions. Please try again.");
            }
        } catch (error) {
            console.error("Quiz generation failed:", error);
            toast.error("Failed to start quiz. AI service might be busy.");
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (option) => {
        setResponses(prev => ({
            ...prev,
            [quizData[currentQuestion].id]: option
        }));
    };

    const [submitting, setSubmitting] = useState(false);

    const handleNext = async () => {
        if (currentQuestion < quizData.length - 1) {
            setCurrentQuestion(prev => prev + 1);
        } else {
            // Finish quiz
            await submitQuizResults();
        }
    };

    const submitQuizResults = async () => {
        let correctCount = 0;
        quizData.forEach(q => {
            if (responses[q.id] === q.correctAnswer) {
                correctCount++;
            }
        });
        const finalScore = (correctCount / quizData.length) * 100;
        setScore(finalScore);

        setSubmitting(true);
        // Submit results to backend to award XP
        try {
            await quizAPI.submit({
                score: finalScore,
                totalQuestions: quizData.length
            });
            toast.success(`Quiz Completed! You scored ${Math.round(finalScore)}%`);
        } catch (error) {
            console.error('Failed to submit quiz:', error);
            const errorMsg = error.response?.data?.message || "Results saved locally, but XP update failed.";
            toast.error(`Error: ${errorMsg}`);
        } finally {
            setSubmitting(false);
            setStep('result');
        }
    };

    return (
        <div className="quiz-container">
            <div className="quiz-header">
                <h1>
                    <BrainCircuit className="icon" />
                    Tech Quiz Practice
                </h1>
                <p>Sharpen your skills with AI-generated technical questions</p>
            </div>

            <div className="quiz-content">
                <AnimatePresence mode="wait">
                    {step === 'setup' && (
                        <motion.div
                            key="setup"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="setup-card"
                        >
                            <h2>Configure Your Quiz</h2>

                            <div className="form-group">
                                <label>Select Domain</label>
                                <div className="options-grid">
                                    {DOMAINS.map(d => (
                                        <button
                                            key={d}
                                            className={`option-btn ${config.domain === d ? 'active' : ''}`}
                                            onClick={() => setConfig({ ...config, domain: d })}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Select Difficulty</label>
                                <div className="options-flex">
                                    {DIFFICULTIES.map(d => (
                                        <button
                                            key={d}
                                            className={`option-btn ${config.difficulty === d ? 'active' : ''}`}
                                            onClick={() => setConfig({ ...config, difficulty: d })}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button
                                className="start-btn"
                                onClick={handleStartQuiz}
                                disabled={loading}
                            >
                                {loading ? (
                                    <><Loader2 className="spin" /> Generating Questions...</>
                                ) : (
                                    <>Start Quiz <ArrowRight size={20} /></>
                                )}
                            </button>
                        </motion.div>
                    )}

                    {step === 'quiz' && (
                        <motion.div
                            key="quiz"
                            initial={{ opacity: 0, x: 50 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            className="question-card"
                        >
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${((currentQuestion + 1) / quizData.length) * 100}%` }}
                                ></div>
                            </div>

                            <div className="question-header">
                                <span className="question-count">Question {currentQuestion + 1}/{quizData.length}</span>
                                <span className="difficulty-badge">{config.difficulty}</span>
                            </div>

                            <h3 className="question-text">{quizData[currentQuestion].question}</h3>

                            <div className="options-list">
                                {quizData[currentQuestion].options.map((opt, idx) => (
                                    <button
                                        key={idx}
                                        className={`quiz-option ${responses[quizData[currentQuestion].id] === opt ? 'selected' : ''}`}
                                        onClick={() => handleOptionSelect(opt)}
                                    >
                                        <span className="option-letter">{String.fromCharCode(65 + idx)}</span>
                                        {opt}
                                    </button>
                                ))}
                            </div>

                            <div className="quiz-actions">
                                <button
                                    className="next-btn"
                                    onClick={handleNext}
                                    disabled={!responses[quizData[currentQuestion].id] || submitting}
                                >
                                    {submitting ? (
                                        <><Loader2 className="spin" size={18} /> Saving...</>
                                    ) : (
                                        currentQuestion === quizData.length - 1 ? 'Finish Quiz' : 'Next Question'
                                    )}
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {step === 'result' && (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="result-card"
                        >
                            <div className="score-display">
                                <Trophy size={48} className="trophy-icon" />
                                <h2>Quiz Completed!</h2>
                                <div className="score-circle">
                                    <span className="score-value">{Math.round(score)}%</span>
                                    <span className="score-label">Score</span>
                                </div>
                            </div>

                            <div className="review-section">
                                <h3>Review Answers</h3>
                                {quizData.map((q, idx) => {
                                    const isCorrect = responses[q.id] === q.correctAnswer;
                                    return (
                                        <div key={q.id} className={`review-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                                            <div className="review-header">
                                                <span className="q-num">{idx + 1}.</span>
                                                <p>{q.question}</p>
                                                {isCorrect ? <CheckCircle2 className="icon-success" /> : <XCircle className="icon-error" />}
                                            </div>
                                            <div className="answer-details">
                                                <p className="your-ans">
                                                    <strong>Your Answer:</strong> {responses[q.id]}
                                                </p>
                                                {!isCorrect && (
                                                    <p className="correct-ans">
                                                        <strong>Correct Answer:</strong> {q.correctAnswer}
                                                    </p>
                                                )}
                                                <p className="explanation">
                                                    <AlertCircle size={14} /> {q.explanation}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button className="restart-btn" onClick={() => setStep('setup')}>
                                <RotateCcw size={18} /> Take Another Quiz
                            </button>
                            <Link to="/candidate" className="btn btn-secondary" style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                                <LayoutGrid size={18} /> Back to Dashboard
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default QuizPractice;
