# AITE - Adaptive Intelligence Trading Ecosystem

## Deployment to Vercel

### Prerequisites
- A Vercel account (sign up at https://vercel.com)
- Git repository (GitHub, GitLab, or Bitbucket)

### Quick Deploy

1. **Push to Git Repository**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPOSITORY_URL
   git push -u origin main
   ```

2. **Deploy to Vercel**
   - Go to https://vercel.com/new
   - Import your Git repository
   - Vercel will auto-detect Vite settings
   - Click "Deploy"

3. **Alternative: Vercel CLI**
   ```bash
   npm i -g vercel
   vercel login
   vercel
   ```

### Environment Variables (if needed)
- `VITE_DERIV_API_KEY` - Your Deriv API key
- `VITE_GEMINI_API_KEY` - Your Google Gemini API key

Add these in Vercel Dashboard → Settings → Environment Variables

### Build Settings (Auto-detected)
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Mobile Optimization
The app is fully responsive with:
- Mobile-first design
- Touch-optimized controls
- Safe area insets for notched devices
- Responsive breakpoints: sm, md, lg, xl

### Custom Domain (Optional)
1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

Your app will be live at: `https://your-project.vercel.app`
