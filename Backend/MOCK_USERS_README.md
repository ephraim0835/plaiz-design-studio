# Mock User Seed Guide

This guide will help you populate your database with realistic mock accounts for testing all user roles and system flows.

## 📋 Overview

The seed process creates:
- **1 Admin Account** - Full system access
- **5 Worker Accounts** - Different skills, availability, and stats
- **5 Client Accounts** - For testing client flows

## 🎯 Mock Accounts Created

### Admin Account
- **Email:** admin@test.com
- **Password:** Admin123!
- **Role:** admin
- **Status:** Verified, Active

### Worker Accounts

| Email | Name | Role | Skills | Status | Projects | Rating | Probation |
|-------|------|------|--------|--------|----------|--------|-----------|
| worker1@test.com | Sarah Martinez | Graphic Designer | Graphics, Logo Design, Branding | ✅ Available, Verified | 0/3 | 4.8 | No |
| worker2@test.com | James Chen | Web Designer | Web Dev, React, Frontend | ✅ Available, Verified | 1/3 | 4.6 | No |
| worker3@test.com | Emily Rodriguez | Graphic Designer | UI/UX, Figma, Research | ❌ Busy, Verified | 3/3 | 4.9 | No |
| worker4@test.com | Michael Thompson | Graphic Designer | Video Editing, Motion Graphics | ⚠️ Available, **Not Verified** | 0/3 | 5.0 | Yes |
| worker5@test.com | Olivia Parker | Graphic Designer | Copywriting, Content, SEO | ⚠️ Available, Verified, **On Probation** | 0/2 | 4.3 | Yes |

**Password for all workers:** Worker123!

### Client Accounts

| Email | Name | Status |
|-------|------|--------|
| client1@test.com | David Anderson | Verified |
| client2@test.com | Jennifer Lee | Verified |
| client3@test.com | Robert Williams | Verified |
| client4@test.com | Maria Garcia | Verified |
| client5@test.com | Thomas Brown | Verified |

**Password for all clients:** Client123!

## 🚀 Installation Steps

### Option 1: Automated (Recommended)

#### Step 1: Add Service Role Key to .env

Add this line to your `.env` file:
```env
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

> **Where to find it:** Supabase Dashboard → Project Settings → API → `service_role` key (secret)

#### Step 2: Run the Auth User Creation Script

```bash
node Backend/create_auth_users.js
```

This will create all auth.users accounts in Supabase.

#### Step 3: Run the SQL Seed Script

In Supabase SQL Editor, run:
```sql
-- Copy and paste the contents of Backend/seed_mock_users.sql
```

Or use the Supabase CLI:
```bash
supabase db execute -f Backend/seed_mock_users.sql
```

### Option 2: Manual (Supabase Dashboard)

If you prefer to create users manually or don't have the service role key:

#### Step 1: Create Auth Users Manually

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User" for each account
3. Use the emails and passwords from the tables above
4. **Important:** Copy each user's UUID after creation

#### Step 2: Update SQL Script with UUIDs

1. Open `Backend/seed_mock_users.sql`
2. Replace the placeholder UUIDs with the actual UUIDs from Step 1:
   - Replace `'00000000-0000-0000-0000-000000000001'` with admin's UUID
   - Replace `'00000000-0000-0000-0000-000000000011'` with worker1's UUID
   - And so on...

#### Step 3: Run the SQL Script

In Supabase SQL Editor, paste and run the updated `seed_mock_users.sql` script.

## ✅ Verification

After running the scripts, verify the data was created correctly:

### Check User Count
```sql
SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admins,
    COUNT(CASE WHEN role IN ('graphic_designer', 'web_designer') THEN 1 END) as workers,
    COUNT(CASE WHEN role = 'client' THEN 1 END) as clients
FROM public.profiles
WHERE email LIKE '%@test.com';
```

Expected result: 11 total users (1 admin, 5 workers, 5 clients)

### Check Worker Stats
```sql
SELECT 
    p.email,
    p.is_verified,
    p.is_available,
    ws.active_projects,
    ws.max_projects_limit,
    ws.is_probation,
    ws.average_rating
FROM public.profiles p
LEFT JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.email LIKE 'worker%@test.com'
ORDER BY p.email;
```

You should see 5 workers with their respective stats.

## 🧪 Testing Scenarios

Now you can test various flows:

### 1. **Admin Dashboard**
- Login as: admin@test.com
- Test: View all users, manage projects, system settings

### 2. **Worker Assignment Logic**
- Worker1 (Sarah) should be assigned first (0 active projects, high rating)
- Worker2 (James) should be assigned next (1 active project)
- Worker3 (Emily) should NOT be assigned (busy/unavailable)
- Worker4 (Michael) should NOT be assigned (unverified)
- Worker5 (Olivia) might be restricted (on probation)

### 3. **Client Project Creation**
- Login as any client (client1-5@test.com)
- Create a new project
- Verify auto-assignment works correctly

### 4. **Worker Dashboard**
- Login as worker1@test.com or worker2@test.com
- View assigned projects
- Test availability toggle
- Update profile/stats

### 5. **Messaging System**
- Login as client1@test.com
- Send message to admin or assigned worker
- Login as worker/admin to verify message received

### 6. **Gallery & Portfolio**
- Login as worker1@test.com
- Upload portfolio items
- Verify visibility settings

## 🔄 Reset/Cleanup

To remove all test data and start fresh:

```sql
-- Delete worker stats
DELETE FROM public.worker_stats 
WHERE worker_id IN (
    SELECT id FROM public.profiles WHERE email LIKE '%@test.com'
);

-- Delete profiles
DELETE FROM public.profiles WHERE email LIKE '%@test.com';

-- Delete auth users (do this in Supabase Dashboard → Authentication → Users)
-- Or use the Admin API to delete them programmatically
```

## 📝 Notes

- **UUIDs:** The script uses predictable UUIDs for easy reference. In production, use generated UUIDs.
- **Passwords:** All passwords follow the pattern: `[Role]123!` (e.g., Admin123!, Worker123!, Client123!)
- **Email Confirmation:** Auth users are created with `email_confirm: true` to skip verification emails
- **Worker Stats:** Each worker has realistic stats (projects, ratings, availability) for testing assignment logic
- **Probation:** Worker4 and Worker5 are on probation to test filtering logic

## 🆘 Troubleshooting

### "User already exists" error
- This is normal if re-running the script
- The script will skip existing users
- To recreate, delete the user first from Supabase Dashboard

### "Service role key invalid"
- Make sure you copied the `service_role` key, not the `anon` key
- Check that `.env` file is in the project root
- Restart your terminal/script after updating `.env`

### "Profile not found" after login
- Make sure you ran the SQL script AFTER creating auth users
- Check that UUIDs match between auth.users and profiles table
- Verify the `handle_new_user()` trigger is working

### Worker not being assigned
- Check `is_verified = true`
- Check `is_available = true`
- Check `active_projects < max_projects_limit`
- Check `is_probation = false` (if your logic filters probation)

## 🎉 Success!

If everything worked correctly, you should now be able to:
- ✅ Login with any of the 11 test accounts
- ✅ See role-specific dashboards
- ✅ Test worker assignment logic
- ✅ Test messaging between users
- ✅ Test project creation and management
- ✅ Test all system flows end-to-end

Happy testing! 🚀
