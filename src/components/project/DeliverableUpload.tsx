import React, { useState } from 'react';
import { Upload, X, FileText, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface DeliverableUploadProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    uploaderId: string;
    onUploadComplete: () => void;
}

const DeliverableUpload: React.FC<DeliverableUploadProps> = ({ isOpen, onClose, projectId, uploaderId, onUploadComplete }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!file) return;

        setIsUploading(true);
        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${projectId}/${Date.now()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('project-files')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL (or keep it private if using signed URLs, but simplify for now)
            const { data: { publicUrl } } = supabase.storage
                .from('project-files')
                .getPublicUrl(fileName);

            // 3. Save Record in DB
            const { error: dbError } = await supabase.from('project_files').insert({
                project_id: projectId,
                uploader_id: uploaderId,
                file_name: file.name,
                file_url: publicUrl,
                file_type: 'deliverable'
            });

            if (dbError) throw dbError;

            // 4. Optionally update project status
            // await supabase.from('projects').update({ status: 'review' }).eq('id', projectId);

            onUploadComplete();
            onClose();
            alert('Deliverable uploaded successfully!');
        } catch (error: any) {
            console.error('Upload failed:', error);
            alert('Upload failed: ' + error.message);
        } finally {
            setIsUploading(false);
            setFile(null);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-hidden">
            <div className="relative w-full max-w-md bg-[#0F0F1A] border-t sm:border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl overflow-hidden animate-slide-up sm:animate-zoom-in max-h-[90vh] overflow-y-auto custom-scrollbar">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all z-10"
                >
                    <X size={20} />
                </button>

                <div className="p-6 sm:p-8">
                    <div className="text-center mb-6 sm:mb-8 mt-4 sm:mt-0">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto bg-plaiz-blue/10 rounded-2xl flex items-center justify-center mb-4 text-plaiz-blue">
                            <Upload size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black text-white mb-2">Upload Deliverable</h3>
                        <p className="text-white/60 text-xs sm:text-sm">Share your work with the client</p>
                    </div>

                    <div className="space-y-6">
                        {/* File Input */}
                        <div className="relative">
                            <input
                                type="file"
                                onChange={handleFileChange}
                                className="hidden"
                                id="file-upload"
                            />
                            <label
                                htmlFor="file-upload"
                                className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-all
                                    ${file
                                        ? 'border-plaiz-cyan/50 bg-plaiz-cyan/5'
                                        : 'border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20'}`}
                            >
                                {file ? (
                                    <>
                                        <FileText size={32} className="text-plaiz-cyan mb-2" />
                                        <span className="text-sm font-bold text-white max-w-[200px] truncate">{file.name}</span>
                                        <span className="text-xs text-white/40 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload size={24} className="text-white/40 mb-2" />
                                        <span className="text-sm font-bold text-white/60">Click to select file</span>
                                    </>
                                )}
                            </label>
                        </div>

                        <button
                            onClick={handleUpload}
                            disabled={!file || isUploading}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all flex items-center justify-center gap-2
                                ${file && !isUploading
                                    ? 'bg-plaiz-blue text-white hover:shadow-lg hover:scale-[1.02]'
                                    : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                        >
                            {isUploading ? 'Uploading...' : 'Submit Deliverable'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DeliverableUpload;
