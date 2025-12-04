'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';

export default function UploadForm() {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setMessage('Please select a file');
      return;
    }

    setLoading(true);
    setMessage('');

    const userId = getSession();
    if (!userId) {
      window.location.href = '/';
      return;
    }

    try {
      const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'public-files';
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      
      // Determine file type
      const isImage = file.type.startsWith('image/');
      const type = isImage ? 'photo' : 'code';
      const folder = isImage ? 'photos' : 'code';

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from(bucketName)
        .upload(`${folder}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from(bucketName)
        .getPublicUrl(`${folder}/${fileName}`);

      // Create post record
      const { error: insertError } = await supabase
        .from('posts')
        .insert([{
          user_id: userId,
          type,
          file_url: urlData.publicUrl,
          caption: caption || null,
        }]);

      if (insertError) throw insertError;

      setMessage('Upload successful!');
      setFile(null);
      setCaption('');
      
      // Redirect to feed after 1 second
      setTimeout(() => {
        window.location.href = '/feed';
      }, 1000);
    } catch (err) {
      setMessage('Error uploading file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="file" className="block text-sm font-medium mb-1">
            Upload Photo or Code File
          </label>
          <input
            id="file"
            type="file"
            accept="image/*,.js,.ts,.tsx,.jsx,.py,.go,.java,.cpp,.c,.rs,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
            className="w-full"
          />
          {file && (
            <p className="text-sm text-gray-600 mt-2">
              Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </p>
          )}
        </div>

        <div>
          <label htmlFor="caption" className="block text-sm font-medium mb-1">
            Caption (optional)
          </label>
          <textarea
            id="caption"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-supabase"
            placeholder="Add a description..."
          />
        </div>

        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !file}
          className="w-full bg-supabase text-white py-2 px-4 rounded-md hover:bg-supabase-dark disabled:opacity-50 transition-colors"
        >
          {loading ? 'Uploading...' : 'Upload'}
        </button>
      </form>
    </div>
  );
}
