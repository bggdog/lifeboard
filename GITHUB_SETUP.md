# Quick GitHub Setup Guide

## Step 1: Initialize Git (if not done)

```bash
cd "/Users/bransongurley/Desktop/LifeOS 2.0"
git init
```

## Step 2: Create .gitignore

Already created! It includes:
- `node_modules`
- `.env` files
- Build artifacts (`dist`)
- Database files
- Logs

## Step 3: Make Initial Commit

```bash
git add .
git commit -m "Initial commit: Lifeboard app with Vercel deployment setup"
```

## Step 4: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `lifeboard` (or your choice)
3. **Don't** check "Initialize with README" (we already have files)
4. Click "Create repository"

## Step 5: Push to GitHub

```bash
# Replace YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/lifeboard.git
git branch -M main
git push -u origin main
```

## Step 6: Connect to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your `lifeboard` repository
4. Click "Import"

## Step 7: Configure Vercel

**Framework Preset:** Vite (should auto-detect)

**Root Directory:** `./` (default)

**Build Command:** `npm run build` (default)

**Output Directory:** `dist` (default)

**Install Command:** `npm install` (default)

## Step 8: Add Environment Variables in Vercel

In the "Environment Variables" section, add:

| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://uujtatmznjwwuxzjyhfa.supabase.co` |
| `SUPABASE_ANON_KEY` | `sb_publishable_oTFWMsxwP8n_a5RVNoqvzA_WdxqAiub` |
| `NODE_ENV` | `production` |

**Important:** Check all three environments: Production, Preview, and Development

## Step 9: Deploy!

Click **"Deploy"** - Vercel will:
1. Clone your repo
2. Install dependencies
3. Build the frontend
4. Set up serverless functions
5. Deploy to production

## Step 10: Verify Deployment

After deployment, you'll get a URL like:
`https://your-project.vercel.app`

Test it:
- Open the URL
- The app should load
- API routes should work (check `/api/health`)

## Automatic Deployments 🎉

Now every time you:
- Push to `main` branch → **Production deployment**
- Open a Pull Request → **Preview deployment** (unique URL)

## Troubleshooting

### Build Fails
- Check Vercel build logs
- Ensure all dependencies are in root `package.json`
- Verify environment variables are set

### API Routes Return 404
- Check that `api/[...path].js` exists
- Verify Express server exports correctly
- Check Vercel function logs

### Database Errors
- Verify Supabase environment variables in Vercel
- Check that all SQL migrations have been run
- Verify RLS policies in Supabase

## Next Steps

1. ✅ Push to GitHub
2. ✅ Connect to Vercel
3. ✅ Add environment variables
4. ✅ Deploy
5. 🎉 Share your app URL!
