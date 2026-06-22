# Campus Cleaners Ghana — MVP Walkthrough

## Overview

The Campus Cleaners Ghana MVP is a **React Native / Expo** mobile app with a **Supabase** backend. It serves two user roles:

- **Clients** — Book cleaning and laundry services from verified campus cleaners
- **Cleaners** — Accept jobs, track status through completion, earn money

## Architecture Summary

| Layer | Technology |
|---|---|
| **Frontend** | React Native + Expo SDK 53 |
| **Routing** | Expo Router (file-based) |
| **UI Framework** | React Native Paper (Material Design 3) |
| **State Management** | Zustand |
| **Backend** | Supabase (PostgreSQL + Auth + Storage) |
| **Auth** | Phone OTP + Email OTP via Supabase |
| **Payments** | Mock escrow (Paystack integration deferred) |
| **Theme** | Custom dark theme with teal-green (#00C896) accent |

## File Structure (53 source files)

```
src/
├── app/
│   ├── _layout.tsx              # Root: PaperProvider + auth init
│   ├── index.tsx                # Splash → redirect by role
│   ├── (auth)/                  # 7 screens
│   │   ├── _layout.tsx
│   │   ├── welcome.tsx          # Onboarding with features
│   │   ├── login.tsx            # Phone/Email toggle + OTP
│   │   ├── verify-otp.tsx       # 6-digit OTP with auto-submit
│   │   ├── register.tsx         # Role selection cards
│   │   ├── register-client.tsx  # Client form
│   │   └── register-cleaner.tsx # Cleaner form + skills + guarantor
│   ├── (client)/                # 14 screens
│   │   ├── _layout.tsx          # Tab bar: Home/Book/Bookings/Messages/Profile
│   │   ├── home.tsx             # Dashboard + service grid
│   │   ├── messages.tsx         # Conversation list
│   │   ├── profile.tsx          # User info + sign out
│   │   ├── book/
│   │   │   ├── _layout.tsx
│   │   │   ├── index.tsx        # Service catalogue
│   │   │   ├── cleaning.tsx     # Room type/size/count form
│   │   │   ├── laundry.tsx      # Item checklist + quantities
│   │   │   └── summary.tsx      # Review + confirm + price calc
│   │   └── bookings/
│   │       ├── _layout.tsx
│   │       ├── index.tsx        # Active/Past tabs
│   │       ├── [id].tsx         # Detail + verify/cancel/chat
│   │       └── [id]/
│   │           ├── chat.tsx     # Real-time chat (3s polling)
│   │           └── rate.tsx     # 4-category star rating
│   └── (cleaner)/               # 9 screens
│       ├── _layout.tsx          # Tab bar: Jobs/Messages/Earnings/Profile
│       ├── messages.tsx         # Conversation list
│       ├── earnings.tsx         # Available/Pending/Total + history
│       ├── profile.tsx          # Verification badge + skills + rating
│       └── jobs/
│           ├── _layout.tsx
│           ├── index.tsx        # Available/Active/Completed tabs
│           ├── [id].tsx         # Status transitions + accept/decline
│           └── [id]/
│               ├── chat.tsx     # Chat with client
│               └── photos.tsx   # Before/after photo upload
├── components/                  # 6 shared components
│   ├── BookingCard.tsx
│   ├── EmptyState.tsx
│   ├── StarRating.tsx
│   ├── StatusBadge.tsx
│   ├── LoadingScreen.tsx
│   └── NotificationBell.tsx
├── stores/                      # 3 Zustand stores
│   ├── authStore.ts
│   ├── bookingStore.ts
│   └── notificationStore.ts
├── lib/
│   ├── supabase.ts              # Client init with expo-sqlite
│   ├── database.types.ts        # 15 TypeScript interfaces
│   ├── theme.ts                 # 40+ design tokens
│   ├── notifications.ts         # Push notification setup
│   └── api/
│       ├── messages.ts          # Chat CRUD + polling
│       ├── reviews.ts           # 4-category review submission
│       ├── payments.ts          # Escrow lifecycle + earnings
│       └── uploads.ts           # Camera/gallery → Supabase Storage
└── supabase/migrations/
    ├── 001_initial_schema.sql   # 12 tables + triggers + indexes
    ├── 002_rls_policies.sql     # Row Level Security for all tables
    └── 003_seed_data.sql        # 6 service types
```

## Key Flows

### Client Flow
1. **Welcome** → Login (phone/email) → OTP → redirect to Client Home
2. **Home** shows greeting + active bookings + service grids
3. **Book** → Select service → Fill details → Review summary → Confirm
4. **Bookings** → View active/past → Tap for detail → Chat / Verify / Rate
5. **Messages** → View conversations → Tap to open chat

### Cleaner Flow
1. **Welcome** → Register → Skills/guarantor/MoMo → OTP → pending verification
2. **Jobs** → Available (accept/decline) → Active (status: en route → arrived → started → completed)
3. **Photos** → Upload before/after photos during job
4. **Earnings** → Available / Pending / Total with payment history
5. **Profile** → Verification badge + bio + skills + rating

### Booking Lifecycle
```
requested → accepted → en_route → arrived → started → completed → verified → closed
     ↓                                                                    ↓
  declined                                                           (review)
     ↓
  cancelled
```

## Database

12 PostgreSQL tables with RLS policies:
- `profiles`, `cleaner_profiles`, `cleaner_documents`
- `service_types`, `bookings`, `booking_photos`
- `messages`, `reviews`, `payments`
- `notifications`, `disputes`, `audit_logs`

Auto-triggers: profile creation on signup, `updated_at` timestamps.

## Remaining Manual Steps

> [!IMPORTANT]
> You need to run the SQL migrations in your Supabase dashboard before the app can function.

1. **Supabase SQL Editor** — Run the 3 migration files in order:
   - [001_initial_schema.sql](file:///c:/Users/PulPiT/Campus-Cleaning-App-main/campus-cleaners-mobile/supabase/migrations/001_initial_schema.sql)
   - [002_rls_policies.sql](file:///c:/Users/PulPiT/Campus-Cleaning-App-main/campus-cleaners-mobile/supabase/migrations/002_rls_policies.sql)
   - [003_seed_data.sql](file:///c:/Users/PulPiT/Campus-Cleaning-App-main/campus-cleaners-mobile/supabase/migrations/003_seed_data.sql)

2. **Supabase Storage** — Create 3 public buckets:
   - `avatars`
   - `documents`
   - `booking-photos`

3. **Test on device** — Run `npx expo start` and scan QR code with Expo Go
