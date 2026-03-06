import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY; // Use Service Role Key if RLS is on

if (!supabaseUrl || !supabaseKey || supabaseUrl.includes('your_supabase')) {
    console.error('❌ Error: Supabase credentials missing or default in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
    console.log('🚀 Starting migration to Supabase...');

    // 1. Migrate Portfolio
    const portfolioPath = path.join(process.cwd(), 'src', 'data', 'portfolio.json');
    if (fs.existsSync(portfolioPath)) {
        const portfolioData = JSON.parse(fs.readFileSync(portfolioPath, 'utf8'));
        console.log(`📦 Found ${portfolioData.length} portfolio items. Migrating...`);

        const { error } = await supabase.from('portfolio').upsert(portfolioData);
        if (error) console.error('❌ Portfolio Error:', error.message);
        else console.log('✅ Portfolio migrated successfully!');
    }

    // 2. Migrate Testimonials
    const testimonialsPath = path.join(process.cwd(), 'src', 'data', 'testimonials.json');
    // Note: If you don't have a separate testimonials.json, we might need to skip
    if (fs.existsSync(testimonialsPath)) {
        const testimonialsData = JSON.parse(fs.readFileSync(testimonialsPath, 'utf8'));
        console.log(`📦 Found ${testimonialsData.length} testimonials. Migrating...`);

        const { error } = await supabase.from('testimonials').upsert(testimonialsData);
        if (error) console.error('❌ Testimonials Error:', error.message);
        else console.log('✅ Testimonials migrated successfully!');
    }

    console.log('🏁 Migration finished!');
}

migrate();
