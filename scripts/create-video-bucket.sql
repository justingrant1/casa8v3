-- Create property-videos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'property-videos',
  'property-videos',
  true,
  104857600, -- 100MB limit
  ARRAY['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-msvideo']
)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for property-videos bucket
INSERT INTO storage.objects_rls_policies (bucket_id, name, definition)
VALUES (
  'property-videos',
  'Users can upload videos',
  'bucket_id = ''property-videos'' AND auth.uid() IS NOT NULL'
),
(
  'property-videos',
  'Videos are publicly accessible',
  'bucket_id = ''property-videos'''
)
ON CONFLICT (bucket_id, name) DO NOTHING;
