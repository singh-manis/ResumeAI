import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { ChevronDown, Sparkles, LogOut, Menu, X, Bell } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import NotificationBell from '../NotificationBell';
import ThemeToggle from '../ThemeToggle';
import Logo from '../Logo';

const NavDropdown = ({ label, items, isActive }) => {
    const [isOpen, setIsOpen] = useState(false);
    const location = useLocation();

    const isChildActive = items.some(item => location.pathname === item.path);

    return (
        <div
            className="nav-dropdown-container"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <button
                className={`nav-link ${isActive || isChildActive ? 'active' : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {label}
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <ChevronDown size={14} className="dropdown-icon" />
                </motion.div>
                {(isActive || isChildActive) && (
                    <motion.div
                        layoutId="nav-underline"
                        className="nav-active-indicator"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                )}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className="nav-dropdown-menu"
                        initial={{ opacity: 0, y: 15, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 15, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: "easeOut" }}
                    >
                        <div className="dropdown-arrow" />
                        {items.map((item) => (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={`dropdown-item ${location.pathname === item.path ? 'active' : ''}`}
                            >
                                <motion.span
                                    whileHover={{ scale: 1.1, color: '#a5b4fc' }}
                                    className="item-icon"
                                >
                                    {item.icon}
                                </motion.span>
                                <span>{item.label}</span>
                            </Link>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const TopNavbar = ({ navGroups }) => {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate(); // Added useNavigate hook
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false); // Added state for profile dropdown

    const handleLogout = async () => {
        await logout();
        navigate('/login'); // Redirect to login after logout
    };

    return (
        <nav className="top-navbar">
            <div className="navbar-container">
                <div className="navbar-left"> {/* Added navbar-left div */}
                    <Link to="/" className="navbar-logo">
                        <Logo size="small" /> {/* Replaced Sparkles icon and text with Logo component */}
                    </Link>
                </div>

                {/* Desktop Navigation */}
                <div className="desktop-nav">
                    {navGroups.map((group, index) => (
                        group.items ? (
                            <NavDropdown
                                key={index}
                                label={group.label}
                                items={group.items}
                                isActive={location.pathname.startsWith(group.path)}
                            />
                        ) : (
                            <Link
                                key={group.path}
                                to={group.path}
                                className={`nav-link ${location.pathname === group.path ? 'active' : ''}`}
                            >
                                {group.label}
                                {(location.pathname === group.path) && (
                                    <motion.div
                                        layoutId="nav-underline"
                                        className="nav-active-indicator"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </Link>
                        )
                    ))}
                </div>

                <div className="navbar-actions">
                    <ThemeToggle />
                    <NotificationBell />

                    <div className="user-menu-dropdown">
                        <div className="user-pill">
                            <div className="user-avatar">
                                {user?.firstName?.[0]}{user?.lastName?.[0]}
                            </div>
                            <span className="user-name">{user?.firstName}</span>
                        </div>
                        <motion.button
                            className="logout-btn-icon"
                            onClick={handleLogout}
                            title="Logout"
                            whileHover={{ scale: 1.1, color: "#ef4444" }}
                            whileTap={{ scale: 0.9 }}
                        >
                            <LogOut size={18} />
                        </motion.button>
                    </div>

                    <button className="mobile-menu-toggle" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {mobileMenuOpen && (
                    <motion.div
                        className="mobile-menu"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                    >
                        {navGroups.map((group, index) => (
                            <div key={index} className="mobile-group">
                                {group.items ? (
                                    <>
                                        <div className="mobile-group-label">{group.label}</div>
                                        {group.items.map(item => (
                                            <Link
                                                key={item.path}
                                                to={item.path}
                                                className="mobile-link"
                                                onClick={() => setMobileMenuOpen(false)}
                                            >
                                                <span className="mobile-icon">{item.icon}</span>
                                                {item.label}
                                            </Link>
                                        ))}
                                    </>
                                ) : (
                                    <Link
                                        to={group.path}
                                        className="mobile-link main"
                                        onClick={() => setMobileMenuOpen(false)}
                                    >
                                        {group.label}
                                    </Link>
                                )}
                            </div>
                        ))}
                        <button className="mobile-link logout" onClick={handleLogout}>
                            <LogOut size={18} />
                            Logout
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
};

export default TopNavbar;
