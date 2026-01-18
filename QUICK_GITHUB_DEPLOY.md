# Quick GitHub → Vercel Deployment

## 1. Push to GitHub

```bash
cd "/Users/bransongurley/Desktop/LifeOS 2.0"

# Initialize git (if not done)
git init
git add .
git commit -m "Initial commit: Lifeboard app ready for Vercel"

# Create repo at github.com/new (don't initialize with README)
# Then push:
git remote add origin https://github.com/YOUR_USERNAME/lifeboard.git
git branch -M main
git push -u origin main
```

## 2. Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your GitHub repository
3. **Framework:** Vite (auto-detected)
4. **Environment Variables:** Add these:
   - `SUPABASE_URL` = `https://uujtatmznjwwuxzjyhfa.supabase.co`
   - `SUPABASE_ANON_KEY` = `sb_publishable_oTFWMsxwP8n_a5RVNoqvzA_WdxqAiub`
5. Click **Deploy**

That's it! 🎉

## Automatic Deployments

Every `git push` to main will auto-deploy to production!

For more details, see `VERCEL_DEPLOYMENT.md`
