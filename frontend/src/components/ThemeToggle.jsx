import { motion } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <motion.button
            className={`theme-toggle ${isDark ? 'dark' : 'light'}`}
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
        >
            <div className="toggle-track">
                <motion.div
                    className="toggle-thumb"
                    initial={false}
                    animate={{ x: isDark ? 28 : 2 }} // Total track width 54px minus thumb width ~24px
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                >
                    <motion.div
                        className="icon-container"
                        initial={false}
                        animate={{ rotate: isDark ? 360 : 0 }}
                        transition={{ duration: 0.5, ease: "anticipate" }}
                    >
                        {isDark ? (
                            <Moon size={14} className="moon-icon" />
                        ) : (
                            <Sun size={14} className="sun-icon" />
                        )}
                    </motion.div>
                </motion.div>
                <div className="track-icons">
                    <Sun size={12} className="background-sun" />
                    <Moon size={12} className="background-moon" />
                </div>
            </div>
        </motion.button>
    );
};

export default ThemeToggle;
