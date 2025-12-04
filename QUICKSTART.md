# Quick Start Guide 🚀

> **Note:** The main, most up-to-date instructions live in **[README.md](README.md)**. This is a condensed 5-minute setup guide for attendees who want to get started quickly.

**For Workshop Attendees**

## 5-Minute Setup

### 1. Clone and Install (2 min)
```bash
git clone <repo-url>
cd supabase-dsm-wall
npm install
```

### 2. Create Supabase Project (2 min)
1. Visit [supabase.com](https://supabase.com)
2. Click "New Project"
3. Name it (e.g., "dsm-wall")
4. Choose a password and region
5. Wait for setup to complete

### 3. Configure Environment (1 min)
```bash
# Copy template
cp .env.example .env

# Edit .env and add your credentials:
# - Get URL and anon key from Supabase Dashboard → Settings → API
```

### 4. Setup Database (In Supabase Dashboard)

**Run this SQL** (copy from README or below):

```sql
-- Create users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create posts table
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('photo', 'code')),
  file_url TEXT NOT NULL,
  caption TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
```

### 5. Create Storage Bucket
1. Supabase Dashboard → **Storage**
2. **New Bucket** → name: `public-files`
3. Make it **Public** ✓
4. Go to Policies and add:

```sql
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-files');

CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-files');
```

### 6. Run the App
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Test It Out

1. **Sign up** with a username/password
2. **Edit your profile** - add a bio and photo
3. **Upload** a photo or code file
4. **View the feed** - see your post
5. **Check members** - see your profile card

## Troubleshooting

**"Invalid API key"**
→ Check `.env` has correct credentials from Supabase dashboard

**"relation 'users' does not exist"**
→ Run the SQL from Step 4 in Supabase SQL Editor

**"Upload failed"**
→ Verify storage bucket is public and policies are set

**Blank page**
→ Check browser console for errors, verify `.env` is loaded

## What's Next?

See the main **README.md** for:
- Workshop exercises
- Architecture details
- Upgrade path to production
- Supabase Auth migration guide

## Need Help?

Ask the workshop leader or check:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js Docs](https://nextjs.org/docs)

---

Happy coding! 🎉
