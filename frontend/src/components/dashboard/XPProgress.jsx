import { motion } from 'framer-motion';
import { Trophy, Star, TrendingUp } from 'lucide-react';
import './XPProgress.css';

const XPProgress = ({ user }) => {
    if (!user || !user.xpProgress) return null;

    const { xp, level, streak, xpProgress } = user;

    return (
        <div className="xp-progress-container">
            <div className="level-badge">
                <div className="level-circle">
                    <span className="level-label">LVL</span>
                    <span className="level-number">{level}</span>
                </div>
            </div>

            <div className="progress-info">
                <div className="progress-header">
                    <div className="xp-text">
                        <Star className="icon-star" size={16} fill="#fbbf24" color="#fbbf24" />
                        <span className="current-xp">{xp} XP</span>
                        <span className="next-xp"> / {xpProgress.next} XP</span>
                    </div>
                    <div className="streak-badge">
                        <TrendingUp size={16} />
                        <span>{streak} Day Streak</span>
                    </div>
                </div>

                <div className="progress-bar-bg">
                    <motion.div
                        className="progress-bar-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${xpProgress.percentage}%` }}
                        transition={{ duration: 1, ease: "easeOut" }}
                    />
                </div>

                <p className="level-caption">
                    {Math.floor(xpProgress.next - xp)} XP to next level
                </p>
            </div>
        </div>
    );
};

export default XPProgress;
