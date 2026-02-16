-- Portfolio Stock Image Cleanup
-- Run this script to remove all items using Unsplash or other external stock image links.
-- This ensures only your real studio work is displayed.

DELETE FROM portfolio 
WHERE image_url LIKE '%images.unsplash.com%'
   OR image_url LIKE '%placeholder.com%'
   OR image_url LIKE '%lorempixel.com%';

-- Re-set any null images in services if necessary
-- (Usually handled by UI placeholders)
