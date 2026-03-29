# Vested Copytrading Platform - Production Deployment Guide

## Overview
This guide provides complete, step-by-step instructions for deploying the Vested copytrading Web3 platform to Vercel with Supabase as the backend database and authentication provider.

## Pre-Deployment Checklist

### 1. Environment Variables Required
Before deployment, ensure you have the following from your Supabase project:

| Variable | Source | Example |
|----------|--------|---------|
| `VITE_SUPABASE_URL` | Supabase > Project Settings > API > Project URL | `https://your-project.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Supabase > Project Settings > API > anon public | `eyJhbGc...` (long string) |
| `VITE_ADMIN_EMAIL` | Your admin email | `admin@yourdomain.com` |

### 2. Supabase Database Setup
Ensure the following tables exist in your Supabase project:

**Required Tables**:
- `users` - User accounts with `email`, `role` (admin/user), `full_name`
- `user_balance` - User balances with `user_email`, `balance_usd`, `total_invested`, `total_profit_loss`
- `portfolio` - User holdings with `user_email`, `crypto_symbol`, `amount`, `avg_buy_price`
- `cryptocurrencies` - Available cryptos with `symbol`, `price`, `change_24h`, `is_active`
- `copy_traders` - Approved traders with `trader_name`, `is_approved`, `min_allocation`, `profit_split_pct`
- `copy_trade` - Copy trading relationships with `user_email`, `trader_id`, `allocation`, `is_active`
- `transactions` - Transaction history with `user_email`, `type`, `amount`, `status`, `created_date`

Run the schema setup from `src/schema.sql` in your Supabase SQL Editor to initialize all tables.

## Step-by-Step Deployment Instructions

### Step 1: Prepare Your Local Repository

```bash
# 1. Ensure all base44 imports have been removed
grep -r "base44" src/ || echo "✓ No base44 references found"

# 2. Verify vercel.json configuration
cat vercel.json | grep -A5 '"env"'
# Should show only:
# "VITE_SUPABASE_URL"
# "VITE_SUPABASE_ANON_KEY"  
# "VITE_ADMIN_EMAIL"

# 3. Install dependencies
pnpm install

# 4. Build locally to verify
pnpm build
# Should complete with "✓ built in X.XXs"
```

### Step 2: Connect GitHub Repository (Recommended)

1. Push your code to GitHub:
```bash
git add .
git commit -m "fix: remove base44 dependency, add supabase integration"
git push origin main
```

2. In Vercel Dashboard:
   - Click "New Project"
   - Select "Import Git Repository"
   - Choose your GitHub repository
   - Click "Import"

### Step 3: Configure Environment Variables on Vercel

1. In Vercel Project Dashboard:
   - Navigate to **Settings** > **Environment Variables**
   - Add each variable with all 3 environments selected (Production, Preview, Development):

```
VITE_SUPABASE_URL = https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY = eyJhbGc... (your actual key)
VITE_ADMIN_EMAIL = admin@yourdomain.com
```

2. Click **Save** for each variable

3. Verify all 3 variables appear in the list

### Step 4: Configure Build Settings (If Not Auto-Detected)

Vercel should auto-detect these from `vercel.json`, but verify:

- **Build Command**: `pnpm build`
- **Output Directory**: `dist`
- **Install Command**: `pnpm install`

If needed, update in **Settings** > **General** > **Build & Development Settings**

### Step 5: Deploy

1. **Option A: Manual Deployment**
   - In Vercel Dashboard, click **Deployments**
   - Click **Deploy** button at top right
   - Select your branch (main)
   - Click **Deploy**

2. **Option B: Automatic Deployment** (Recommended)
   - Vercel auto-deploys on every push to main branch
   - No action needed

### Step 6: Verify Deployment Success

After deployment completes:

1. **Check Build Logs**:
   - Click the deployment
   - Check "Build & Deployments" tab
   - Should show "✓ Build completed successfully"

2. **Test the Application**:
   - Click domain link (e.g., `vested.vercel.app`)
   - Should load without console errors
   - Test login with Supabase credentials

3. **Check Browser Console** (F12):
   - No "Failed to resolve module" errors
   - No 404 errors for `/api/base44Client`

## Troubleshooting

### Build Fails with "buildGroups" Error
**Solution**: The `vercel.json` has been fixed to remove the invalid `buildGroups` property. If you're still seeing this error:
1. Ensure `vercel.json` doesn't contain a `"buildGroups"` array
2. Redeploy

### "Failed to resolve import @/api/base44Client"
**Solution**: All files have been updated to use Supabase. If error persists:
1. Check these 5 files have no `base44` imports:
   - `src/pages/CopyTrading.jsx`
   - `src/pages/Portfolio.jsx`
   - `src/pages/admin/ManageUsers.jsx`
   - `src/lib/PageNotFound.jsx`
   - `src/components/layout/MobileBottomNav.jsx`

2. Run: `pnpm build` locally to verify
3. Commit fixes and push

### "Cannot read property of undefined" at Runtime
**Cause**: Environment variables not set on Vercel
**Solution**:
1. Go to Vercel Project Settings > Environment Variables
2. Ensure all 3 variables are set:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_EMAIL`
3. Redeploy the application

### App Loads but Data Doesn't Display
**Cause**: Supabase database tables may be empty or missing
**Solution**:
1. Verify tables exist in Supabase:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'public';
   ```
2. If tables missing, run `src/schema.sql` in Supabase SQL Editor
3. Add sample data if needed
4. Clear browser cache and reload

## Security Best Practices

### Supabase Configuration

1. **Row Level Security (RLS)**:
   - Enable RLS on all tables in Supabase:
   ```sql
   ALTER TABLE users ENABLE ROW LEVEL SECURITY;
   ALTER TABLE portfolio ENABLE ROW LEVEL SECURITY;
   ALTER TABLE copy_trade ENABLE ROW LEVEL SECURITY;
   ```

2. **RLS Policies**:
   ```sql
   -- Users can only see their own data
   CREATE POLICY "Users see own records" ON portfolio
     FOR SELECT USING (auth.uid() = user_id);
   ```

3. **API Keys**:
   - Never commit `VITE_SUPABASE_ANON_KEY` to git
   - Use Vercel Environment Variables for secrets
   - Rotate keys periodically in Supabase

### Application Security

1. **Authentication**:
   - All user data queries filter by authenticated user's email
   - Admin routes check for `role = 'admin'` in database

2. **Data Validation**:
   - All numeric inputs validated before database operations
   - SQL injection prevented via Supabase parameterized queries

3. **CORS & HTTPS**:
   - Vercel automatically uses HTTPS
   - Supabase CORS configured for your domain

## Performance Optimization

### Caching Strategy

The application uses Recharts for charts and React Query for data fetching:
- Asset caching: 31536000 seconds (1 year) for hashed assets
- HTML caching: 0 seconds (must-revalidate) for `index.html`
- API responses: Cached in-memory by React Query

### Monitoring

1. **Vercel Analytics**:
   - Navigate to Analytics tab to monitor performance
   - Check Core Web Vitals monthly

2. **Supabase Monitoring**:
   - Check Database section for query performance
   - Monitor Storage and Bandwidth usage

3. **Error Tracking**:
   - Monitor browser console for errors
   - Check Vercel Function logs for any API issues

## Rollback Procedure

If deployment causes issues:

1. **Immediate Rollback** (Vercel Dashboard):
   - Go to Deployments
   - Find previous successful deployment
   - Click three dots > Promote to Production

2. **Code Rollback** (Git):
   ```bash
   git revert <commit-hash>
   git push origin main
   # Vercel will auto-redeploy
   ```

## Post-Deployment Tasks

### Day 1: Verification
- [ ] Application loads without errors
- [ ] Login/authentication works
- [ ] Dashboard displays user balance correctly
- [ ] Portfolio page fetches holdings from Supabase
- [ ] Copy trading traders list appears
- [ ] Admin dashboard accessible to admin users
- [ ] Mobile navigation works on small screens

### Week 1: Monitoring
- [ ] Monitor error logs in browser console
- [ ] Check Vercel deployment logs for any warnings
- [ ] Verify Supabase database queries complete within SLA
- [ ] Test transaction processing (deposits/withdrawals)
- [ ] Monitor user reports of issues

### Ongoing: Maintenance
- [ ] Review analytics weekly
- [ ] Update dependencies monthly (`pnpm outdated`)
- [ ] Monitor Supabase storage/bandwidth usage
- [ ] Backup database monthly
- [ ] Review security logs in Supabase

## Contact & Support

For deployment issues:
1. Check build logs in Vercel Dashboard
2. Review error messages in browser console (F12)
3. Verify environment variables in Vercel Settings
4. Check Supabase status page
5. Contact Vercel support if infrastructure issue

## Technology Stack Reference

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React | 19.2+ |
| Bundler | Vite | 6.4.1+ |
| Styling | Tailwind CSS | 4.0+ |
| UI Components | shadcn/ui | Latest |
| Database | Supabase (PostgreSQL) | Latest |
| Authentication | Supabase Auth | Latest |
| Deployment | Vercel | Latest |
| Package Manager | pnpm | 9.0+ |

## Architecture Notes

### Data Flow
1. **User Actions** → React Components (CopyTrading, Portfolio, etc.)
2. **API Calls** → Supabase Client (`supabaseClient.js`)
3. **Database** → PostgreSQL (Supabase)
4. **Real-time Updates** → React Query with manual polling
5. **Error Handling** → Toast notifications via Sonner

### Key Files
- `src/api/supabaseClient.js` - Database connection
- `vercel.json` - Deployment configuration
- `src/schema.sql` - Database schema
- `.env.local` - Local development environment variables (never commit)

---

**Last Updated**: March 29, 2026
**Status**: Production Ready ✓
**No Breaking Changes**: All functionality preserved during Base44 → Supabase migration
