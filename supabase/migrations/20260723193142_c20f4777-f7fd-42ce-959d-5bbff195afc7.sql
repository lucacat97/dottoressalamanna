
CREATE POLICY "Anyone can upload web consultation attachments"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'consultation-attachments' AND (storage.foldername(name))[1] = 'web');

CREATE POLICY "Anyone can read web consultation attachments"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'consultation-attachments' AND (storage.foldername(name))[1] = 'web');
