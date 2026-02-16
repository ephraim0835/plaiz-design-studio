-- Create portfolio_items table
CREATE TABLE IF NOT EXISTS portfolio_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    client TEXT,
    date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read portfolio items
CREATE POLICY "Anyone can read portfolio items"
    ON portfolio_items
    FOR SELECT
    USING (true);

-- Policy: Only admins can manage (insert/update/delete) portfolio items
-- Note: checks if the user has the 'admin' role in their user metadata or a custom claims setup
-- For simplicity in this demo, we'll allow authenticated users to read, but strict admin write is good practice.
-- Adjust based on your Auth implementation details for checking 'admin' role.
CREATE POLICY "Admins can insert portfolio items"
    ON portfolio_items
    FOR INSERT
    WITH CHECK (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

CREATE POLICY "Admins can update portfolio items"
    ON portfolio_items
    FOR UPDATE
    USING (auth.jwt() ->> 'role' = 'admin' OR auth.role() = 'service_role');

-- Insert initial sample data (matching previous mock data)
INSERT INTO portfolio_items (title, category, description, image, client, date) VALUES
    ('Quantum Reach', 'Web Design', 'Full platform redesign with modern UI/UX principles and responsive design.', 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&q=80', 'Tech Startup', '2024-11-01'),
    ('Neon Protocol', 'Branding', 'Complete brand identity development including logo, colors, and guidelines.', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800&q=80', 'Creative Agency', '2024-10-01'),
    ('Ice Core', 'Web Design', 'E-commerce platform with seamless checkout and inventory management.', 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=800&q=80', 'Retail Brand', '2024-09-01'),
    ('Cyber Flow', 'Graphic Design', 'Marketing materials and social media assets for product launch.', 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=800&q=80', 'Software Company', '2024-08-01'),
    ('Titan Designs', 'Graphic Design', 'Print and digital design assets for corporate rebranding campaign.', 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?w=800&q=80', 'Enterprise Corp', '2024-07-01'),
    ('Steel Edge', 'Print Design', 'Packaging design and print materials for product line expansion.', 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800&q=80', 'Consumer Goods', '2024-06-01'),
    ('Aurora Brand', 'Branding', 'Brand strategy and visual identity for emerging lifestyle brand.', 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&q=80', 'Lifestyle Brand', '2024-05-01'),
    ('Print Fusion', 'Print Design', 'Magazine layout and editorial design for quarterly publication.', 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&q=80', 'Publishing House', '2024-04-01');
