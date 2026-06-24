# Email Verification Setup Guide

## Supabase Default SMTP Limitations

The Supabase default SMTP server has **strict restrictions**:

1. **Only delivers to emails in your Supabase Organization Team**
   - Go to Supabase Dashboard → Settings → Team
   - Add team members with their email addresses
   - Only these emails will receive verification emails

2. **Rate limited to ~3 emails/hour**

3. **Student emails (@stu.ucc.edu.gh, etc.) will NOT receive emails** unless added to Team

## For Development/Testing

**Option 1: Add test emails to Supabase Team (Recommended for quick testing)**
1. Supabase Dashboard → Settings → Team
2. Click "Invite member" → enter your test email
3. Accept invitation in email
4. Now verification emails will be delivered

**Option 2: Configure Custom SMTP (For production)**
1. Supabase Dashboard → Authentication → Settings → SMTP Settings
2. Enable "Custom SMTP"
3. Add credentials from:
   - **Resend** (recommended, free tier: 3,000 emails/month)
   - **SendGrid** (free tier: 100 emails/day)
   - **Mailgun** (free tier: 5,000 emails/month for 3 months)
   - **AWS SES** (free tier: 62,000 emails/month)

## Email Flows in This App

| Flow | Supabase Method | Verification Type | Description |
|------|----------------|-------------------|-------------|
| Email & Password Signup | `signUp()` | `signup` | Sends confirmation link |
| Email OTP Signup (passwordless) | `signInWithOtp(shouldCreateUser: true)` | `email` | Sends verification link |
| Email OTP Login (passwordless) | `signInWithOtp()` | `email` | Sends verification link |
| Password Login | `signInWithPassword()` | N/A | No email sent |

## Verification Link Behavior

All email verification flows send a **clickable link** (not a 6-digit code). The link redirects to:
- `uberforcleaning://auth/callback` (for signup confirmation)
- `uberforcleaning://auth/callback` (for passwordless login)

The app handles these via `auth/callback.tsx` and `(auth)/oauth-callback.tsx` which parse the token from the URL hash fragment.

## Testing Checklist

- [ ] Add your test email to Supabase Team
- [ ] Test Email & Password signup → check email → click link → app opens → redirected to home
- [ ] Test Email OTP signup → check email → click link → app opens → redirected to home  
- [ ] Test Email OTP login → check email → click link → app opens → redirected to home
- [ ] Test Password login → no email needed → redirected to home
- [ ] Test Google OAuth → role selector → redirected to home