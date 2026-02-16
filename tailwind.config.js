/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Official Plaiz Branding Palette (Premium & Balanced)
                'plaiz-blue': '#007BFF',   // Primary Branding
                'plaiz-cyan': '#3FECFF',   // Gradient Mid
                'plaiz-ice': '#F6FCFF',    // Gradient End
                'plaiz-void': '#FAF9F6',   // Soft Off-White Background (Legacy)
                'plaiz-steel': '#F1F5F9',  // Modern Neutral Surface
                'plaiz-coral': '#FF4E7A',  // Accent (Neon Coral)
                'plaiz-charcoal': '#0F172A', // Deep Navy/Charcoal (Higher Contrast)
                'plaiz-deep': '#020617',    // Premium Dark Base

                // New Theme Engine (Light/Dark Symmetric)
                'studio-light': '#F2F2F5', // Soft Light Background
                'studio-dark': '#0F0F0F',  // Pure Dark Background
                'studio-card-light': '#FFFFFF',
                'studio-card-dark': '#1A1A1A',
                'studio-text-light': '#0F172A',
                'studio-text-dark': '#EDEDED',

                // Semantic Mappings
                surface: 'var(--bg-surface)',
                'surface-hover': 'var(--bg-surface-hover)',
                foreground: 'var(--text-primary)',
                muted: 'var(--text-muted)',
                'muted-foreground': 'var(--text-muted)',
                accent: 'var(--bg-accent)',
                border: 'var(--border-color)',
                background: 'var(--bg-primary)',
                'background-hover': 'var(--bg-background-hover)',
                'primary-foreground': 'var(--text-primary-foreground)',
                primary: '#007BFF',
                secondary: '#3FECFF',
            },
            fontFamily: {
                outfit: ['Outfit', 'sans-serif'],
            },
            borderRadius: {
                'sm': '8px',
                'md': '12px',
                'lg': '16px',
                'xl': '20px',
                '2xl': '24px',
                '3xl': '32px',
                '4xl': '40px',
                'pill': '9999px',
            },
            boxShadow: {
                'soft': '0 4px 12px rgba(0, 0, 0, 0.05)', // Subtle Airbnb-style shadow
                'card': '0 8px 24px rgba(0, 0, 0, 0.08)',
                'glow': '0 0 20px -5px rgba(0, 123, 255, 0.2)',
            },
            keyframes: {
                'gradient-x': {
                    '0%, 100%': { 'background-size': '200% 200%', 'background-position': 'left center' },
                    '50%': { 'background-size': '200% 200%', 'background-position': 'right center' },
                },
                'bubblepop': {
                    '0%': { transform: 'scale(0.95)', opacity: '0' },
                    '100%': { transform: 'scale(1)', opacity: '1' },
                }
            },
            animation: {
                'gradient-x': 'gradient-x 5s ease infinite',
                'bubblepop': 'bubblepop 0.25s ease-out',
            }
        },
    },
    plugins: [],
}
