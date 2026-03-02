import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { X, LogOut } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

/* Inline mark — avoids external dep or duplicate SVG gradient IDs */
const RezloMark = ({ size = 26 }) => (
    <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        width: size, height: size,
        borderRadius: Math.round(size * 0.26),
        background: 'linear-gradient(135deg,#6366f1,#ec4899)',
        flexShrink: 0,
        boxShadow: '0 0 12px rgba(99,102,241,0.45)',
    }}>
        <svg width={size * 0.62} height={size * 0.62} viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <rect x="2" y="1" width="4" height="24" rx="2" fill="white" />
            <path d="M6 1 H15 C19.4 1 23 4.6 23 9 C23 13.4 19.4 17 15 17 H6"
                stroke="white" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            <line x1="14" y1="17" x2="23" y2="25" stroke="white" strokeWidth="4" strokeLinecap="round" />
        </svg>
    </span>
);

const Sidebar = ({ isOpen, setIsOpen, navItems }) => {
    const location = useLocation();
    const { logout } = useAuth();

    const isActive = (path, exact = false) => {
        if (exact) return location.pathname === path;
        return location.pathname.startsWith(path);
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <>
            <motion.aside
                className={`sidebar ${isOpen ? 'open' : ''}`}
                initial={{ x: -280 }}
                animate={{ x: isOpen ? 0 : 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
                <div className="sidebar-header">
                    <Link to="/candidate" className="sidebar-logo">
                        <RezloMark size={30} />
                        <span className="logo-text" style={{
                            fontWeight: 800,
                            fontSize: '1.1rem',
                            letterSpacing: '-0.4px',
                            background: 'linear-gradient(135deg,#fff,#c7d2fe 60%,#f9a8d4)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                        }}>Rezlo</span>
                    </Link>
                    <button className="sidebar-close" onClick={() => setIsOpen(false)} aria-label="close sidebar">
                        <X size={24} />
                    </button>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`nav-item ${isActive(item.path, item.exact) ? 'active' : ''}`}
                            onClick={() => setIsOpen(false)}
                        >
                            <span className="nav-icon">{item.icon}</span>
                            <span className="nav-label">{item.label}</span>
                            {isActive(item.path, item.exact) && (
                                <motion.div
                                    className="active-indicator"
                                    layoutId="activeIndicator"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                />
                            )}
                        </Link>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout" onClick={handleLogout}>
                        <span className="nav-icon"><LogOut size={20} /></span>
                        <span className="nav-label">Logout</span>
                    </button>
                </div>
            </motion.aside>

            {/* Overlay */}
            {isOpen && (
                <motion.div
                    className="sidebar-overlay"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setIsOpen(false)}
                />
            )}
        </>
    );
};

export default Sidebar;
