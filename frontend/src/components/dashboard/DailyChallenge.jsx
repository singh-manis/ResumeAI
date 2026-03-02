import { TrendingUp, CheckCircle2, Circle } from 'lucide-react';
import { Link } from 'react-router-dom';
import './DailyChallenge.css';

const DailyChallenge = ({ completed = false }) => {
    return (
        <div className="daily-challenge-card">
            <div className="challenge-header">
                <div className="challenge-icon-bg">
                    <TrendingUp size={20} color="#fff" />
                </div>
                <div>
                    <h3>Daily Challenge</h3>
                    <p className="challenge-subtitle">Boost your streak!</p>
                </div>
            </div>

            <div className="challenge-content">
                <div className="challenge-item">
                    {completed ? (
                        <CheckCircle2 className="status-icon completed" size={20} />
                    ) : (
                        <Circle className="status-icon pending" size={20} />
                    )}
                    <div className="challenge-details">
                        <span className="task-name">Complete 1 Quiz</span>
                        <span className="xp-reward">+50 XP</span>
                    </div>
                </div>

                {!completed && (
                    <Link to="/candidate/quiz" className="btn btn-sm btn-primary challenge-btn">
                        Start Now
                    </Link>
                )}
            </div>
        </div>
    );
};

export default DailyChallenge;
