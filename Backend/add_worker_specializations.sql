-- Add specialization field to profiles table
-- This allows workers to have specialized roles while maintaining the base worker role

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS specialization TEXT;

-- Add constraint to validate specialization values
-- NOTE: To add more specializations in the future, simply add them to this list
ALTER TABLE profiles 
ADD CONSTRAINT valid_specialization 
CHECK (
    specialization IS NULL OR 
    specialization IN (
        'graphic_designer',
        'web_designer',
        'print_specialist'
        -- Add more specializations here as needed
        -- Example: 'video_editor', 'ui_designer', 'motion_designer', etc.
    )
);

-- Create index for faster specialization queries
CREATE INDEX IF NOT EXISTS idx_profiles_specialization ON profiles(specialization);

-- Add comment for documentation
COMMENT ON COLUMN profiles.specialization IS 'Worker specialization type. Only applicable when role = worker. Easily extensible for future worker types.';

-- Example query to get all workers by specialization:
-- SELECT * FROM profiles WHERE role = 'worker' AND specialization = 'graphic_designer';
