import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysloujluvwkvdhtjzotk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbG91amx1dndrdmRodGp6b3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjM4NjEsImV4cCI6MjA4ODM5OTg2MX0.XIz4iiYitjynEqtVZkwq5oTKJIK16qqInJGf4Ub0dPo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching projects...");
    const { data: projects, error } = await supabase.from('portfolio').select('*');
    if (error) {
        console.error("Error fetching:", error);
        return;
    }
    
    console.log(`Found ${projects.length} projects.`);
    
    const descriptions = [
        "Designed for high CTR and engagement. Target: Entertainment and lifestyle audience.",
        "High-contrast visual hook. Target: Finance & Crypto viewers.",
        "Bold typography and clear subject focus. Target: Educational/Tutorial content.",
        "Bright, attention-grabbing composition. Target: Tech reviews & unboxings.",
        "Dramatic lighting and expressive faces. Target: Gaming and streaming highlights."
    ];
    
    let thumbnails = projects.filter(p => p.category === 'YouTube Thumbnails' || p.category?.toLowerCase().includes('thumbnail'));
    
    // If no thumbnails found, maybe convert some recent projects to thumbnails for demonstration?
    // Let's first log what we found.
    console.log(`Found ${thumbnails.length} thumbnail projects.`);
    
    if (thumbnails.length === 0) {
        console.log("No thumbnail projects found. Will try to update the first 4 projects to be 'YouTube Thumbnails' with descriptions for demonstration.");
        thumbnails = projects.slice(0, 4);
        for (let i = 0; i < thumbnails.length; i++) {
            thumbnails[i].category = 'YouTube Thumbnails';
        }
    }
    
    for (let i = 0; i < Math.min(thumbnails.length, 5); i++) {
        const p = thumbnails[i];
        p.description = descriptions[i % descriptions.length];
        
        console.log(`Updating project ID ${p.id} - ${p.title} with description...`);
        const { error: updateError } = await supabase.from('portfolio').update({ 
            category: 'YouTube Thumbnails', 
            description: p.description 
        }).eq('id', p.id);
        
        if (updateError) {
            console.error(`Error updating project ${p.id}:`, updateError);
        } else {
            console.log(`Success updating project ${p.id}.`);
        }
    }
    
    console.log("Done.");
}

main();
