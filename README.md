# The Wall — Supabase Des Moines Meetup (December 4, 2025)

Welcome! **The Wall** is a community application built specifically for the first Supabase Des Moines meetup. This is a tiny Next.js + Supabase app that demonstrates user accounts, profiles, a shared feed, and file uploads to Supabase Storage. It's designed to teach full-stack development patterns in a simple, hands-on way.

- **Live app:** https://supabase-dsm.vercel.app/
- **GitHub repo:** https://github.com/ultimum-j/supabase-dsm-wall

## How We'll Use This During the Meetup

We have two ways you can participate:

### Mode A – Use the Live Meetup App (Recommended In-Session)

1. Everyone will open the **live deployed app** at https://supabase-dsm.vercel.app/
2. No Supabase account needed! Just create a username and password to get started.
3. We'll create accounts, edit profiles, and upload photos/files to a shared community wall.
4. I'll have the Supabase dashboard open on the big screen and we'll watch rows and storage objects appear in real time as people interact with the app.
5. This is the easiest way to participate during the session—just use the shared app and see Supabase in action!

### Mode B – Fork and Run Your Own Copy (After or During Meetup)

1. If you want a deeper hands-on experience, **fork this repo** and follow the "Getting Started" instructions below.
2. You'll create your own Supabase project and connect it to your own copy of the app.
3. This gives you full control and lets you experiment without affecting the shared meetup app.
4. Perfect for after the meetup or if you want to follow along with your own setup during the session.

### Meetup Run-of-Show (For the Host)

Quick checklist for running the session:

- **Intro (5 min)**: Introduce the app and show the live deployed version (Mode A). Explain what we'll build and what Supabase does.
- **Demo (10 min)**: Show the Supabase dashboard (tables, storage, auth). Walk through signing up, creating a profile, and posting to the wall.
- **Live Interaction (15 min)**: Have attendees create accounts and post on the live app. Show the data appearing in real time in the dashboard.
- **Deep Dive (15 min)**: Open the code in an editor. Walk through key files: `lib/supabase.ts`, a component with queries, and the upload flow.
- **Fork & Extend (10 min)**: Explain how to fork the repo and connect their own Supabase project. Show the README setup steps.
- **Workshop Exercises (Remaining time)**: Point to the exercises section below for those who want to extend the app.
- **Wrap Up (5 min)**: Share resources, answer questions, and encourage folks to deploy their own versions.

## What This App Does

- **User Authentication**: Simple username/password authentication using bcrypt
- **Profile Management**: Users can set up profiles with avatars and bios
- **Community Feed**: Share photos and code files with the community
- **File Storage**: Upload images and code files to Supabase Storage
- **Member Directory**: View all registered community members

## Getting Started

**Want to run your own copy?** Follow these steps to fork the repo and connect your own Supabase project. This is perfect for experimenting after the meetup or following along with your own setup during the session.

### Step 1: Clone and Install

First, fork this repository on GitHub, then clone your fork:

```bash
git clone https://github.com/YOUR-USERNAME/supabase-dsm-wall.git
cd supabase-dsm-wall
npm install
```

> **Note**: You'll need Node.js 18+ and npm installed. Check with `node -v` and `npm -v`.

### Step 2: Create a Supabase Project

Now let's set up your Supabase backend:

1. Go to [supabase.com](https://supabase.com) and sign up for a free account (if you don't have one)
2. Click **"New Project"** or **"Start your project"**
3. Fill in the details:
   - **Name**: Something like `my-dsm-wall` or `learning-supabase`
   - **Database Password**: Choose a strong password (save it somewhere safe!)
   - **Region**: Pick the one closest to you (e.g., `US East` for Des Moines)
4. Click **Create new project**
5. Wait about 2 minutes for Supabase to provision your database

> **Tip**: While you wait, you can start on Step 3 below!

### Step 3: Get Your Supabase Credentials

Once your project is ready, you need two things: your **Project URL** and your **anon key**.

1. In your Supabase dashboard, click on **Settings** (gear icon in the sidebar)
2. Go to **API** in the settings menu
3. You'll see two values:
   - **Project URL**: Looks like `https://abcdefghijk.supabase.co`
   - **anon public** key: A long string starting with `eyJ...`
4. Copy these values—you'll need them in a moment

Now, create your environment file:

```bash
# Copy the example file
cp .env.example .env

# Open .env in your editor and paste your credentials:
# NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-long-anon-key-here
# NEXT_PUBLIC_SUPABASE_BUCKET=public-files
```

> **Important**: The `.env` file is gitignored, so your credentials won't be committed to GitHub. Never share your keys publicly!

### Step 4: Create Database Tables

Now we need to create two tables: one for users and one for posts.

1. In your Supabase dashboard, look for **SQL Editor** in the left sidebar (looks like a `</>` icon)
2. Click **"New query"** to open a blank SQL editor
3. Copy and paste the entire SQL block below:
4. Click **"Run"** (or press Cmd/Ctrl + Enter)
5. You should see a success message: `Success. No rows returned`

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

-- Create indexes for better performance
CREATE INDEX idx_posts_user_id ON posts(user_id);
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX idx_users_username ON users(username);
```

**Verify your tables were created:**

1. Click on **Table Editor** in the left sidebar
2. You should see two tables: `users` and `posts`
3. Click on each one to see the column structure

> **What just happened?** You created two PostgreSQL tables in your Supabase database. The `users` table stores account info (username, hashed password, bio, avatar), and the `posts` table stores the photos and code files people upload. The indexes make queries faster.

### Step 5: Create Storage Bucket

Supabase Storage is where we'll keep uploaded files (photos, avatars, code files). Let's create a bucket:

1. In your Supabase dashboard, click **Storage** in the left sidebar
2. Click the **"New bucket"** button (green button in the top right)
3. In the dialog:
   - **Name**: Type exactly `public-files` (must match your `.env` file)
   - **Public bucket**: Toggle this **ON** (makes files accessible without authentication)
4. Click **"Create bucket"**
5. You should see your new `public-files` bucket in the list

**Set up storage policies:**

Now we need to add policies so people can upload and view files:

1. Click on your `public-files` bucket
2. Go to the **"Policies"** tab at the top
3. You'll see a message about RLS. Click **"New policy"**
4. Choose **"Create a policy from scratch"**
5. For the **first policy** (uploads):

**Option A: Use the SQL editor (easier)**

Go back to **SQL Editor** and run these two policies:

```sql
-- Allow public uploads
CREATE POLICY "Allow public uploads"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'public-files');

-- Allow public access to files
CREATE POLICY "Allow public access"
ON storage.objects FOR SELECT
USING (bucket_id = 'public-files');
```

**Option B: Use the policy editor (if you want to learn the UI)**

1. For the **INSERT** policy:
   - Policy name: `Allow public uploads`
   - Allowed operation: Check **INSERT**
   - Target roles: Leave as `public`
   - USING expression: `bucket_id = 'public-files'`
2. Create a second policy for **SELECT**:
   - Policy name: `Allow public access`
   - Allowed operation: Check **SELECT**
   - Target roles: Leave as `public`
   - USING expression: `bucket_id = 'public-files'`

> **What are policies?** Policies control who can read/write your data. These policies let anyone upload files to `public-files` and view them. In production, you'd make these more restrictive.

### Step 6: Run the App Locally

You're all set! Let's start the development server:

```bash
npm run dev
```

You should see:
```
✓ Ready in 1.5s
○ Local:   http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

**Test it out:**

1. You should see "The Wall" with the Supabase Des Moines logo
2. Create an account with any username and password
3. After signup, you'll be prompted to set up your profile
4. Try uploading a photo or code file
5. Visit the Feed to see your post appear!
6. Go back to your Supabase dashboard → **Table Editor** → `users` and you'll see your account row
7. Check **Storage** → `public-files` to see your uploaded file

🎉 **Congratulations!** You've built a full-stack app with Next.js and Supabase!

## Workshop Exercises

Try these exercises during or after the meetup to deepen your understanding:

### Exercise 1: Add a "Likes" Feature
Add a `likes` column to the posts table and implement a like button on each post.

```sql
ALTER TABLE posts ADD COLUMN likes INTEGER DEFAULT 0;
```

### Exercise 2: Change Feed Sort Order
Modify `components/FeedList.tsx` to sort posts by different criteria (e.g., most recent first, oldest first).

### Exercise 3: Add Profile Pictures to Feed
The feed currently shows initials for users without avatars. Enhance this by showing a default avatar image instead.

### Exercise 4: Support Video Uploads
Extend the upload functionality to support video files. Update the `type` check in the posts table and modify the upload form.

### Exercise 5: Explore the Supabase Dashboard
- View your tables in the **Table Editor**
- Watch real-time changes as users sign up
- Check the **Storage** browser to see uploaded files
- Look at **Database** → **Roles** to understand permissions

### Exercise 6: Add Email Field
Add an optional email field to user profiles:

```sql
ALTER TABLE users ADD COLUMN email TEXT;
```

Then update `ProfileForm.tsx` to include an email input.

## Project Structure

```
supabase-dsm-wall/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home page (login/signup)
│   ├── feed/              # Community feed
│   ├── upload/            # Upload photos/code
│   ├── profile/           # User profile editor
│   ├── members/           # Member directory
│   ├── layout.tsx         # Root layout
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── AuthForm.tsx       # Login/signup form
│   ├── ProfileForm.tsx    # Profile editor
│   ├── UploadForm.tsx     # File upload form
│   ├── FeedList.tsx       # Display posts
│   ├── MemberList.tsx     # Display members
│   └── Navigation.tsx     # Nav bar
├── lib/                   # Utility functions
│   ├── supabase.ts       # Supabase client
│   └── session.ts        # Session management
├── types/                 # TypeScript types
│   └── database.ts       # Database type definitions
└── package.json          # Dependencies
```

## Understanding the Authentication System

**Important:** This app uses a **simplified authentication system** designed specifically for teaching. Here's how it works:

### How It Works (Simplified Auth)

1. **Signup**: When you create an account, your password is hashed using bcrypt and stored in the `users` table
2. **Login**: When you log in, the app compares your password to the hashed version in the database
3. **Session**: If the password matches, your user ID is stored in browser localStorage
4. **Protected Routes**: Pages like `/feed` and `/profile` check localStorage for a user ID

### Why Is This Not Production-Ready?

This auth system is **intentionally simple** for teaching, but it has limitations:

- **No email verification**: Anyone can create an account with any username
- **No password reset**: If you forget your password, there's no recovery
- **localStorage sessions**: These are vulnerable to XSS attacks
- **No Row Level Security (RLS)**: Anyone with your database credentials could read all data
- **No rate limiting**: Someone could spam signup attempts

### For Real Apps: Use Supabase Auth

For production applications, you should use **Supabase Auth**, which provides:

- Email/password authentication with verification
- OAuth providers (Google, GitHub, etc.)
- Secure JWT tokens instead of localStorage
- Built-in password reset flows
- Row Level Security (RLS) integration
- Magic links and phone auth

**See the "Upgrading After the Workshop" section below** for how to migrate to Supabase Auth + RLS.

> **Teaching Note**: We use this simplified system so you can see exactly how authentication works under the hood. Once you understand the basics, switching to Supabase Auth is straightforward!

## Key Concepts Demonstrated

### 1. Supabase Client Setup
The `lib/supabase.ts` file shows how to initialize the Supabase client with environment variables.

### 2. Database Queries
Components demonstrate various Supabase query patterns:
- `select()` - Fetch data
- `insert()` - Create records
- `update()` - Modify records
- `eq()` - Filter by equality
- `order()` - Sort results

### 3. File Storage
The upload form shows how to:
- Upload files to Supabase Storage
- Get public URLs for uploaded files
- Organize files in folders (avatars/, photos/, code/)

## Upgrading After the Workshop

This app uses a simplified authentication system for teaching purposes. For a production app, you should:

### Enable Supabase Auth

Replace the custom auth system with Supabase's built-in authentication:

```typescript
// Sign up
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
})

// Log in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Get current user
const { data: { user } } = await supabase.auth.getUser()
```

### Enable Row Level Security (RLS)

Add RLS policies to secure your data:

```sql
-- Enable RLS on tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Users can only update their own profile
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
USING (auth.uid() = id);

-- Anyone can view posts
CREATE POLICY "Anyone can view posts"
ON posts FOR SELECT
USING (true);

-- Users can create their own posts
CREATE POLICY "Users can create own posts"
ON posts FOR INSERT
WITH CHECK (auth.uid() = user_id);
```

### Additional Security Improvements

1. **Environment Variables**: Never commit `.env` files to git
2. **Input Validation**: Add server-side validation for all inputs
3. **Rate Limiting**: Implement rate limiting on auth endpoints
4. **HTTPS Only**: Always use HTTPS in production
5. **Content Security Policy**: Add CSP headers to prevent XSS

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

## Troubleshooting

**Error: "Invalid API key"**
- Double-check your `.env` file has the correct credentials
- Make sure environment variable names start with `NEXT_PUBLIC_`
- Restart the dev server after changing `.env`

**Error: "relation 'users' does not exist"**
- Run the SQL from Step 4 in your Supabase dashboard
- Verify the tables were created in the Table Editor

**Images not uploading**
- Verify the storage bucket exists and is public
- Check the storage policies allow inserts
- Ensure `NEXT_PUBLIC_SUPABASE_BUCKET` matches your bucket name

**App showing blank page**
- Check the browser console for errors
- Verify all dependencies installed: `npm install`
- Try deleting `.next` folder and restart: `rm -rf .next && npm run dev`

## License

MIT - Feel free to use this project for learning and teaching!
