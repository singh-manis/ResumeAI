import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    TrendingUp,
    Users,
    Briefcase,
    FileText,
    Target,
    Calendar,
    ArrowUp,
    ArrowDown,
    Activity,
    PieChart
} from 'lucide-react';
import api from '../../services/api';
import './Analytics.css';

const Analytics = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('week');

    useEffect(() => {
        loadStats();
    }, [period]);

    const loadStats = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/analytics/admin?period=${period}`);
            // Ensure data structure matches expected format
            const data = response.data;

            // If API returns real data, use it
            if (data.overview) {
                setStats({
                    overview: data.overview,
                    usersByRole: data.usersByRole || {},
                    activityData: data.activityData || [],
                    topSkills: data.topSkills || [],
                    recentActivity: data.recentActivity || []
                });
            } else {
                throw new Error('Invalid response format');
            }
        } catch (error) {
            console.error('Failed to load analytics:', error);
            // Fallback mock data for demo only when API fails
            setStats({
                overview: {
                    totalUsers: 0,
                    userGrowth: 0,
                    totalResumes: 0,
                    resumeGrowth: 0,
                    totalJobs: 0,
                    jobGrowth: 0,
                    totalApplications: 0,
                    applicationGrowth: 0
                },
                usersByRole: {
                    CANDIDATE: 0,
                    RECRUITER: 0,
                    ADMIN: 0
                },
                activityData: [],
                topSkills: [],
                recentActivity: []
            });
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Users',
            value: stats?.overview?.totalUsers || 0,
            growth: stats?.overview?.userGrowth || 0,
            icon: <Users size={24} />,
            color: 'primary'
        },
        {
            title: 'Resumes Uploaded',
            value: stats?.overview?.totalResumes || 0,
            growth: stats?.overview?.resumeGrowth || 0,
            icon: <FileText size={24} />,
            color: 'success'
        },
        {
            title: 'Active Jobs',
            value: stats?.overview?.totalJobs || 0,
            growth: stats?.overview?.jobGrowth || 0,
            icon: <Briefcase size={24} />,
            color: 'warning'
        },
        {
            title: 'Applications',
            value: stats?.overview?.totalApplications || 0,
            growth: stats?.overview?.applicationGrowth || 0,
            icon: <Target size={24} />,
            color: 'info'
        }
    ];

    const getMaxValue = (data, keys) => {
        if (!data || data.length === 0) return 1; // Prevent division by zero
        const max = Math.max(...data.flatMap(d => keys.map(k => d[k] || 0)));
        return max > 0 ? max : 1;
    };

    return (
        <div className="analytics-page">
            <div className="page-header">
                <div>
                    <h1><TrendingUp size={28} /> Platform Analytics</h1>
                    <p>Monitor platform performance and user activity</p>
                </div>
                <div className="period-selector">
                    <button
                        className={period === 'week' ? 'active' : ''}
                        onClick={() => setPeriod('week')}
                    >
                        Week
                    </button>
                    <button
                        className={period === 'month' ? 'active' : ''}
                        onClick={() => setPeriod('month')}
                    >
                        Month
                    </button>
                    <button
                        className={period === 'year' ? 'active' : ''}
                        onClick={() => setPeriod('year')}
                    >
                        Year
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loading-grid">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="stat-card loading"></div>
                    ))}
                </div>
            ) : (
                <>
                    {/* Overview Stats */}
                    <div className="stats-overview">
                        {statCards.map((card, index) => (
                            <motion.div
                                key={card.title}
                                className={`stat-card ${card.color}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <div className="stat-icon">{card.icon}</div>
                                <div className="stat-content">
                                    <span className="stat-value">
                                        {card.value.toLocaleString()}
                                    </span>
                                    <span className="stat-title">{card.title}</span>
                                </div>
                                <div className={`stat-growth ${card.growth >= 0 ? 'positive' : 'negative'}`}>
                                    {card.growth >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                                    {Math.abs(card.growth)}%
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="analytics-grid">
                        {/* Activity Chart */}
                        <motion.div
                            className="chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                        >
                            <div className="card-header">
                                <h2><Activity size={20} /> Weekly Activity</h2>
                            </div>
                            <div className="chart-container">
                                <div className="simple-chart">
                                    {stats?.activityData?.map((day, i) => (
                                        <div key={i} className="chart-bar-group">
                                            <div
                                                className="chart-bar users"
                                                style={{
                                                    height: `${(day.users / getMaxValue(stats.activityData, ['users', 'resumes', 'applications'])) * 100}%`
                                                }}
                                                title={`Users: ${day.users}`}
                                            ></div>
                                            <div
                                                className="chart-bar resumes"
                                                style={{
                                                    height: `${(day.resumes / getMaxValue(stats.activityData, ['users', 'resumes', 'applications'])) * 100}%`
                                                }}
                                                title={`Resumes: ${day.resumes}`}
                                            ></div>
                                            <div
                                                className="chart-bar applications"
                                                style={{
                                                    height: `${(day.applications / getMaxValue(stats.activityData, ['users', 'resumes', 'applications'])) * 100}%`
                                                }}
                                                title={`Applications: ${day.applications}`}
                                            ></div>
                                            <span className="chart-label">{day.date}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="chart-legend">
                                    <span className="legend-item users">Users</span>
                                    <span className="legend-item resumes">Resumes</span>
                                    <span className="legend-item applications">Applications</span>
                                </div>
                            </div>
                        </motion.div>

                        {/* Users by Role */}
                        <motion.div
                            className="chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                        >
                            <div className="card-header">
                                <h2><PieChart size={20} /> Users by Role</h2>
                            </div>
                            <div className="pie-container">
                                <div className="pie-chart">
                                    <svg viewBox="0 0 100 100">
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="var(--info)"
                                            strokeWidth="20"
                                            strokeDasharray={`${(stats?.usersByRole?.CANDIDATE / stats?.overview?.totalUsers) * 251.2} 251.2`}
                                            transform="rotate(-90 50 50)"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="var(--success)"
                                            strokeWidth="20"
                                            strokeDasharray={`${(stats?.usersByRole?.RECRUITER / stats?.overview?.totalUsers) * 251.2} 251.2`}
                                            strokeDashoffset={`-${(stats?.usersByRole?.CANDIDATE / stats?.overview?.totalUsers) * 251.2}`}
                                            transform="rotate(-90 50 50)"
                                        />
                                        <circle
                                            cx="50"
                                            cy="50"
                                            r="40"
                                            fill="none"
                                            stroke="var(--accent-primary)"
                                            strokeWidth="20"
                                            strokeDasharray={`${(stats?.usersByRole?.ADMIN / stats?.overview?.totalUsers) * 251.2} 251.2`}
                                            strokeDashoffset={`-${((stats?.usersByRole?.CANDIDATE + stats?.usersByRole?.RECRUITER) / stats?.overview?.totalUsers) * 251.2}`}
                                            transform="rotate(-90 50 50)"
                                        />
                                    </svg>
                                </div>
                                <div className="pie-legend">
                                    <div className="legend-row">
                                        <span className="legend-color candidate"></span>
                                        <span className="legend-label">Candidates</span>
                                        <span className="legend-value">{stats?.usersByRole?.CANDIDATE}</span>
                                    </div>
                                    <div className="legend-row">
                                        <span className="legend-color recruiter"></span>
                                        <span className="legend-label">Recruiters</span>
                                        <span className="legend-value">{stats?.usersByRole?.RECRUITER}</span>
                                    </div>
                                    <div className="legend-row">
                                        <span className="legend-color admin"></span>
                                        <span className="legend-label">Admins</span>
                                        <span className="legend-value">{stats?.usersByRole?.ADMIN}</span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Top Skills */}
                        <motion.div
                            className="chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                        >
                            <div className="card-header">
                                <h2><Target size={20} /> Top Skills</h2>
                            </div>
                            <div className="skills-list">
                                {stats?.topSkills?.map((skill, i) => (
                                    <div key={i} className="skill-row">
                                        <span className="skill-rank">#{i + 1}</span>
                                        <span className="skill-name">{skill.name}</span>
                                        <div className="skill-bar">
                                            <div
                                                className="skill-fill"
                                                style={{
                                                    width: `${(skill.count / stats.topSkills[0].count) * 100}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="skill-count">{skill.count}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Recent Activity */}
                        <motion.div
                            className="chart-card"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.5 }}
                        >
                            <div className="card-header">
                                <h2><Calendar size={20} /> Recent Activity</h2>
                            </div>
                            <div className="activity-list">
                                {stats?.recentActivity?.map((activity, i) => (
                                    <div key={i} className="activity-item">
                                        <div className={`activity-icon ${activity.type}`}>
                                            {activity.type === 'signup' && <Users size={14} />}
                                            {activity.type === 'resume' && <FileText size={14} />}
                                            {activity.type === 'job' && <Briefcase size={14} />}
                                            {activity.type === 'application' && <Target size={14} />}
                                        </div>
                                        <div className="activity-content">
                                            <strong>{activity.user}</strong>
                                            <span>
                                                {activity.type === 'signup' && 'joined the platform'}
                                                {activity.type === 'resume' && 'uploaded a resume'}
                                                {activity.type === 'job' && 'posted a new job'}
                                                {activity.type === 'application' && 'submitted an application'}
                                            </span>
                                        </div>
                                        <span className="activity-time">{activity.time}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </>
            )}
        </div>
    );
};

export default Analytics;
