# Troubleshooting Next.js Startup Issues

## If the dev server is stuck on "starting":

1. **Clear the Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check if port 3000 is already in use:**
   ```bash
   lsof -ti:3000 | xargs kill -9
   ```

3. **Try a different port:**
   ```bash
   npm run dev -- -p 3001
   ```

4. **Check for TypeScript errors:**
   ```bash
   npx tsc --noEmit
   ```

5. **Verify environment variables are set:**
   - Make sure `.env.local` exists in the root directory
   - Check that `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` are set

6. **Reinstall dependencies:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

## Common Issues:

- **Module not found errors**: Make sure all dependencies are installed with `npm install`
- **Port already in use**: Kill the process using port 3000 or use a different port
- **Build hanging**: Clear `.next` directory and try again
- **TypeScript errors**: Run `npx tsc --noEmit` to see all errors
