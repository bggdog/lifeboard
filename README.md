# Lifeboard - Your Personal Dashboard

A beautiful, customizable personal dashboard for tracking habits, todos, journal entries, rewards, and more.

## Features

- 🎯 **Habit Tracking** - Track daily habits with token rewards
- ✅ **To-Do Lists** - Manage tasks with drag-and-drop reordering
- 📝 **Journal** - Daily journal entries
- 🎁 **Rewards Store** - Earn and redeem tokens for rewards
- 💼 **Work Notes** - Organized work notes with categories and dated to-dos
- 🎬 **Edit List** - Track video edits with token rewards
- 🏋️ **Gym Notes** - Track lifts, weights, and 1 rep maxes

## Tech Stack

- **Frontend:** React + TypeScript + Vite + Tailwind CSS
- **Backend:** Express.js + Supabase (PostgreSQL)
- **Deployment:** Vercel (serverless functions)

## Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   cd server && npm install && cd ..
   ```

2. **Set up environment variables:**
   - Create `server/.env` with your Supabase credentials:
     ```
     SUPABASE_URL=your_supabase_url
     SUPABASE_ANON_KEY=your_supabase_key
     PORT=3001
     ```

3. **Run database migrations:**
   - Go to Supabase SQL Editor
   - Run `SUPABASE_SETUP_COMPLETE.sql`
   - Run `SUPABASE_ADD_WORK_NOTES.sql`
   - Run `SUPABASE_ADD_EDITS.sql`
   - Run `SUPABASE_ADD_GYM_NOTES.sql`
   - Run `SEED_REWARDS.sql` (optional - adds initial rewards)

4. **Start development servers:**
   ```bash
   # Terminal 1: Backend
   cd server
   npm run dev
   
   # Terminal 2: Frontend
   npm run dev
   ```

5. **Open:** http://localhost:5173

## Deployment

See `VERCEL_DEPLOYMENT.md` for detailed deployment instructions to Vercel via GitHub.

### Quick Deploy to Vercel

1. Push code to GitHub
2. Import repository in Vercel
3. Add environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
4. Deploy!

## Project Structure

```
├── src/                 # Frontend React app
│   ├── components/     # React components
│   ├── context/        # React context (state management)
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities (API client, etc.)
├── server/             # Backend Express server
│   ├── db.js          # Database functions (Supabase)
│   └── server.js      # Express server & API routes
├── api/                # Vercel serverless functions
└── SUPABASE_*.sql     # Database migration files
```

## License

Private project
