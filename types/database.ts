export type User = {
  id: string;
  username: string;
  password_hash: string;
  bio?: string | null;
  avatar_url?: string | null;
  email?: string | null;
  linkedin_url?: string | null;
  created_at: string;
};

export type PublicUser = Omit<User, 'password_hash'>;

export type Post = {
  id: string;
  user_id: string;
  type: 'photo' | 'code' | 'text';
  file_url?: string | null;
  caption?: string | null;
  created_at: string;
  likes_count?: number;
  bookmarks_count?: number;
};

export type Like = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};

export type Bookmark = {
  id: string;
  user_id: string;
  post_id: string;
  created_at: string;
};
