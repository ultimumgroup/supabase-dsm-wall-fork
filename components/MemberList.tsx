'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { PublicUser } from '@/types/database';
import Link from 'next/link';

type MemberWithStats = PublicUser & {
  posts_count?: number;
  likes_received?: number;
  bookmarks_received?: number;
};

export default function MemberList() {
  const [members, setMembers] = useState<MemberWithStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMembers();
  }, []);

  const loadMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, bio, avatar_url, email, linkedin_url, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Get stats for each user
      const membersWithStats = await Promise.all(
        (data || []).map(async (member) => {
          const [postsResult, likesResult, bookmarksResult] = await Promise.all([
            supabase.from('posts').select('id').eq('user_id', member.id),
            supabase.from('posts').select('id').eq('user_id', member.id).then(async (posts) => {
              if (!posts.data?.length) return { data: [], count: 0 };
              const postIds = posts.data.map(p => p.id);
              const likes = await supabase.from('likes').select('id').in('post_id', postIds);
              return likes;
            }),
            supabase.from('posts').select('id').eq('user_id', member.id).then(async (posts) => {
              if (!posts.data?.length) return { data: [], count: 0 };
              const postIds = posts.data.map(p => p.id);
              const bookmarks = await supabase.from('bookmarks').select('id').in('post_id', postIds);
              return bookmarks;
            }),
          ]);

          return {
            ...member,
            posts_count: postsResult.data?.length || 0,
            likes_received: 'data' in likesResult ? likesResult.data?.length || 0 : 0,
            bookmarks_received: 'data' in bookmarksResult ? bookmarksResult.data?.length || 0 : 0,
          };
        })
      );

      setMembers(membersWithStats);
    } catch (err) {
      console.error('Error loading members:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading members...</div>;
  }

  if (members.length === 0) {
    return (
      <div className="text-center text-gray-600">
        No members yet. Be the first to join!
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {members.map((member) => (
        <div key={member.id} className="bg-white rounded-lg shadow-md p-6">
          <div className="flex flex-col items-center text-center">
            {member.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={member.avatar_url}
                alt={member.username}
                className="w-20 h-20 rounded-full object-cover mb-3"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-300 flex items-center justify-center mb-3">
                <span className="text-2xl text-gray-600 font-medium">
                  {member.username[0].toUpperCase()}
                </span>
              </div>
            )}
            
            <h3 className="font-medium text-lg">{member.username}</h3>
            
            {member.bio && (
              <p className="text-sm text-gray-600 mt-2">{member.bio}</p>
            )}

            {member.linkedin_url && (
              <a
                href={member.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-supabase hover:underline text-sm mt-2"
              >
                LinkedIn
              </a>
            )}

            {/* Stats */}
            <div className="flex gap-4 mt-4 text-sm">
              <Link
                href={`/feed?filter=user&userId=${member.id}`}
                className="text-gray-700 hover:text-supabase"
              >
                <span className="font-medium">{member.posts_count || 0}</span> posts
              </Link>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">
                <span className="font-medium">{member.likes_received || 0}</span> likes
              </span>
              <span className="text-gray-400">|</span>
              <span className="text-gray-700">
                <span className="font-medium">{member.bookmarks_received || 0}</span> saved
              </span>
            </div>
            
            <p className="text-xs text-gray-400 mt-3">
              Joined {new Date(member.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
