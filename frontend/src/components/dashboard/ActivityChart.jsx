import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import './ActivityChart.css';

const ActivityChart = ({ data }) => {
    // Fallback if no data provided
    const chartData = data || [
        { name: 'Mon', activity: 0 },
        { name: 'Tue', activity: 0 },
        { name: 'Wed', activity: 0 },
        { name: 'Thu', activity: 0 },
        { name: 'Fri', activity: 0 },
        { name: 'Sat', activity: 0 },
        { name: 'Sun', activity: 0 },
    ];

    return (
        <div className="activity-chart-container">
            <h3>Weekly Activity</h3>
            <div className="chart-wrapper">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                        <XAxis
                            dataKey="name"
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <YAxis
                            stroke="#94a3b8"
                            tick={{ fill: '#94a3b8' }}
                            axisLine={false}
                            tickLine={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1e293b',
                                border: '1px solid #334155',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar
                            dataKey="activity"
                            fill="#f43f5e"
                            radius={[4, 4, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default ActivityChart;
