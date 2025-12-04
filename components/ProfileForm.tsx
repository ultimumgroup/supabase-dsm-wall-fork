'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import type { User } from '@/types/database';

export default function ProfileForm() {
  const [user, setUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const userId = getSession();
    if (!userId) {
      window.location.href = '/';
      return;
    }

    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      setUser(data);
      setUsername(data.username);
      setBio(data.bio || '');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const userId = getSession();
    if (!userId) return;

    try {
      let avatarUrl = user?.avatar_url;

      // Upload avatar if selected
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${userId}-${Date.now()}.${fileExt}`;
        const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'public-files';

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`avatars/${fileName}`, avatarFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`avatars/${fileName}`);

        avatarUrl = urlData.publicUrl;
      }

      // Update user profile
      const { error } = await supabase
        .from('users')
        .update({ username, bio, avatar_url: avatarUrl })
        .eq('id', userId);

      if (error) throw error;

      setMessage('Profile updated successfully!');
      loadUser();
    } catch (err) {
      setMessage('Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div>Loading...</div>;

  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-6">
        {user.avatar_url && (
          <div className="flex justify-center">
            <img
              src={user.avatar_url}
              alt="Avatar"
              className="w-24 h-24 rounded-full object-cover"
            />
          </div>
        )}

        <div>
          <label htmlFor="username" className="block text-sm font-medium mb-1">
            Username
          </label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-supabase"
          />
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-supabase"
          />
        </div>

        <div>
          <label htmlFor="avatar" className="block text-sm font-medium mb-1">
            Profile Photo
          </label>
          <input
            id="avatar"
            type="file"
            accept="image/*"
            onChange={(e) => setAvatarFile(e.target.files?.[0] || null)}
            className="w-full"
          />
        </div>

        {message && (
          <div className={`text-sm ${message.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-supabase text-white py-2 px-4 rounded-md hover:bg-supabase-dark disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
}
