# Authentication System Setup

This document explains how to set up the authentication system with invite codes for admin/worker registration.

## Database Setup

### 1. Create the invite_codes table

Run the SQL migration in your Supabase SQL Editor:

```sql
-- See: Backend/create_invite_codes_table.sql
```

Or navigate to your Supabase Dashboard → SQL Editor and run the `create_invite_codes_table.sql` file.

### 2. Email Integration (TODO)

The invite code system currently logs codes to the console. To enable email sending:

#### Option A: Supabase Edge Function (Recommended)

1. Install Supabase CLI
2. Create an Edge Function:
```bash
supabase functions new send-invite-email
```

3. Use a service like Resend, SendGrid, or Mailgun in the function
4. Update `useInviteCodes.js` to call the Edge Function

#### Option B: External Email Service

1. Sign up for an email service (Resend, SendGrid, etc.)
2. Create an API endpoint to send emails
3. Update the `sendInviteCodeEmail` function in `useInviteCodes.js`

## How It Works

### Client Registration
- Simple flow: just fill out the form and submit
- No invite code required

### Admin/Worker Registration
1. User selects "Admin" or "Worker" role
2. User enters their email
3. User clicks "Request Invite Code"
4. System generates a 6-digit code
5. Code is sent to `ofoli.ephraim2008@gmail.com`
6. User receives code via email
7. User enters code and completes registration
8. Code is validated (must be unused and not expired)
9. Account is created with the selected role

### Code Expiration
- Codes expire 24 hours after creation
- Expired codes cannot be used
- Each code can only be used once

## Testing

### Test Client Registration
1. Go to `/register`
2. Select "Client" role
3. Fill out the form
4. Submit

### Test Admin/Worker Registration
1. Go to `/register`
2. Select "Admin" or "Worker" role
3. Enter email
4. Click "Request Invite Code"
5. Check console for the generated code (until email is set up)
6. Enter the code
7. Complete registration

## Security Notes

- Codes are 6 digits (100,000 - 999,999)
- Each code is unique
- Codes expire after 24 hours
- Codes can only be used once
- Row Level Security (RLS) is enabled on the invite_codes table
