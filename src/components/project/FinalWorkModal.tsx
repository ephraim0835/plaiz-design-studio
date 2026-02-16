import React, { useState, useRef } from 'react';
import { Upload, File as FileIcon, CheckCircle, ArrowRight, X, AlertCircle } from 'lucide-react';

interface FinalWorkModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (files: File[], heroIndex: number) => Promise<void>;
}

const FinalWorkModal: React.FC<FinalWorkModalProps> = ({ isOpen, onClose, onSubmit }) => {
    const [files, setFiles] = useState<File[]>([]);
    const [heroIndex, setHeroIndex] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (files.length === 0) return;

        setIsSubmitting(true);
        try {
            await onSubmit(files, heroIndex);
            onClose();
            setFiles([]);
            setHeroIndex(0);
        } catch (error) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files);
            setFiles(prev => [...prev, ...newFiles]);
        }
    };

    const removeFile = (index: number) => {
        setFiles(prev => {
            const updated = prev.filter((_, i) => i !== index);
            if (heroIndex === index) setHeroIndex(0);
            else if (heroIndex > index) setHeroIndex(heroIndex - 1);
            return updated;
        });
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-fade-in">
            <div className="w-full max-w-md bg-white dark:bg-[#1A1C20] rounded-[32px] overflow-hidden shadow-2xl animate-zoom-in border border-white/10">

                {/* Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-8 text-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <button
                        onClick={onClose}
                        type="button"
                        className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                    <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white mb-4 mx-auto backdrop-blur-md">
                        <Upload size={32} />
                    </div>
                    <h3 className="text-white font-black uppercase tracking-widest text-sm relative z-10">Project Delivery</h3>
                    <p className="text-white/70 text-xs mt-2 font-medium">Upload files and select your portfolio hero</p>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground ml-1">
                            Project Files ({files.length})
                        </label>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-2 max-h-[160px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/10">
                                {files.map((f, idx) => (
                                    <div key={idx} className={`flex items-center gap-3 p-3 rounded-xl border transition-all group ${heroIndex === idx ? 'bg-plaiz-blue/10 border-plaiz-blue/30' : 'bg-accent/5 dark:bg-white/5 border-accent/10 dark:border-white/5'}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${heroIndex === idx ? 'bg-plaiz-blue text-white' : 'bg-plaiz-blue/10 text-plaiz-blue'}`}>
                                            <FileIcon size={16} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-[11px] font-bold truncate">{f.name}</p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[9px] text-muted-foreground uppercase font-black">{(f.size / (1024 * 1024)).toFixed(2)} MB</p>
                                                {heroIndex === idx && <span className="text-[8px] bg-plaiz-blue text-white px-1.5 py-0.5 rounded-full font-black uppercase">Hero</span>}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            {heroIndex !== idx && (
                                                <button
                                                    type="button"
                                                    onClick={() => setHeroIndex(idx)}
                                                    className="p-1.5 text-muted-foreground hover:text-plaiz-blue transition-colors"
                                                    title="Set as Portfolio Hero"
                                                >
                                                    <CheckCircle size={14} />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => removeFile(idx)}
                                                className="p-1.5 text-muted-foreground hover:text-rose-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="relative border-2 border-dashed border-accent/20 hover:border-plaiz-blue/50 hover:bg-plaiz-blue/5 dark:border-white/10 rounded-[24px] p-6 transition-all cursor-pointer group flex flex-col items-center justify-center gap-2"
                        >
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                multiple
                                className="hidden"
                            />
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-muted-foreground group-hover:text-plaiz-blue group-hover:bg-plaiz-blue/10 transition-colors">
                                <Upload size={20} />
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground group-hover:text-foreground transition-colors">Add more files</p>
                        </div>
                    </div>

                    <div className="p-4 bg-amber-500/5 rounded-2xl border border-amber-500/10 space-y-2">
                        <div className="flex gap-3">
                            <div className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                                <AlertCircle size={12} />
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                                Deliverables will be <b>watermarked</b> for preview. Hero image becomes your portfolio cover.
                            </p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting || files.length === 0}
                        className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm shadow-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:scale-100
                            ${files.length > 0
                                ? 'bg-plaiz-blue hover:bg-blue-600 text-white shadow-blue-500/20 hover:scale-[1.02] active:scale-95'
                                : 'bg-accent/10 text-muted-foreground cursor-not-allowed'}`}
                    >
                        {isSubmitting ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                <span>Send {files.length} Files</span>
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default FinalWorkModal;
