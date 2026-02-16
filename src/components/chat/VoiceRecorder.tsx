import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Send, Trash2, AlertCircle, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
    onSend: (audioFile: File) => void;
    onCancel: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({ onSend, onCancel }) => {
    const [isRecording, setIsRecording] = useState(false);
    const [duration, setDuration] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);
    const [audioLevel, setAudioLevel] = useState(0);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const timerRef = useRef<any>(null);
    const chunksRef = useRef<Blob[]>([]);
    const animationFrameRef = useRef<number | undefined>(undefined);

    const MAX_DURATION = 120; // 2 minutes max

    useEffect(() => {
        startRecording();
        return () => {
            cleanup();
        };
    }, []);

    const cleanup = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) { }
        }
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
        }
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            audioContextRef.current.close();
        }
        if (timerRef.current) {
            clearInterval(timerRef.current);
        }
        if (animationFrameRef.current !== undefined) {
            cancelAnimationFrame(animationFrameRef.current);
        }
    };

    const getSupportedMimeType = () => {
        // iOS Safari prefers mp4, Android Chrome prefers webm
        const types = [
            'audio/mp4',
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/wav'
        ];
        for (const type of types) {
            if (MediaRecorder.isTypeSupported(type)) {
                console.log('Using MIME type:', type);
                return type;
            }
        }
        return '';
    };

    const visualizeAudio = (stream: MediaStream) => {
        try {
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const analyser = audioContext.createAnalyser();
            const source = audioContext.createMediaStreamSource(stream);

            analyser.fftSize = 256;
            source.connect(analyser);

            audioContextRef.current = audioContext;
            analyserRef.current = analyser;

            const dataArray = new Uint8Array(analyser.frequencyBinCount);

            const updateLevel = () => {
                if (analyserRef.current) {
                    analyserRef.current.getByteFrequencyData(dataArray);
                    const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
                    setAudioLevel(Math.min(100, (average / 255) * 100));
                    animationFrameRef.current = requestAnimationFrame(updateLevel);
                }
            };
            updateLevel();
        } catch (err) {
            console.warn('Audio visualization not supported:', err);
        }
    };

    const startRecording = async () => {
        try {
            setIsInitializing(true);
            setError(null);

            // Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 44100
                }
            });

            const mimeType = getSupportedMimeType();
            if (!mimeType) {
                throw new Error('No supported audio format found on this device');
            }

            mediaRecorderRef.current = new MediaRecorder(stream, {
                mimeType,
                audioBitsPerSecond: 128000
            });

            chunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorderRef.current.onerror = (e) => {
                console.error('MediaRecorder error:', e);
                setError('Recording failed. Please try again.');
            };

            mediaRecorderRef.current.start(100); // Collect data every 100ms
            setIsRecording(true);
            setIsInitializing(false);

            // Start audio visualization
            visualizeAudio(stream);

            // Start timer
            timerRef.current = setInterval(() => {
                setDuration(prev => {
                    const newDuration = prev + 1;
                    if (newDuration >= MAX_DURATION) {
                        handleSend(); // Auto-send at max duration
                    }
                    return newDuration;
                });
            }, 1000);

        } catch (err: any) {
            console.error('Error accessing microphone:', err);
            setIsInitializing(false);

            // User-friendly error messages
            if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
                setError('Microphone access denied. Please enable microphone permissions in your browser settings.');
            } else if (err.name === 'NotFoundError') {
                setError('No microphone found. Please connect a microphone and try again.');
            } else {
                setError(err.message || 'Failed to start recording. Please try again.');
            }

            // Auto-close after error
            setTimeout(() => onCancel(), 3000);
        }
    };

    const handleSend = () => {
        if (!mediaRecorderRef.current || chunksRef.current.length === 0) {
            onCancel();
            return;
        }

        mediaRecorderRef.current.onstop = () => {
            const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
            const blob = new Blob(chunksRef.current, { type: mimeType });

            // Validate file size (max 5MB)
            if (blob.size > 5 * 1024 * 1024) {
                setError('Recording too large. Please keep it under 2 minutes.');
                setTimeout(() => onCancel(), 2000);
                return;
            }

            // Map MIME to correct extension for cross-platform compatibility
            // iOS usually uses audio/mp4, Android/Desktop usually webm
            let ext = 'webm';
            if (mimeType.includes('mp4')) ext = 'm4a';
            else if (mimeType.includes('ogg')) ext = 'ogg';
            else if (mimeType.includes('wav')) ext = 'wav';

            const file = new File([blob], `voice-note-${Date.now()}.${ext}`, { type: mimeType });
            onSend(file);
        };

        if (mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        cleanup();
        setIsRecording(false);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (error) {
        return (
            <div className="flex items-center gap-4 w-full bg-red-500/10 border border-red-500/20 rounded-2xl p-4 animate-fade-in">
                <AlertCircle size={20} className="text-red-400 shrink-0" />
                <p className="text-sm text-red-400 font-medium flex-1">{error}</p>
            </div>
        );
    }

    if (isInitializing) {
        return (
            <div className="flex items-center gap-4 w-full bg-plaiz-blue/10 rounded-2xl p-4 animate-fade-in">
                <Loader2 size={20} className="text-plaiz-blue animate-spin" />
                <span className="text-sm text-white/60 font-medium">Initializing microphone...</span>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-4 w-full bg-plaiz-blue/10 rounded-2xl p-3 animate-fade-in">
            <div className="flex-1 flex items-center gap-3 px-2">
                {/* Pulsing recording indicator */}
                <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-red-500 animate-ping opacity-75" />
                </div>

                {/* Timer */}
                <span className="text-base font-mono font-bold text-white min-w-[60px]">
                    {formatTime(duration)}
                </span>

                {/* Waveform visualization */}
                <div className="flex-1 flex items-center gap-1 h-8 max-w-[120px]">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-plaiz-cyan rounded-full transition-all duration-100"
                            style={{
                                height: `${Math.max(4, (audioLevel / 100) * 32 * (0.5 + Math.random() * 0.5))}px`,
                                opacity: 0.3 + (audioLevel / 100) * 0.7
                            }}
                        />
                    ))}
                </div>

                {/* Duration warning */}
                {duration > 90 && (
                    <span className="text-xs text-orange-400 font-bold animate-pulse">
                        {MAX_DURATION - duration}s
                    </span>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={onCancel}
                    className="min-w-[44px] min-h-[44px] p-2 text-white/40 hover:text-red-400 transition-colors rounded-xl hover:bg-red-500/10"
                    style={{ touchAction: 'manipulation' }}
                >
                    <Trash2 size={20} />
                </button>
                <button
                    onClick={handleSend}
                    className="min-w-[44px] min-h-[44px] w-11 h-11 rounded-xl bg-plaiz-cyan text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    style={{ touchAction: 'manipulation' }}
                >
                    <Send size={18} />
                </button>
            </div>
        </div>
    );
};

export default VoiceRecorder;
