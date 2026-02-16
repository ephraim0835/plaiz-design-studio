import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export const useWorkerStats = () => {
    const { user } = useAuth()
    const [stats, setStats] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        if (!user) return

        const fetchStats = async () => {
            try {
                const { data, error } = await supabase
                    .from('worker_stats')
                    .select('*')
                    .eq('worker_id', user.id)
                    .single()

                if (error && error.code !== 'PGRST116') throw error // PGRST116 is "no rows found", which is fine, we just return null/default

                setStats(data || {
                    average_rating: 5.0,
                    active_projects: 0,
                    completed_projects: 0,
                    total_projects: 0,
                    is_probation: true
                })
            } catch (err) {
                console.error('Error fetching worker stats:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [user])

    return { stats, loading, error }
}
