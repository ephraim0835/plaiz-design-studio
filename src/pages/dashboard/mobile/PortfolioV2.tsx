import React, { useState, useEffect } from 'react';
import { Search, Zap } from 'lucide-react';
import DashboardLayout from '../../../components/dashboard/DashboardLayout';
import { supabase } from '../../../lib/supabaseClient';
import PortfolioGrid from '../../../components/portfolio/PortfolioGrid';

const categories = ['All Work', 'Graphic', 'Web', 'Print'];

const PortfolioV2: React.FC = () => {
    const [selectedCategory, setSelectedCategory] = useState('All Work');
    const [projects, setProjects] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();

        // Subscribe to real-time changes
        const channel = supabase
            .channel('portfolio-v2-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'portfolio' }, () => {
                fetchProjects();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('portfolio')
                .select(`
                    *,
                    profiles:worker_id (
                        full_name
                    )
                `)
                .eq('is_approved', true)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setProjects(data || []);
        } catch (error) {
            console.error('Error fetching projects:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredProjects = selectedCategory === 'All Work'
        ? projects
        : projects.filter(project => {
            const cat = project.service_type === 'web' ? 'Web' :
                project.service_type === 'printing' ? 'Print' :
                    project.service_type === 'graphics' ? 'Graphic' : 'Graphic';
            return cat === selectedCategory;
        });

    return (
        <DashboardLayout title="Studio Work">
            <main className="max-w-7xl mx-auto px-6 py-10 lg:py-16 relative z-10">
                <div className="mb-12">
                    <div className="flex items-center gap-2 mb-4">
                        <Zap size={14} className="text-plaiz-blue fill-plaiz-blue" />
                        <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Our Portfolio</span>
                    </div>
                    <h1 className="text-3xl md:text-5xl font-extrabold text-foreground mb-4 tracking-tight">Studio Work</h1>
                    <p className="text-muted text-lg font-medium max-w-xl">A curated selection of designs delivered by our verified creatives.</p>
                </div>

                {/* Filter / Search Bar */}
                <div className="flex flex-col lg:flex-row gap-4 mb-12 items-start transition-all">
                    <div className="w-full lg:flex-1 bg-surface border border-border rounded-xl flex items-center px-4 py-3 gap-3 focus-within:border-plaiz-blue focus-within:ring-2 focus-within:ring-plaiz-blue/5 transition-all">
                        <Search size={18} className="text-muted/40" />
                        <input
                            type="text"
                            placeholder="Search by category..."
                            className="bg-transparent border-none p-0 focus:ring-0 text-foreground text-sm font-medium w-full placeholder:text-muted/40"
                        />
                    </div>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1 w-full lg:w-auto">
                        {categories.map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setSelectedCategory(tab)}
                                className={`px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-widest border transition-all whitespace-nowrap
                                    ${tab === selectedCategory
                                        ? 'bg-plaiz-blue text-white border-plaiz-blue shadow-md shadow-plaiz-blue/20'
                                        : 'bg-surface text-muted border-border hover:border-muted hover:text-foreground'}`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <PortfolioGrid
                        items={filteredProjects}
                        loading={loading}
                        showWorker={true}
                    />
                </div>

                <div className="mt-20 text-center pb-16">
                    <p className="text-muted text-xs font-bold uppercase tracking-widest opacity-40">
                        Showing {filteredProjects.length} projects
                    </p>
                </div>
            </main>
        </DashboardLayout>
    );
};

export default PortfolioV2;
