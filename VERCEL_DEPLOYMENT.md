# Deploying to Vercel via GitHub

This guide will help you deploy your Lifeboard app to Vercel with automatic deployments from GitHub.

## Prerequisites

1. GitHub account
2. Vercel account (free tier works great)
3. Supabase project already set up (you have this!)

## Step 1: Push to GitHub

### 1.1 Initialize Git Repository (if not already done)

```bash
cd "/Users/bransongurley/Desktop/LifeOS 2.0"
git init
git add .
git commit -m "Initial commit"
```

### 1.2 Create GitHub Repository

1. Go to https://github.com/new
2. Create a new repository (e.g., `lifeboard`)
3. **Don't** initialize with README, .gitignore, or license
4. Copy the repository URL

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/lifeboard.git
git branch -M main
git push -u origin main
```

## Step 2: Deploy to Vercel

### 2.1 Connect GitHub to Vercel

1. Go to https://vercel.com/new
2. Click **"Import Git Repository"**
3. Select your GitHub repository (`lifeboard`)
4. Click **"Import"**

### 2.2 Configure Project Settings

**Framework Preset:** Vite

**Root Directory:** `./` (leave as default)

**Build Command:** `npm run build`

**Output Directory:** `dist`

**Install Command:** `npm install`

### 2.3 Add Environment Variables

In Vercel project settings, add these environment variables:

```
SUPABASE_URL=https://uujtatmznjwwuxzjyhfa.supabase.co
SUPABASE_ANON_KEY=sb_publishable_oTFWMsxwP8n_a5RVNoqvzA_WdxqAiub
NODE_ENV=production
```

**To add environment variables:**
1. In Vercel project settings, go to **"Environment Variables"**
2. Add each variable:
   - Key: `SUPABASE_URL`
   - Value: `https://uujtatmznjwwuxzjyhfa.supabase.co`
   - Environment: Production, Preview, Development (check all)
3. Repeat for `SUPABASE_ANON_KEY` and `NODE_ENV`

### 2.4 Deploy

Click **"Deploy"** - Vercel will:
- Install dependencies
- Build the project
- Deploy to a production URL

## Step 3: Update API Configuration

After deployment, you'll need to update the frontend API URL.

### 3.1 Get Your Vercel URL

After deployment, Vercel will give you a URL like:
`https://your-project.vercel.app`

### 3.2 Create `.env.production` (Optional)

Create a `.env.production` file for local builds:

```env
VITE_API_URL=https://your-project.vercel.app/api
```

**Note:** For Vercel deployments, the API will be at the same domain, so `/api` should work automatically.

## Step 4: Update Vite Config (if needed)

The `vite.config.ts` already has a proxy setup for local development. For production on Vercel, the API routes will be served from the same domain, so relative paths (`/api`) will work.

## Step 5: Automatic Deployments

✅ **You're all set!** Every time you push to the `main` branch on GitHub:

1. Vercel will automatically detect the push
2. Build your project
3. Run tests (if you add them)
4. Deploy to production

You'll also get preview deployments for pull requests!

## Troubleshooting

### API Routes Not Working

If API routes return 404:
1. Check that `api/[...path].js` exists
2. Verify environment variables are set in Vercel
3. Check Vercel function logs in the dashboard

### Build Errors

If the build fails:
1. Check Vercel build logs
2. Ensure all dependencies are in `package.json`
3. Verify `package.json` has correct build scripts

### Database Connection Issues

If you get database errors:
1. Verify Supabase environment variables in Vercel
2. Check Supabase RLS policies are set correctly
3. Ensure all SQL migrations have been run

## Manual Deployment

If you need to deploy manually:

```bash
npm install -g vercel
vercel login
vercel --prod
```

## Monitoring

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Function Logs:** Available in Vercel dashboard under your project
- **Analytics:** Available in Vercel dashboard (Pro plan)

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Connect GitHub repo to Vercel
3. ✅ Add environment variables
4. ✅ Deploy!
5. 🎉 Share your app URL with others!
