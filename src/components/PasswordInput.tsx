import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';

interface PasswordInputProps {
    label?: string;
    placeholder?: string;
    value: string;
    onChange: (value: string) => void;
    showStrength?: boolean;
    required?: boolean;
    className?: string;
}

const PasswordInput: React.FC<PasswordInputProps> = ({
    label,
    placeholder = "••••••••",
    value,
    onChange,
    showStrength = false,
    required = false,
    className = ""
}) => {
    const [showPassword, setShowPassword] = useState(false);
    const [strength, setStrength] = useState(0);
    const [label_text, setLabelText] = useState('Empty');
    const [color, setColor] = useState('bg-muted/20');

    const checkStrength = (pwd: string) => {
        let score = 0;
        if (!pwd) return { score: 0, text: 'Empty', color: 'bg-muted/20' };

        if (pwd.length > 6) score++;
        if (pwd.length > 10) score++;
        if (/[A-Z]/.test(pwd)) score++;
        if (/[0-9]/.test(pwd)) score++;
        if (/[^A-Za-z0-9]/.test(pwd)) score++;

        switch (score) {
            case 0:
            case 1:
                return { score: 20, text: 'Very Weak', color: 'bg-red-500' };
            case 2:
                return { score: 40, text: 'Weak', color: 'bg-orange-500' };
            case 3:
                return { score: 60, text: 'Medium', color: 'bg-yellow-500' };
            case 4:
                return { score: 80, text: 'Strong', color: 'bg-emerald-500' };
            case 5:
                return { score: 100, text: 'Very Strong', color: 'bg-plaiz-blue' };
            default:
                return { score: 0, text: 'Empty', color: 'bg-muted/20' };
        }
    };

    useEffect(() => {
        const result = checkStrength(value);
        setStrength(result.score);
        setLabelText(result.text);
        setColor(result.color);
    }, [value]);

    return (
        <div className={`space-y-2 ${className}`}>
            {label && (
                <label className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-[0.2em] ml-1">
                    {label}
                </label>
            )}
            <div className="relative group">
                <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    required={required}
                    className="w-full h-16 px-6 pr-14 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl text-[var(--text-primary)] font-bold focus:border-plaiz-blue transition-all text-sm placeholder:text-[var(--text-muted)] focus:ring-4 focus:ring-plaiz-blue/5"
                />
                <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 text-muted hover:text-plaiz-blue transition-colors outline-none"
                >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
            </div>

            {showStrength && value.length > 0 && (
                <div className="px-1 space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1.5">
                            {strength < 40 ? <ShieldAlert size={10} className="text-red-500" /> :
                                strength < 80 ? <Shield size={10} className="text-yellow-500" /> :
                                    <ShieldCheck size={10} className="text-emerald-500" />}
                            <span className="text-[9px] font-black uppercase tracking-widest text-muted/60">Security Level</span>
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${color.replace('bg-', 'text-')}`}>{label_text}</span>
                    </div>
                    <div className="h-1 w-full bg-muted/10 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${color} transition-all duration-500 ease-out shadow-[0_0_10px_rgba(0,0,0,0.1)]`}
                            style={{ width: `${strength}%` }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PasswordInput;
