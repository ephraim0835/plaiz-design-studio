# Mock User Seed - Quick Reference

## 📦 Files Created

1. **`seed_mock_users.sql`** - SQL script to populate profiles and worker_stats
2. **`create_auth_users.js`** - Node.js script to create Supabase auth users
3. **`MOCK_USERS_README.md`** - Comprehensive guide with instructions

## 🚀 Quick Start (2 Steps)

### Step 1: Create Auth Users
```bash
# Add to .env first:
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

node Backend/create_auth_users.js
```

### Step 2: Seed Database
Run `Backend/seed_mock_users.sql` in Supabase SQL Editor

## 📧 Login Credentials

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@test.com | Admin123! |
| **Workers** | worker1-5@test.com | Worker123! |
| **Clients** | client1-5@test.com | Client123! |

## 👥 Mock Users Summary

### 🔑 Admin (1)
- admin@test.com - Full system access

### 👨‍💼 Workers (5)
1. **worker1@test.com** - Sarah Martinez (Graphics) - ✅ Available, 0 projects, 4.8★
2. **worker2@test.com** - James Chen (Web Dev) - ✅ Available, 1 project, 4.6★
3. **worker3@test.com** - Emily Rodriguez (UI/UX) - ❌ Busy, 3 projects, 4.9★
4. **worker4@test.com** - Michael Thompson (Video) - ⚠️ Unverified, 0 projects
5. **worker5@test.com** - Olivia Parker (Writing) - ⚠️ On Probation, 0 projects

### 👤 Clients (5)
- client1@test.com - David Anderson
- client2@test.com - Jennifer Lee
- client3@test.com - Robert Williams
- client4@test.com - Maria Garcia
- client5@test.com - Thomas Brown

## 🧪 What You Can Test

✅ **Admin Dashboard** - User management, system settings
✅ **Worker Assignment** - Load balancing, verification filters
✅ **Worker Dashboard** - Project view, availability toggle
✅ **Client Dashboard** - Project creation, messaging
✅ **Messaging System** - Real-time chat between roles
✅ **Gallery/Portfolio** - Worker portfolio uploads
✅ **Probation Logic** - Worker5 has restrictions
✅ **Verification Filter** - Worker4 is unverified
✅ **Availability Logic** - Worker3 is busy/unavailable

## 📊 Worker Stats Breakdown

| Worker | Available | Verified | Probation | Projects | Limit | Rating |
|--------|-----------|----------|-----------|----------|-------|--------|
| Worker1 | ✅ | ✅ | ❌ | 0 | 3 | 4.8 |
| Worker2 | ✅ | ✅ | ❌ | 1 | 3 | 4.6 |
| Worker3 | ❌ | ✅ | ❌ | 3 | 3 | 4.9 |
| Worker4 | ✅ | ❌ | ✅ | 0 | 3 | 5.0 |
| Worker5 | ✅ | ✅ | ✅ | 0 | 2 | 4.3 |

## 🎯 Expected Assignment Order

When a new project is created:
1. **Worker1** (Sarah) - Best choice: Available, verified, no projects, high rating
2. **Worker2** (James) - Second choice: Available, verified, 1 project
3. ~~Worker3~~ - Skipped: Busy/unavailable
4. ~~Worker4~~ - Skipped: Not verified
5. ~~Worker5~~ - May be skipped: On probation (depends on your logic)

## 🔍 Verification Queries

### Check all test users
```sql
SELECT email, role, is_verified, is_available 
FROM public.profiles 
WHERE email LIKE '%@test.com'
ORDER BY role, email;
```

### Check worker stats
```sql
SELECT p.email, ws.active_projects, ws.max_projects_limit, 
       ws.is_probation, ws.average_rating
FROM public.profiles p
JOIN public.worker_stats ws ON p.id = ws.worker_id
WHERE p.email LIKE 'worker%@test.com'
ORDER BY p.email;
```

## 🆘 Common Issues

**Issue:** "User already exists"
**Solution:** Normal if re-running. Script will skip existing users.

**Issue:** "Profile not found after login"
**Solution:** Run SQL script AFTER creating auth users.

**Issue:** "Service role key invalid"
**Solution:** Use `service_role` key from Supabase Dashboard → Settings → API

## 📚 Full Documentation

See `MOCK_USERS_README.md` for:
- Detailed installation steps
- Manual setup instructions
- Troubleshooting guide
- Testing scenarios
- Cleanup procedures

---

**Created:** Mock user seed system for Plaiz Design Studio
**Purpose:** Enable comprehensive testing of all user roles and system flows
**Status:** Ready to use - No changes to existing logic
