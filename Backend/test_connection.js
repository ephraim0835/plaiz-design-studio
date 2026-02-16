import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Read values manually from .env
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const envPath = path.resolve(__dirname, '../.env')

try {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    const env = {}
    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=')
        if (key && value) {
            env[key.trim()] = value.trim()
        }
    })

    const supabaseUrl = env['VITE_SUPABASE_URL']
    const supabaseKey = env['VITE_SUPABASE_ANON_KEY']

    console.log('Testing connection to:', supabaseUrl)

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing credentials in .env file')
        process.exit(1)
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    const { data, error } = await supabase.from('portfolio_items').select('count', { count: 'exact', head: true })

    if (error) {
        console.error('Connection Failed:', error.message)
        // Check for specific error hints
        if (error.code === 'PGRST301') {
            console.error('Hint: JWT might be expired or RLS policies are blocking access.')
        }
    } else {
        console.log('Connection Successful! Supabase is reachable.')
    }

} catch (err) {
    console.error('Script Error:', err.message)
}
