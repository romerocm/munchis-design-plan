-- Add image columns to drops for hero and flavor card photos
ALTER TABLE drops ADD COLUMN hero_image_url text;
ALTER TABLE drops ADD COLUMN flavor_image_url text;
