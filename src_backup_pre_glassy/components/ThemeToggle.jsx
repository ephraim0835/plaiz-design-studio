import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
    const { theme, toggleTheme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <button
            onClick={toggleTheme}
            className="theme-toggle-btn"
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
            title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
        >
            <div className="theme-toggle-icon-wrapper">
                {isDark ? (
                    <Sun className="theme-toggle-icon sun-icon" size={20} />
                ) : (
                    <Moon className="theme-toggle-icon moon-icon" size={20} />
                )}
            </div>
        </button>
    );
};

export default ThemeToggle;
