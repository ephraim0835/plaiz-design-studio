import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const ThemeToggle: React.FC = () => {
    const { theme, toggleTheme } = useTheme();

    return (
        <motion.button
            onClick={toggleTheme}
            className="relative w-14 h-8 rounded-full bg-surface border border-border shadow-soft flex items-center px-1 group overflow-hidden"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            layout
            title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
        >
            {/* Sliding Track Background */}
            <motion.div
                className={`absolute inset-0 transition-colors duration-500 ${theme === 'dark' ? 'bg-plaiz-blue/10' : 'bg-amber-500/5'}`}
            />

            {/* The Toggle Knob */}
            <motion.div
                className="relative z-10 w-6 h-6 rounded-full bg-white dark:bg-gray-900 border border-border shadow-md flex items-center justify-center pointer-events-none"
                animate={{ x: theme === 'dark' ? 24 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {theme === 'light' ? (
                        <motion.div
                            key="sun"
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: 90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Sun size={12} className="text-amber-500 fill-amber-500/20" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="moon"
                            initial={{ scale: 0, rotate: 90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            exit={{ scale: 0, rotate: -90 }}
                            transition={{ duration: 0.2 }}
                        >
                            <Moon size={12} className="text-plaiz-cyan fill-plaiz-cyan/20" />
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>

            {/* Atmospheric Background Glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-r from-transparent via-plaiz-blue/5 to-transparent pointer-events-none" />
        </motion.button>
    );
};

export default ThemeToggle;
