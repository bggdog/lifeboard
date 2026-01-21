# LifeOS - Next.js Setup

## Getting Started

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Environment Variables

Create a `.env.local` file in the root directory:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

### 3. Create Profiles Table in Supabase

Run the SQL script `CREATE_PROFILES_TABLE.sql` in your Supabase SQL Editor to create the profiles table.

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
app/
  ├── layout.tsx          # Root layout
  ├── page.tsx            # Home page
  ├── todo/page.tsx       # To Do page
  ├── habits/page.tsx     # Habits page
  ├── work/page.tsx       # Work page
  └── gym/page.tsx        # Gym page

components/
  └── AppShell.tsx        # Main app shell with navigation

lib/
  ├── supabase/
  │   └── client.ts       # Supabase client singleton
  └── profile.ts          # Profile helper functions
```

## Features

- ✅ Next.js App Router
- ✅ Supabase integration with persistent sessions
- ✅ Mobile-first design (max-width 420px)
- ✅ iOS-like UI with safe area support
- ✅ Bottom tab navigation
- ✅ Token balance display
- ✅ No forced authentication (works with anonymous sessions)

## Next Steps

- Build out each tab's functionality
- Add data models for todos, habits, work notes, gym tracking
- Implement token reward system
- Add authentication (optional)
