import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ZoomIn, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

const PortfolioGrid = () => {
    const [activeFilter, setActiveFilter] = useState('All');
    const [selectedImage, setSelectedImage] = useState(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            const { data, error } = await supabase
                .from('portfolio')
                .select('*')
                .order('id', { ascending: false });

            if (error) {
                console.error('Supabase error:', error);
            } else {
                setProjects(data || []);
            }
            setLoading(false);
        };

        fetchProjects();
    }, []);

    useEffect(() => {
        if (selectedImage) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [selectedImage]);

    const filters = ['All', 'Logos', 'Branding', 'Flyers', 'Packaging', 'Social Media Post', 'Cards', 'Mockups'];

    const filteredProjects = activeFilter === 'All'
        ? projects
        : projects.filter(p => p.category === activeFilter);

    return (
        <section className="py-24" id="portfolio">
            <div className="max-w-7xl mx-auto px-6 md:px-12">

                {/* Header & Filters */}
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-8">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Our Work</h2>
                        <p className="text-slate-400 text-lg max-w-lg">Logos, flyers, packaging, social media graphics, and more — designed for brands that want to stand out.</p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {filters.map(filter => (
                            <button
                                key={filter}
                                onClick={() => setActiveFilter(filter)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${activeFilter === filter
                                    ? 'bg-plaiz text-white shadow-lg shadow-plaiz/30'
                                    : 'bg-[#0F172A]/80 border border-white/5 text-slate-300 hover:text-white hover:bg-[#0F172A] hover:border-white/20'
                                    }`}
                            >
                                {filter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Grid */}
                <motion.div
                    layout
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
                >
                    <AnimatePresence>
                        {filteredProjects.map((project) => (
                            <motion.div
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.3 }}
                                key={project.id}
                                className="group relative rounded-xl overflow-hidden cursor-pointer bg-[#0F172A] border border-white/5 hover:border-white/20 hover:-translate-y-2 hover:shadow-2xl hover:shadow-black/50 transition-all duration-300"
                                onClick={() => {
                                    setSelectedImage(project);
                                    setCurrentImageIndex(0);
                                }}
                            >
                                <div className="w-full overflow-hidden">
                                    <img
                                        src={project.image}
                                        alt={project.title}
                                        className="w-full h-auto object-contain block transition-transform duration-700 group-hover:scale-105"
                                    />
                                </div>
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                                <div className="absolute bottom-0 left-0 w-full p-8 translate-y-8 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-300">
                                    <span className="text-plaiz text-sm font-bold uppercase tracking-wider mb-2 block">{project.category}</span>
                                    <h3 className="text-2xl font-bold text-white mb-4">{project.title}</h3>
                                    <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
                                        <ZoomIn size={18} />
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>

                {/* Lightbox Modal */}
                <AnimatePresence>
                    {selectedImage && (() => {
                        // Normalize image list: use images array if available, else fall back to [image]
                        const imageList = (selectedImage.images && selectedImage.images.length > 0)
                            ? selectedImage.images
                            : (selectedImage.image ? [selectedImage.image] : []);
                        const hasMultiple = imageList.length > 1;

                        return (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/95 backdrop-blur-2xl p-4 md:p-12"
                                onClick={() => setSelectedImage(null)}
                            >
                                <button
                                    className="fixed z-[9999] top-6 right-6 md:top-10 md:right-10 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 p-3 rounded-full transition-colors cursor-pointer shadow-xl backdrop-blur-md"
                                    onClick={() => setSelectedImage(null)}
                                >
                                    <X size={24} />
                                </button>

                                <motion.div
                                    initial={{ scale: 0.9, y: 20 }}
                                    animate={{ scale: 1, y: 0 }}
                                    exit={{ scale: 0.9, y: 20 }}
                                    className="relative max-w-6xl w-full max-h-[90vh] overflow-y-auto flex flex-col items-center bg-[#0F172A]/50 p-6 md:p-10 rounded-2xl border border-white/10 custom-scrollbar"
                                    onClick={e => e.stopPropagation()}
                                >
                                    <div className="relative w-full mb-8">
                                        {hasMultiple ? (
                                            <div className="flex items-center gap-4">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentImageIndex((prev) => prev === 0 ? imageList.length - 1 : prev - 1);
                                                    }}
                                                    className="flex-shrink-0 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-md transition-all flex items-center shadow-lg"
                                                >
                                                    <ChevronLeft size={24} />
                                                </button>

                                                <img
                                                    key={currentImageIndex}
                                                    src={imageList[currentImageIndex]}
                                                    alt={`${selectedImage.title} - image ${currentImageIndex + 1}`}
                                                    className="flex-1 min-w-0 max-h-[60vh] w-full object-contain rounded-xl shadow-2xl"
                                                />

                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setCurrentImageIndex((prev) => prev === imageList.length - 1 ? 0 : prev + 1);
                                                    }}
                                                    className="flex-shrink-0 bg-black/50 hover:bg-black p-3 rounded-full text-white backdrop-blur-md transition-all flex items-center shadow-lg"
                                                >
                                                    <ChevronRight size={24} />
                                                </button>
                                            </div>
                                        ) : (
                                            <img
                                                src={imageList[0]}
                                                alt={selectedImage.title}
                                                className="max-h-[60vh] w-full object-contain rounded-xl shadow-2xl mx-auto block"
                                            />
                                        )}
                                    </div>

                                    {hasMultiple && (
                                        <div className="flex gap-2 mb-8">
                                            {imageList.map((_, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={(e) => { e.stopPropagation(); setCurrentImageIndex(idx); }}
                                                    className={`h-2 rounded-full transition-all ${currentImageIndex === idx ? 'bg-plaiz w-6' : 'w-2 bg-white/30 hover:bg-white/60'}`}
                                                />
                                            ))}
                                        </div>
                                    )}

                                    <div className="text-center">
                                        <h3 className="text-3xl font-bold text-white mb-2">{selectedImage.title}</h3>
                                        <p className="text-plaiz font-medium uppercase tracking-widest mb-4">{selectedImage.category}</p>
                                        <p className="text-slate-300 max-w-2xl mx-auto text-lg leading-relaxed">{selectedImage.description}</p>
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })()}
                </AnimatePresence>

            </div>
        </section>
    );
};

export default PortfolioGrid;
