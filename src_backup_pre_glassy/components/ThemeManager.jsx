import { useEffect } from 'react';

const ThemeManager = () => {
    // Theme is now managed by ThemeContext and persisted in localStorage
    // This component can be used for any global theme-related side effects

    useEffect(() => {
        // Remove 'no-transition' class after initial load to enable smooth transitions
        const timer = setTimeout(() => {
            document.body.classList.remove('no-transition');
        }, 100);

        return () => clearTimeout(timer);
    }, []);

    return null;
};

export default ThemeManager;
