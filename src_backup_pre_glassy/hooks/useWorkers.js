import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

export const useWorkers = () => {
    const [workers, setWorkers] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const fetchWorkers = async () => {
            try {
                // Fetch profiles with role graphic_designer or web_designer
                // And join with worker_stats
                const { data, error: fetchError } = await supabase
                    .from('profiles')
                    .select('*, worker_stats(*)')
                    .in('role', ['graphic_designer', 'web_designer'])

                if (fetchError) throw fetchError
                setWorkers(data || [])
            } catch (err) {
                console.error('Error fetching workers:', err)
                setError(err.message)
            } finally {
                setLoading(false)
            }
        }

        fetchWorkers()
    }, [])

    return { workers, loading, error }
}
