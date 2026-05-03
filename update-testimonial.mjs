import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ysloujluvwkvdhtjzotk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlzbG91amx1dndrdmRodGp6b3RrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MjM4NjEsImV4cCI6MjA4ODM5OTg2MX0.XIz4iiYitjynEqtVZkwq5oTKJIK16qqInJGf4Ub0dPo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    console.log("Fetching testimonials...");
    const { data: testimonials, error } = await supabase.from('testimonials').select('*');
    if (error) {
        console.error("Error fetching testimonials:", error);
        return;
    }
    
    // Find the testimonial that mentions packaging design
    const target = testimonials.find(t => t.review && t.review.toLowerCase().includes('packaging design'));
    
    if (target) {
        console.log(`Found testimonial by ${target.name}. Updating...`);
        
        const newReview = "Plaiz Studio completely transformed my YouTube thumbnails. The designs are bold and eye-catching, and my click-through rate has doubled since we started working together! Highly recommended.";
        const newRole = "Content Creator";
        
        const { error: updateError } = await supabase.from('testimonials').update({ 
            review: newReview,
            role: newRole
        }).eq('id', target.id);
        
        if (updateError) {
            console.error(`Error updating testimonial:`, updateError);
        } else {
            console.log(`Successfully updated the testimonial!`);
        }
    } else {
        console.log("Could not find the packaging testimonial in the database. Are you sure it's not already updated?");
    }
}

main();
