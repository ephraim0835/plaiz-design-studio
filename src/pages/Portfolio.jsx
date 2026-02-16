import React, { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { supabase } from '../lib/supabaseClient'
import PortfolioGrid from '../components/portfolio/PortfolioGrid'

const categories = ['All Projects', 'Graphic Design', 'Web Design', 'Printing']

const Portfolio = () => {
    const [selectedCategory, setSelectedCategory] = useState('All Projects')
    const [projects, setProjects] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchProjects()
    }, [])

    const fetchProjects = async () => {
        try {
            setLoading(true)
            const { data, error } = await supabase
                .from('portfolio')
                .select(`
                    *,
                    profiles:worker_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('is_approved', true)
                .order('created_at', { ascending: false }) // IDENTICAL SORTING AS GALLERY

            if (error) throw error
            setProjects(data || [])
        } catch (error) {
            console.error('Error fetching projects:', error)
        } finally {
            setLoading(false)
        }
    }

    const filteredProjects = selectedCategory === 'All Projects'
        ? projects
        : projects.filter(project => {
            const cat = project.service_type === 'web' ? 'Web Design' :
                project.service_type === 'printing' ? 'Printing' :
                    project.service_type === 'graphics' ? 'Graphic Design' : 'Graphic Design';
            return cat === selectedCategory;
        })

    return (
        <div className="min-h-screen bg-transparent relative overflow-x-hidden">
            <Navbar />

            <div className="container mx-auto px-6 pt-80 pb-20 relative z-10">
                {/* Header */}
                <div className="max-w-3xl mx-auto text-center mb-24 animate-fade-in mt-12">
                    <h2 className="text-5xl md:text-8xl font-black mb-8 tracking-tighter text-foreground">
                        Our <span className="text-plaiz-blue transition-all duration-500">Portfolio</span>
                    </h2>
                    <p className="text-muted text-lg md:text-xl font-medium leading-relaxed mb-12">
                        Explore our world-class designs and digital experiences crafted with precision and passion.
                    </p>

                    {/* Filter Buttons */}
                    <div className="flex flex-wrap justify-center gap-3">
                        {categories.map(category => (
                            <button
                                key={category}
                                onClick={() => setSelectedCategory(category)}
                                className={`px-8 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${selectedCategory === category
                                    ? 'bg-plaiz-blue text-white shadow-xl shadow-plaiz-blue/20 scale-105'
                                    : 'bg-surface border border-border text-muted hover:border-plaiz-blue/30'
                                    }`}
                            >
                                {category}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Loading State & Grid */}
                <div className="animate-fade-in-up">
                    <PortfolioGrid
                        items={filteredProjects}
                        loading={loading}
                        showWorker={true}
                    />
                </div>
            </div>

            <Footer />
        </div>
    )
}

export default Portfolio
