-- Add category column to projects table
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'General';

-- Optional: Update existing records if needed (heuristic based on name)
UPDATE projects 
SET category = 'Web Designers' 
WHERE name ILIKE '%Web%' OR name ILIKE '%Site%';

UPDATE projects 
SET category = 'Graphic Designers' 
WHERE name ILIKE '%Logo%' OR name ILIKE '%Brand%' OR name ILIKE '%Graphic%';
