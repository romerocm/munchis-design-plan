-- Create a storage bucket for drop images
INSERT INTO storage.buckets (id, name, public)
VALUES ('drop-images', 'drop-images', true);

-- Allow public read access to drop images
CREATE POLICY "Public can read drop images"
ON storage.objects FOR SELECT
USING (bucket_id = 'drop-images');

-- Allow authenticated users to upload/update/delete
CREATE POLICY "Authenticated can upload drop images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'drop-images');

CREATE POLICY "Authenticated can update drop images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'drop-images');

CREATE POLICY "Authenticated can delete drop images"
ON storage.objects FOR DELETE
USING (bucket_id = 'drop-images');
