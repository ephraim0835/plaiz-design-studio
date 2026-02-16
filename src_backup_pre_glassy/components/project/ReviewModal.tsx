import React, { useState } from 'react';
import { Star, X } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    projectId: string;
    workerId: string;
    clientId: string;
    onReviewSubmitted: () => void;
}

const ReviewModal: React.FC<ReviewModalProps> = ({
    isOpen, onClose, projectId, workerId, clientId, onReviewSubmitted
}) => {
    const [rating, setRating] = useState(0);
    const [hoverRating, setHoverRating] = useState(0);
    const [comment, setComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) return;

        setIsSubmitting(true);
        try {
            const { error } = await supabase.from('reviews').insert({
                project_id: projectId,
                worker_id: workerId,
                client_id: clientId,
                rating,
                comment
            });

            if (error) throw error;

            // Update project status to completed if not already (logic might be handled elsewhere/automatically, but good safety)
            await supabase.from('projects').update({ status: 'completed' }).eq('id', projectId);

            onReviewSubmitted();
            onClose();
        } catch (error) {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
            <div className="relative w-full max-w-md bg-[#0f111a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 text-white/40 hover:text-white hover:bg-white/10 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                <form onSubmit={handleSubmit} className="p-8">
                    <div className="text-center mb-8">
                        <h3 className="text-2xl font-black text-white mb-2">Rate your experience</h3>
                        <p className="text-white/60 text-sm">How was working with this designer?</p>
                    </div>

                    {/* Star Rating */}
                    <div className="flex justify-center gap-2 mb-8">
                        {[1, 2, 3, 4, 5].map((star) => (
                            <button
                                key={star}
                                type="button"
                                onMouseEnter={() => setHoverRating(star)}
                                onMouseLeave={() => setHoverRating(0)}
                                onClick={() => setRating(star)}
                                className="transition-transform hover:scale-110 focus:outline-none"
                            >
                                <Star
                                    size={32}
                                    className={`transition-colors ${star <= (hoverRating || rating)
                                            ? 'fill-plaiz-cyan text-plaiz-cyan'
                                            : 'fill-transparent text-white/20'
                                        }`}
                                />
                            </button>
                        ))}
                    </div>

                    {/* Comment Area */}
                    <div className="mb-8">
                        <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                            Feedback (Optional)
                        </label>
                        <textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share details about your experience..."
                            className="w-full h-32 bg-white/5 border border-white/10 rounded-xl p-4 text-white placeholder-white/20 focus:outline-none focus:border-plaiz-cyan/50 focus:bg-white/10 transition-all resize-none"
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={rating === 0 || isSubmitting}
                        className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-sm transition-all
                            ${rating > 0
                                ? 'bg-plaiz-cyan text-white hover:shadow-[0_0_30px_rgba(34,211,238,0.3)]'
                                : 'bg-white/5 text-white/20 cursor-not-allowed'}`}
                    >
                        {isSubmitting ? 'Submitting...' : 'Submit Review'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
