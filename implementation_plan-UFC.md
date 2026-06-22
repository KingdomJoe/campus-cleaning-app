# Campus Cleaners Ghana — MVP (Phase 1) Implementation Plan

Migrating from a Node.js/Express web prototype to a production-grade **Expo + React Native** mobile application backed by **Supabase**.

## Background

The existing `campusclean-connect/` folder contains a working web prototype (Node.js + Express + SQLite + Socket.IO). The new mobile app will be built from scratch in `campus-cleaners-mobile/` using the PRD v2.0 tech stack while the old web app is preserved for reference.

---

## Decisions Made (from /grill-me)

| Decision | Choice |
|---|---|
| Admin Dashboard | Separate web app later; mobile app = Client + Cleaner only |
| Messaging | 3-second polling + push notifications (no WebSockets) |
| Dev workflow | Development Build (custom dev client) |
| UI library | React Native Paper (Material Design 3) |
| Navigation | Expo Router (file-based routing) |
| Payments | Mock/simulated payments first, Paystack integration later |
| Auth method | Phone OTP + Email OTP (both from start) |
| Project location | New `campus-cleaners-mobile/` directory alongside existing web app |
| Design theme | Dark theme with green/teal accents (Uber/Bolt aesthetic) |
| Supabase | User will provide URL + publishable key |
| State management | Zustand |

---

## User Review Required

> [!IMPORTANT]
> **Supabase credentials**: Before we can connect the app to the backend, you'll need to provide your Supabase project URL and publishable key. I'll set up a placeholder `.env` file that you can fill in.

> [!IMPORTANT]
> **Phone OTP provider**: Supabase Phone OTP requires a third-party SMS provider (e.g., Twilio, MessageBird). This costs ~$0.01–0.05/SMS. During development, Supabase allows you to use "test" OTP codes. We'll configure the app to work with test mode initially.

> [!WARNING]
> **Development Build**: To test push notifications and native modules (camera, image picker), you'll need to run `npx expo run:android` or use EAS Build. Expo Go alone won't support all features. Make sure you have Android Studio / an Android emulator set up, or a physical device with USB debugging.

---

## Proposed Changes

### Component 1: Project Initialization & Configuration

Summary: Create the Expo project, configure TypeScript, Expo Router, and install all dependencies.

#### [NEW] `campus-cleaners-mobile/` (Expo project root)

Created via `npx create-expo-app@latest campus-cleaners-mobile --template default --yes`

#### [NEW] `campus-cleaners-mobile/.env`

Environment variables:
```
EXPO_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

#### Dependencies to install

**Core:**
- `@supabase/supabase-js` — Supabase client
- `expo-sqlite` — SQLite-backed session storage for Supabase Auth
- `react-native-paper` — UI component library (Material Design 3)
- `react-native-safe-area-context` — Safe area handling (Paper dependency)
- `zustand` — State management

**Expo SDK modules:**
- `expo-image-picker` — Camera/gallery for before/after photos, profile pictures, Ghana Card
- `expo-notifications` — Push notifications
- `expo-location` — GPS for cleaner locations
- `expo-secure-store` — Secure token storage
- `expo-constants` — App constants/config

**Utilities:**
- `date-fns` — Date formatting/manipulation
- `react-native-vector-icons` — Icon set (Paper dependency)
- `@expo/vector-icons` — Expo-compatible icons
- `react-native-maps` or `react-native-map-libre` — Map display for booking locations

---

### Component 2: Supabase Backend Setup

Summary: Database schema (SQL migrations), Row Level Security policies, and storage buckets.

#### [NEW] `campus-cleaners-mobile/supabase/migrations/001_initial_schema.sql`

Tables to create (mapped from PRD Section 5):

**`profiles`** (extends Supabase auth.users)
- `id` UUID (FK → auth.users.id)
- `full_name`, `phone`, `email`, `ghana_card_number`
- `role` ENUM ('client', 'cleaner')
- `location`, `room_number`
- `avatar_url`
- `status` ENUM ('active', 'suspended')
- `created_at`, `updated_at`

**`cleaner_profiles`**
- `user_id` UUID (FK → profiles.id)
- `bio`, `skills` TEXT[]
- `availability` ENUM ('available', 'busy', 'offline')
- `mobile_money_number`
- `guarantor_name`, `guarantor_phone`
- `verification_status` ENUM ('pending', 'approved', 'rejected')
- `current_lat`, `current_lng`

**`cleaner_documents`**
- `id`, `cleaner_id` UUID
- `document_type` ENUM ('ghana_card', 'student_id', 'selfie', 'guarantor_doc')
- `file_url`, `uploaded_at`

**`service_types`** (seeded data)
- `id`, `category` ENUM ('cleaning', 'laundry')
- `name`, `description`, `base_price`

**`bookings`**
- `id`, `client_id`, `cleaner_id`
- `service_type_id`, `location`, `description`
- `scheduled_date`, `scheduled_time`
- `room_type`, `room_size`, `room_count`, `bathroom_included` (cleaning)
- `laundry_items` JSONB (laundry)
- `total_price`
- `status` ENUM ('requested', 'accepted', 'en_route', 'arrived', 'started', 'completed', 'verified', 'closed', 'cancelled', 'declined')
- `cancellation_reason`
- `created_at`, `updated_at`

**`booking_photos`**
- `id`, `booking_id`
- `photo_type` ENUM ('before', 'after')
- `file_url`, `uploaded_at`

**`messages`**
- `id`, `booking_id`, `sender_id`
- `message`, `image_url`
- `created_at`

**`reviews`**
- `id`, `booking_id`, `client_id`, `cleaner_id`
- `quality_rating`, `punctuality_rating`, `professionalism_rating`, `communication_rating`
- `overall_rating`, `comment`
- `created_at`

**`payments`**
- `id`, `booking_id`, `client_id`, `cleaner_id`
- `amount`, `platform_fee`, `cleaner_payout`
- `payment_method`, `payment_reference`
- `status` ENUM ('pending', 'held', 'released', 'refunded')
- `created_at`

**`notifications`**
- `id`, `user_id`
- `title`, `body`, `data` JSONB
- `read`, `created_at`

**`disputes`**
- `id`, `booking_id`, `raised_by`
- `type` ENUM ('no_show', 'poor_quality', 'property_damage', 'theft')
- `description`, `status` ENUM ('open', 'under_review', 'resolved')
- `resolution`, `created_at`

**`audit_logs`**
- `id`, `user_id`, `action`, `details` JSONB, `created_at`

#### [NEW] `campus-cleaners-mobile/supabase/migrations/002_rls_policies.sql`

Row Level Security policies for all tables ensuring:
- Clients can only read/write their own data
- Cleaners can only access their own profiles and assigned bookings
- Public read access for service types
- Messages scoped to booking participants only

#### [NEW] `campus-cleaners-mobile/supabase/migrations/003_seed_data.sql`

Seed data for:
- Service types (cleaning tiers + laundry items)
- Service areas (UCC Campus, Amamoma, Kwaprow, Ayensu)
- Demo accounts for testing

#### Supabase Storage Buckets:
- `avatars` — Profile pictures
- `documents` — Ghana Card, Student ID, selfie verification
- `booking-photos` — Before/after cleaning photos

---

### Component 3: App Architecture & Shared Code

Summary: Core utilities, Supabase client, auth store, theme configuration.

#### [NEW] `campus-cleaners-mobile/lib/supabase.ts`
Supabase client initialization with `expo-sqlite` storage driver.

#### [NEW] `campus-cleaners-mobile/lib/theme.ts`
React Native Paper custom dark theme with green/teal accents:
- Primary: `#00C896` (teal-green)
- Background: `#0D0D0D`
- Surface: `#1A1A2E`
- Accent: `#16213E`

#### [NEW] `campus-cleaners-mobile/stores/authStore.ts`
Zustand store for authentication state (user, session, role, loading).

#### [NEW] `campus-cleaners-mobile/stores/bookingStore.ts`
Zustand store for booking flow state.

#### [NEW] `campus-cleaners-mobile/stores/notificationStore.ts`
Zustand store for notification state and unread count.

#### [NEW] `campus-cleaners-mobile/lib/api/` directory
API helper modules for each domain:
- `auth.ts` — Login, register, verify OTP
- `bookings.ts` — CRUD + status transitions
- `messages.ts` — Send/fetch messages (polling)
- `reviews.ts` — Submit/fetch reviews
- `payments.ts` — Mock payment initiation/verification
- `notifications.ts` — Fetch/mark-read notifications
- `uploads.ts` — Image upload helpers (Supabase Storage)

---

### Component 4: Authentication Screens (Module 1)

Summary: OTP-based login/registration flow for clients and cleaners.

#### [NEW] `campus-cleaners-mobile/app/index.tsx`
Landing/splash screen → redirect to auth or home based on session.

#### [NEW] `campus-cleaners-mobile/app/(auth)/_layout.tsx`
Auth group layout (no bottom tabs, clean stack).

#### [NEW] `campus-cleaners-mobile/app/(auth)/welcome.tsx`
Welcome screen with app branding, "Get Started" CTA.

#### [NEW] `campus-cleaners-mobile/app/(auth)/login.tsx`
Phone/email input → send OTP → verify OTP screen.

#### [NEW] `campus-cleaners-mobile/app/(auth)/verify-otp.tsx`
OTP code input (6-digit), countdown timer, resend logic.

#### [NEW] `campus-cleaners-mobile/app/(auth)/register.tsx`
Role selection (Client or Cleaner) → registration form.

#### [NEW] `campus-cleaners-mobile/app/(auth)/register-client.tsx`
Client registration: Full Name, Phone, Email, Ghana Card Number, Location.

#### [NEW] `campus-cleaners-mobile/app/(auth)/register-cleaner.tsx`
Cleaner registration: Full Name, Phone, Email, Ghana Card upload, Student ID upload (optional), Guarantor info, Mobile Money number, Profile photo.

---

### Component 5: Client App (Modules 3, 4, 5, 6, 7, 8, 10, 11, 12, 17)

Summary: Client-facing screens for booking, tracking, messaging, and reviewing.

#### [NEW] `campus-cleaners-mobile/app/(client)/_layout.tsx`
Tab layout: Home | Bookings | Messages | Profile

#### [NEW] `campus-cleaners-mobile/app/(client)/home.tsx`
Dashboard: Service catalogue cards (Cleaning / Laundry), nearby cleaners, active booking banner.

#### [NEW] `campus-cleaners-mobile/app/(client)/book/index.tsx`
Service selection: Cleaning tiers or Laundry options.

#### [NEW] `campus-cleaners-mobile/app/(client)/book/cleaning.tsx`
Cleaning booking form: Room type, size, count, bathroom toggle, date/time picker, location input.

#### [NEW] `campus-cleaners-mobile/app/(client)/book/laundry.tsx`
Laundry booking form: Item checkboxes with quantity inputs, date/time, location.

#### [NEW] `campus-cleaners-mobile/app/(client)/book/summary.tsx`
Booking summary with price breakdown and "Confirm & Pay" (mock).

#### [NEW] `campus-cleaners-mobile/app/(client)/bookings/index.tsx`
List of all bookings (active, past) with status chips.

#### [NEW] `campus-cleaners-mobile/app/(client)/bookings/[id].tsx`
Booking detail: Status timeline, cleaner info, chat button, before/after photos, rate button, cancel button.

#### [NEW] `campus-cleaners-mobile/app/(client)/bookings/[id]/chat.tsx`
Chat screen (polling-based, push notification triggered).

#### [NEW] `campus-cleaners-mobile/app/(client)/bookings/[id]/rate.tsx`
Rating form: Quality, Punctuality, Professionalism, Communication (1-5 stars each) + comment.

#### [NEW] `campus-cleaners-mobile/app/(client)/messages.tsx`
Conversations list (grouped by booking).

#### [NEW] `campus-cleaners-mobile/app/(client)/profile.tsx`
Profile view/edit, logout.

#### [NEW] `campus-cleaners-mobile/app/(client)/find-cleaner.tsx`
Search/browse cleaners by rating, availability, skills, distance.

---

### Component 6: Cleaner App (Modules 2, 8, 11, 14, 15, 17)

Summary: Cleaner-facing screens for managing jobs, uploading photos, chatting with clients.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/_layout.tsx`
Tab layout: Jobs | Messages | Earnings | Profile

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/jobs/index.tsx`
Available jobs (new requests) + active jobs + completed jobs tabs.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/jobs/[id].tsx`
Job detail: Status controls (Accept → En Route → Arrived → Started → Completed), before/after photo upload, chat button.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/jobs/[id]/chat.tsx`
Chat with client (shared chat component).

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/jobs/[id]/photos.tsx`
Before/after photo capture and upload screen.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/messages.tsx`
Conversations list.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/earnings.tsx`
Earnings dashboard: Available balance, pending, total, history.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/profile.tsx`
Profile view/edit, availability toggle, working hours, verification status badge.

#### [NEW] `campus-cleaners-mobile/app/(cleaner)/schedule.tsx`
Availability scheduling: Working hours, unavailable days, pause toggle.

---

### Component 7: Shared Components

Summary: Reusable UI components used across both client and cleaner interfaces.

#### [NEW] `campus-cleaners-mobile/components/`

- `ChatBubble.tsx` — Message bubble component
- `ChatInput.tsx` — Message input bar with image attachment
- `BookingCard.tsx` — Booking list item card
- `CleanerCard.tsx` — Cleaner profile card (for search/browse)
- `StatusBadge.tsx` — Booking status chip with color coding
- `StatusTimeline.tsx` — Visual booking lifecycle timeline
- `StarRating.tsx` — Interactive star rating input
- `OTPInput.tsx` — 6-digit OTP code input
- `PhotoUpload.tsx` — Camera/gallery photo picker and upload
- `PriceBreakdown.tsx` — Price summary table
- `EmptyState.tsx` — Empty list placeholder
- `LoadingScreen.tsx` — Full-screen loading spinner
- `NotificationBell.tsx` — Header notification icon with badge

---

### Component 8: Push Notifications (Module 17)

Summary: Expo push notification registration, handling, and display.

#### [NEW] `campus-cleaners-mobile/lib/notifications.ts`

- Register for push notifications
- Store Expo push token in Supabase `profiles.push_token`
- Handle incoming notifications (foreground + background)
- Navigation on tap (deep link to booking detail)

---

## Verification Plan

### Automated Tests
- `npx expo-doctor` — Verify all dependency versions are compatible
- TypeScript compilation check: `npx tsc --noEmit`

### Manual Verification
1. **Auth flow**: Register as client → receive OTP → verify → land on client dashboard
2. **Booking flow**: Select service → fill form → see price → confirm → booking appears in list
3. **Cleaner flow**: See available job → accept → update status → upload photos → mark complete
4. **Messaging**: Client sends message → cleaner receives notification → polls and sees message
5. **Rating**: After booking completion, client rates cleaner on 4 categories
6. **Notifications**: Booking status changes trigger push notifications to the other party

### Build Verification
- `npx expo run:android` — Verify development build compiles and runs on emulator/device
- `npx expo start` — Verify metro bundler starts without errors

---

## Implementation Order

The build will follow the PRD's recommended milestone order:

```
1. Project Setup & Supabase Config        (~30 min)
2. Authentication (Auth screens + flow)   (~2 hrs)
3. Cleaner Verification (document upload) (~1 hr)
4. Booking Flow (client side)             (~3 hrs)
5. Job Management (cleaner side)          (~2 hrs)
6. Messaging (polling + notifications)    (~2 hrs)
7. Payments (mock escrow flow)            (~1 hr)
8. Ratings & Reviews                      (~1 hr)
9. Before/After Photos                    (~1 hr)
10. Push Notifications                    (~1 hr)
11. Polish & Testing                      (~2 hrs)
```
