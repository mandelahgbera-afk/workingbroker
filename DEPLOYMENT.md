# Brokerr - Complete Independent Deployment Guide

**Status: Fully Independent from Base44**

This guide walks you through deploying Brokerr as a standalone platform using only Supabase and Vercel. No third-party SDK dependencies.

---

## Prerequisites

- GitHub account with Git installed
- Vercel account (free tier sufficient)
- Supabase account (free tier)
- Custom domain (optional - Vercel provides subdomain)
- Admin email address

---

## Phase 1: Repository Setup

### 1.1 Initialize Git Repository

```bash
cd brokerr
git init
git add .
git commit -m "Initial commit: Brokerr independent copytrading platform"
```

### 1.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `brokerr`
3. Select **Private**
4. Do NOT initialize with README or .gitignore
5. Click "Create repository"

### 1.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/brokerr.git
git branch -M main
git push -u origin main
```

**Verify**: Visit your GitHub repo - all files should be present, node_modules/ should be ignored.

---

## Phase 2: Supabase Setup (Complete Database)

### 2.1 Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Click "New Project"
3. Fill in:
   - **Project Name**: `brokerr-production`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Select closest to your users
   - **Edition**: Free

4. Wait 2-5 minutes for database initialization

### 2.2 Deploy Database Schema

1. In Supabase dashboard, go to **SQL Editor**
2. Click **"New query"**
3. Copy entire contents of `/src/schema.sql` from your project
4. Paste into editor
5. Click **"Run"** (Cmd/Ctrl + Enter)

**Expected**: Green checkmark, "Success" message, no errors.

### 2.3 Verify Tables

Go to **Database → Tables** and confirm 8 tables exist:

- `users` - User accounts
- `crypto` - Supported cryptocurrencies
- `portfolio` - User holdings
- `transaction` - All transactions/requests
- `user_balance` - Account balances
- `copy_trader` - Elite traders users can follow
- `copy_trade` - Active copy trading relationships
- `platform_settings` - Platform configuration

**All tables should have RLS (Row Level Security) policies enabled.**

### 2.4 Get Supabase API Keys

Go to **Project Settings → API**:

1. Copy **Project URL** (e.g., `https://xyzabc.supabase.co`)
2. Copy **Anon Key** (the public key - safe to expose)

**Save these - you'll need them for Vercel.**

---

## Phase 3: Local Environment Setup

### 3.1 Create .env.local

```bash
cp .env.example .env.local
```

### 3.2 Fill in Environment Variables

Edit `.env.local`:

```env
# Supabase - REQUIRED
VITE_SUPABASE_URL=https://xyzabc.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Admin Configuration - REQUIRED
VITE_ADMIN_EMAIL=your-admin@example.com
VITE_ADMIN_NAME=Platform Admin
```

**Never commit .env.local to git!**

### 3.3 Install Dependencies

```bash
pnpm install
```

### 3.4 Test Locally

```bash
pnpm dev
```

Visit `http://localhost:5173` - app should load without Base44 errors.

---

## Phase 4: Vercel Deployment

### 4.1 Connect GitHub to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New" → "Project"**
3. Select **"Import Git Repository"**
4. Choose your GitHub account
5. Select `brokerr` repository
6. Click **"Import"**

### 4.2 Set Environment Variables in Vercel

1. In Vercel dashboard, go to **Settings → Environment Variables**
2. Add the following (use same values from .env.local):

| Name | Value | Environment |
|------|-------|-------------|
| `VITE_SUPABASE_URL` | Your Supabase project URL | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `VITE_ADMIN_EMAIL` | Admin email address | Production, Preview, Development |
| `VITE_ADMIN_NAME` | Admin name | Production, Preview, Development |

**Click "Save"** after adding each variable.

### 4.3 Deploy

1. Click **"Deploy"**
2. Wait for build to complete (usually 2-3 minutes)
3. When green checkmark appears, click **"Visit"** to access live app

**Verify deployment**:
- App loads without errors
- Can navigate to all pages
- No Base44 references in console

---

## Phase 5: Admin Configuration

### 5.1 Set Up Admin Dashboard Access

The admin email you configured receives notifications for:
- User deposit requests
- User withdrawal requests
- Copy trading disputes
- Platform issues

### 5.2 Configure Admin Account

1. In Supabase, go to **Authentication → Users**
2. Find or create user with your admin email
3. Set `is_admin = true` in user metadata:

```sql
-- Run in Supabase SQL Editor
UPDATE auth.users 
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{is_admin}', 'true'::jsonb)
WHERE email = 'your-admin@example.com';
```

4. Admin can now access `/admin` routes

### 5.3 Approve User Requests

Admin dashboard shows pending requests. To approve/decline:

```sql
-- Approve deposit request
UPDATE transaction 
SET status = 'approved', updated_at = NOW()
WHERE id = 'request_id' AND type = 'deposit_request';

-- Decline withdrawal request
UPDATE transaction 
SET status = 'declined', updated_at = NOW()
WHERE id = 'request_id' AND type = 'withdrawal_request';
```

---

## Phase 6: Email Notifications (Optional but Recommended)

### 6.1 Send Email on User Requests

Create a Supabase Edge Function to email admin when requests are created:

1. Go to **Edge Functions** in Supabase
2. Create new function: `notify-admin`
3. Use this template:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

serve(async (req) => {
  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL"),
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")
  );

  // Listen for new transactions
  const body = await req.json();
  const { record, type } = body;

  if (type === "INSERT" && record.type.includes("request")) {
    // Send email to admin
    const adminEmail = Deno.env.get("ADMIN_EMAIL");
    
    // Call your email service (Resend, SendGrid, etc.)
    // This is optional - your admin checks dashboard instead
  }

  return new Response(JSON.stringify({ success: true }));
});
```

---

## Phase 7: Custom Domain (Optional)

### 7.1 Add Custom Domain to Vercel

1. In Vercel dashboard, go to **Settings → Domains**
2. Enter your custom domain (e.g., `brokerr.io`)
3. Follow DNS configuration instructions
4. Wait for DNS propagation (usually 24 hours)

### 7.2 Verify Domain

Visit your custom domain - app should load with HTTPS.

---

## Phase 8: Post-Deployment Verification

### 8.1 Security Checklist

- [ ] No Base44 references in app
- [ ] Supabase RLS policies protecting user data
- [ ] Admin email configured for requests
- [ ] Environment variables hidden (not in URL)
- [ ] HTTPS enabled (Vercel automatic)
- [ ] .env files ignored in git
- [ ] Database backups enabled (Supabase free tier)

### 8.2 Functionality Testing

- [ ] Can access landing page
- [ ] Can register new account
- [ ] Can login with email/password
- [ ] Can view dashboard
- [ ] Can create deposit request
- [ ] Admin can approve/decline requests
- [ ] Copy trading features work
- [ ] Portfolio displays correctly
- [ ] Mobile navigation works

### 8.3 Monitor Deployment

In Vercel dashboard, watch:
- **Deployments**: All builds pass
- **Analytics**: Traffic flowing normally
- **Functions**: No serverless function errors
- **Environment**: Variables loaded correctly

---

## Phase 9: Scaling & Production

### 9.1 Upgrade Supabase (When Needed)

If you exceed free tier limits:
1. Go to Supabase **Project Settings → Billing**
2. Upgrade to Pro ($25/month)
3. Includes more API requests, storage, and performance

### 9.2 Vercel Production Settings

Recommended for production:

1. **Settings → Git → Deploy Branch**: Set to `main`
2. **Settings → Build & Development**: Auto-detected (correct)
3. **Settings → Caching**: Keep default (Vercel managed)
4. **Analytics**: Enable to monitor performance

### 9.3 Monitoring & Logs

- **Supabase**: Logs available in **Database → Logs**
- **Vercel**: Logs available in **Deployments → Function Logs**
- Set up alerts for errors (optional)

---

## Phase 10: Troubleshooting

### Problem: "Supabase credentials not found"

**Solution**: Verify environment variables in Vercel:
1. Go to **Settings → Environment Variables**
2. Check all VITE_SUPABASE_* variables are set
3. Redeploy after changes

### Problem: "CORS error" when loading data

**Solution**: Supabase CORS is correctly configured for all origins.
1. Check browser console for actual error
2. Verify RLS policies allow read access
3. Check Supabase logs for SQL errors

### Problem: "Admin dashboard not accessible"

**Solution**: Verify admin user setup:
1. In Supabase Auth, check user has `is_admin = true`
2. Try logging out/in again
3. Check browser localStorage is not blocked

### Problem: Build fails on Vercel

**Solution**: Check build logs:
1. Click failed deployment
2. Scroll to "Build" section
3. Look for error messages
4. Common: Missing environment variables (recheck Phase 4.2)

### Problem: "Page not found" on custom domain

**Solution**: DNS propagation takes time:
1. Wait 24 hours for full propagation
2. Test with `https://your-domain.vercel.app` first
3. Check Vercel domain settings are complete
4. Verify DNS records point to Vercel IPs

---

## Phase 11: Maintenance & Updates

### 11.1 Regular Updates

```bash
# Update dependencies monthly
pnpm update

# Commit and push
git add package.json pnpm-lock.yaml
git commit -m "Update dependencies"
git push origin main
# Vercel auto-deploys
```

### 11.2 Database Backups

Supabase provides automatic daily backups. To restore:
1. Go to **Settings → Backups**
2. Select backup date
3. Click "Restore"

### 11.3 Monitor Admin Requests

Regularly check admin dashboard for:
- Pending user requests
- Platform metrics
- System health

---

## Summary

Your Brokerr platform is now:

✓ **Fully independent** - No Base44 or third-party SDKs
✓ **Production deployed** - On Vercel with auto-scaling
✓ **Secure** - Supabase RLS policies protect all data
✓ **Configurable** - Admin controls all settings
✓ **Scalable** - Can upgrade Supabase when needed

**Support**:
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Supabase docs: [supabase.com/docs](https://supabase.com/docs)
- React docs: [react.dev](https://react.dev)

---

**Happy deploying! 🚀**
