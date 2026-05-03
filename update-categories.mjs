import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysloujluvwkvdhtjzotk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbG91amx1dndrdmRodGp6b3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjM4NjEsImV4cCI6MjA4ODM5OTg2MX0.XIz4iiYitjynEqtVZkwq5oTKJIK16qqInJGf4Ub0dPo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching projects...");
    const { data: projects, error } = await supabase.from('portfolio').select('*');
    if (error) {
        console.error("Error fetching projects:", error);
        return;
    }
    
    // Find all projects in Social Media Post(s)
    const socialMediaPosts = projects.filter(p => 
        p.category === 'Social Media Post' || 
        p.category === 'Social Media Posts'
    );
    
    console.log(`Found ${socialMediaPosts.length} social media posts.`);
    
    // Keywords to identify the 3 posts to keep
    const keepKeywords = [
        'real estate', 'modern home', // post 1
        'skin', 'care', 'retinol', 'aha', // post 2
        'sob', 'engineering', 'cng' // post 3
    ];
    
    let updatedCount = 0;
    
    for (const p of socialMediaPosts) {
        const titleAndDesc = ((p.title || '') + ' ' + (p.description || '')).toLowerCase();
        
        // Check if this project is one of the 3 to keep
        const shouldKeep = keepKeywords.some(kw => titleAndDesc.includes(kw));
        
        if (shouldKeep) {
            console.log(`Keeping "${p.title}" as Social Media Post`);
            // Ensure category is exactly "Social Media Posts"
            if (p.category !== 'Social Media Posts') {
                await supabase.from('portfolio').update({ category: 'Social Media Posts' }).eq('id', p.id);
            }
        } else {
            console.log(`Moving "${p.title}" to YouTube Thumbnails`);
            const { error: updateError } = await supabase.from('portfolio').update({ 
                category: 'YouTube Thumbnails' 
            }).eq('id', p.id);
            
            if (updateError) {
                console.error(`Error updating project ${p.id}:`, updateError);
            } else {
                updatedCount++;
            }
        }
    }
    
    console.log(`Successfully moved ${updatedCount} projects to YouTube Thumbnails.`);
}

main();
