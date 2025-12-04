'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { getSession } from '@/lib/session';
import type { Post, PublicUser } from '@/types/database';

type PostWithUser = Post & {
  user?: PublicUser;
  user_liked?: boolean;
  user_bookmarked?: boolean;
};

type FilterMode = 'all' | 'liked' | 'bookmarked' | 'user';
type SortMode = 'recent' | 'likes' | 'oldest';

interface FeedListProps {
  initialFilter?: FilterMode;
  initialUserId?: string;
}

export default function FeedList({ initialFilter = 'all', initialUserId }: FeedListProps) {
  const [posts, setPosts] = useState<PostWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMode, setFilterMode] = useState<FilterMode>(initialFilter);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [filterUserId, setFilterUserId] = useState<string | undefined>(initialUserId);
  
  // Post form state
  const [showPostForm, setShowPostForm] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [posting, setPosting] = useState(false);
  const [postMessage, setPostMessage] = useState('');

  const currentUserId = getSession();

  useEffect(() => {
    if (initialFilter) setFilterMode(initialFilter);
    if (initialUserId) setFilterUserId(initialUserId);
  }, [initialFilter, initialUserId]);

  useEffect(() => {
    loadPosts();
  }, [filterMode, sortMode, filterUserId]);

  const linkifyText = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    return text.split(urlRegex).map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-supabase hover:underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const loadPosts = async () => {
    try {
      let query = supabase.from('posts').select('*');

      // Apply filters
      if (filterMode === 'user' && filterUserId) {
        query = query.eq('user_id', filterUserId);
      } else if (filterMode === 'liked' && currentUserId) {
        const { data: likes } = await supabase
          .from('likes')
          .select('post_id')
          .eq('user_id', currentUserId);
        const likedPostIds = likes?.map(l => l.post_id) || [];
        if (likedPostIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        query = query.in('id', likedPostIds);
      } else if (filterMode === 'bookmarked' && currentUserId) {
        const { data: bookmarks } = await supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', currentUserId);
        const bookmarkedPostIds = bookmarks?.map(b => b.post_id) || [];
        if (bookmarkedPostIds.length === 0) {
          setPosts([]);
          setLoading(false);
          return;
        }
        query = query.in('id', bookmarkedPostIds);
      }

      // Apply sorting
      if (sortMode === 'recent') {
        query = query.order('created_at', { ascending: false });
      } else if (sortMode === 'oldest') {
        query = query.order('created_at', { ascending: true });
      }

      const { data: postsData, error: postsError } = await query;
      if (postsError) throw postsError;

      // Get likes and bookmarks counts
      const postIds = postsData?.map(p => p.id) || [];
      const [likesResult, bookmarksResult, userLikesResult, userBookmarksResult] = await Promise.all([
        supabase.from('likes').select('post_id'),
        supabase.from('bookmarks').select('post_id'),
        currentUserId
          ? supabase.from('likes').select('post_id').eq('user_id', currentUserId)
          : { data: [] },
        currentUserId
          ? supabase.from('bookmarks').select('post_id').eq('user_id', currentUserId)
          : { data: [] },
      ]);

      const likesMap = new Map<string, number>();
      const bookmarksMap = new Map<string, number>();
      likesResult.data?.forEach(l => {
        likesMap.set(l.post_id, (likesMap.get(l.post_id) || 0) + 1);
      });
      bookmarksResult.data?.forEach(b => {
        bookmarksMap.set(b.post_id, (bookmarksMap.get(b.post_id) || 0) + 1);
      });

      const userLikedIds = new Set(userLikesResult.data?.map(l => l.post_id) || []);
      const userBookmarkedIds = new Set(userBookmarksResult.data?.map(b => b.post_id) || []);

      // Fetch users
      const userIds = [...new Set(postsData?.map(p => p.user_id) || [])];
      const { data: usersData } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .in('id', userIds);

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || []);

      let postsWithData = postsData?.map(post => ({
        ...post,
        user: usersMap.get(post.user_id),
        likes_count: likesMap.get(post.id) || 0,
        bookmarks_count: bookmarksMap.get(post.id) || 0,
        user_liked: userLikedIds.has(post.id),
        user_bookmarked: userBookmarkedIds.has(post.id),
      })) || [];

      // Sort by likes if needed
      if (sortMode === 'likes') {
        postsWithData = postsWithData.sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0));
      }

      setPosts(postsWithData);
    } catch (err) {
      console.error('Error loading posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!currentUserId) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_liked) {
        await supabase.from('likes').delete().eq('user_id', currentUserId).eq('post_id', postId);
      } else {
        await supabase.from('likes').insert({ user_id: currentUserId, post_id: postId });
      }
      loadPosts();
    } catch (err) {
      console.error('Error toggling like:', err);
    }
  };

  const handleBookmark = async (postId: string) => {
    if (!currentUserId) return;

    const post = posts.find(p => p.id === postId);
    if (!post) return;

    try {
      if (post.user_bookmarked) {
        await supabase.from('bookmarks').delete().eq('user_id', currentUserId).eq('post_id', postId);
      } else {
        await supabase.from('bookmarks').insert({ user_id: currentUserId, post_id: postId });
      }
      loadPosts();
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUserId) return;
    if (!file && !caption.trim()) {
      setPostMessage('Please add a file or caption');
      return;
    }

    setPosting(true);
    setPostMessage('');

    try {
      let fileUrl: string | null = null;
      let type: 'photo' | 'code' | 'text' = 'text';

      if (file) {
        const bucketName = process.env.NEXT_PUBLIC_SUPABASE_BUCKET || 'public-files';
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUserId}-${Date.now()}.${fileExt}`;
        
        const isImage = file.type.startsWith('image/');
        type = isImage ? 'photo' : 'code';
        const folder = isImage ? 'photos' : 'code';

        const { error: uploadError } = await supabase.storage
          .from(bucketName)
          .upload(`${folder}/${fileName}`, file);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(`${folder}/${fileName}`);

        fileUrl = urlData.publicUrl;
      }

      const { error: insertError } = await supabase.from('posts').insert([{
        user_id: currentUserId,
        type,
        file_url: fileUrl,
        caption: caption || null,
      }]);

      if (insertError) throw insertError;

      setPostMessage('Posted successfully!');
      setFile(null);
      setCaption('');
      setShowPostForm(false);
      loadPosts();
    } catch (err) {
      setPostMessage('Error creating post');
    } finally {
      setPosting(false);
    }
  };

  if (loading) {
    return <div className="text-center">Loading feed...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Post Button */}
      {!showPostForm && (
        <button
          onClick={() => setShowPostForm(true)}
          className="w-full bg-supabase text-white py-3 px-4 rounded-lg hover:bg-supabase-dark transition-colors font-medium"
        >
          + Create Post
        </button>
      )}

      {/* Post Form */}
      {showPostForm && (
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <h3 className="text-lg font-bold mb-4">Create a Post</h3>
          <form onSubmit={handlePost} className="space-y-4">
            <div>
              <label htmlFor="caption" className="block text-sm font-medium mb-1">
                Caption {!file && <span className="text-red-500">*</span>}
              </label>
              <textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                rows={3}
                placeholder="Share your thoughts... (URLs will be clickable)"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-supabase"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium mb-1">
                File (optional)
              </label>
              <input
                id="file"
                type="file"
                accept="image/*,.js,.ts,.tsx,.jsx,.py,.go,.java,.cpp,.c,.rs,.txt"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full"
              />
              {file && (
                <p className="text-sm text-gray-600 mt-2">
                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                </p>
              )}
            </div>

            {postMessage && (
              <div className={`text-sm ${postMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
                {postMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={posting || (!file && !caption.trim())}
                className="flex-1 bg-supabase text-white py-2 px-4 rounded-md hover:bg-supabase-dark disabled:opacity-50 transition-colors"
              >
                {posting ? 'Posting...' : 'Post'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowPostForm(false);
                  setFile(null);
                  setCaption('');
                  setPostMessage('');
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Filter</label>
            <select
              value={filterMode}
              onChange={(e) => setFilterMode(e.target.value as FilterMode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-supabase"
            >
              <option value="all">All Posts</option>
              <option value="liked">My Liked</option>
              <option value="bookmarked">My Bookmarked</option>
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortMode}
              onChange={(e) => setSortMode(e.target.value as SortMode)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-supabase"
            >
              <option value="recent">Most Recent</option>
              <option value="oldest">Oldest First</option>
              <option value="likes">Most Liked</option>
            </select>
          </div>
        </div>
      </div>

      {/* Posts */}
      {posts.length === 0 ? (
        <div className="text-center text-gray-600 py-8">
          No posts yet. {filterMode === 'all' ? 'Be the first to share something!' : 'Try a different filter.'}
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* User info */}
            <div className="p-4 flex items-center gap-3">
              {post.user?.avatar_url ? (
                <img
                  src={post.user.avatar_url}
                  alt={post.user.username}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                  <span className="text-gray-600 font-medium">
                    {post.user?.username?.[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
              <div>
                <p className="font-medium">{post.user?.username || 'Unknown'}</p>
                <p className="text-xs text-gray-500">
                  {new Date(post.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Content */}
            {post.type === 'photo' && post.file_url && (
              <img
                src={post.file_url}
                alt="Post"
                className="w-full max-h-96 object-cover"
              />
            )}
            {post.type === 'code' && post.file_url && (
              <div className="px-4 pb-2">
                <div className="bg-gray-100 p-4 rounded-md">
                  <p className="text-sm font-mono">📄 Code file</p>
                  <a
                    href={post.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-supabase hover:underline text-sm"
                  >
                    View file
                  </a>
                </div>
              </div>
            )}

            {/* Caption */}
            {post.caption && (
              <div className="px-4 py-3">
                <p className="text-sm whitespace-pre-wrap">{linkifyText(post.caption)}</p>
              </div>
            )}

            {/* Actions */}
            <div className="px-4 py-3 border-t border-gray-100 flex items-center gap-6">
              <button
                onClick={() => handleLike(post.id)}
                className={`flex items-center gap-2 transition-colors ${
                  post.user_liked ? 'text-red-500' : 'text-gray-600 hover:text-red-500'
                }`}
              >
                <svg className="w-5 h-5" fill={post.user_liked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-sm">{post.likes_count || 0}</span>
              </button>
              <button
                onClick={() => handleBookmark(post.id)}
                className={`flex items-center gap-2 transition-colors ${
                  post.user_bookmarked ? 'text-supabase' : 'text-gray-600 hover:text-supabase'
                }`}
              >
                <svg className="w-5 h-5" fill={post.user_bookmarked ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
                <span className="text-sm">{post.bookmarks_count || 0}</span>
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
