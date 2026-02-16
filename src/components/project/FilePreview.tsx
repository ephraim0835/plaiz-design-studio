
import React from 'react';
import { Download, Lock, FileText, Image as ImageIcon } from 'lucide-react';

interface FilePreviewProps {
    file: {
        id: string;
        file_name: string;
        file_url: string;
        file_type: string;
    };
    isLocked: boolean;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file, isLocked }) => {
    const isImage = file.file_name.match(/\.(jpg|jpeg|png|gif|webp)$/i);

    const handleDownload = () => {
        if (isLocked) {
            alert('Please complete the final payment to unlock and download this file.');
            return;
        }
        window.open(file.file_url, '_blank');
    };

    return (
        <div className="group relative bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-2xl overflow-hidden transition-all hover:border-plaiz-blue/30">
            {/* Preview Area */}
            <div className="aspect-video flex items-center justify-center relative bg-black/20">
                {isImage ? (
                    <div className="relative w-full h-full">
                        <img
                            src={file.file_url}
                            alt={file.file_name}
                            className={`w-full h-full object-cover transition-all ${isLocked ? 'blur-[2px] brightness-75' : ''}`}
                        />
                        {isLocked && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
                                <div className="absolute inset-0 flex items-center justify-center rotate-[-30deg] opacity-20 whitespace-nowrap select-none">
                                    <span className="text-4xl lg:text-6xl font-black text-white uppercase tracking-[1em]">
                                        PLAIZ DESIGN • PROPERTY OF PLAIZ • PLAIZ DESIGN • PROPERTY OF PLAIZ
                                    </span>
                                </div>
                                <Lock className="text-white/50" size={48} />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-[var(--text-muted)]">
                        <FileText size={48} />
                        <span className="text-[10px] font-black uppercase tracking-widest">{file.file_name.split('.').pop()}</span>
                    </div>
                )}
            </div>

            {/* Footer / Actions */}
            <div className="p-4 flex items-center justify-between">
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white truncate">{file.file_name}</p>
                    <p className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-widest">
                        {isLocked ? 'Preview Only' : 'Ready to Download'}
                    </p>
                </div>
                <button
                    onClick={handleDownload}
                    className={`p-3 rounded-xl transition-all ${isLocked
                            ? 'bg-[var(--border-color)] text-[var(--text-muted)] cursor-not-allowed'
                            : 'bg-plaiz-blue text-white hover:scale-110 active:scale-95 shadow-lg'
                        }`}
                >
                    {isLocked ? <Lock size={18} /> : <Download size={18} />}
                </button>
            </div>
        </div>
    );
};

export default FilePreview;
