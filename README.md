# Campus Cleaning App (Uber for Cleaning)

A premium, interactive multi-portal campus service platform connecting university students/clients with professional campus cleaners. The application consists of a mobile client/cleaner platform, an administrative verification dashboard, and a supporting synchronization service.

---

## 🏗️ Project Architecture

The workspace is structured into three main directories:

1. **`campus-cleaners-mobile/`**: The core cross-platform mobile application built using **React Native**, **Expo (Router, SQLite, SecureStore, Notifications)**, and **React Native Paper**. It integrates **Supabase** for database, storage, and authentication.
2. **`campusclean-admin/`**: A administrative dashboard built with **Next.js** and **TailwindCSS** for verification document reviews, cleaner onboarding, and platform activity monitoring.
3. **`campusclean-connect/`**: A Node.js and Express database bridge used for seeding test cases and testing webhook triggers locally.

---

## 🚀 Key Features

### 1. Client Workflow
- **Service Selection**: Order cleaning services (by room size, bathroom addition, custom description) or laundry services (item count, type).
- **Location Picker**: Interactive MapLibre-based maps for pinning client hostel/location details.
- **Booking Summary & Escrow**: Reviews booking specifications and holds funds in escrow during the job lifecycle.
- **Bid Selection**: Clients see a list of applied cleaners (with star ratings, completed job counts, biography, and photos) and hire or decline them.
- **Ratings & Reviews**: Post-service rating and review submissions.

### 2. Cleaner Workflow
- **Job Board**: Real-time listing of unassigned bookings (`status = 'requested'`) nearby.
- **Bidding / Application**: One-tap offer application which posts to the client's booking details screen.
- **Job Status Cycles**: Cleaners manage jobs using status transitions: `accepted` ➔ `en_route` ➔ `arrived` ➔ `started` ➔ `completed`.
- **Photo Verification**: Upload before-and-after verification photos during cleaning.
- **Real-Time Chat**: Direct channel-based chat between assigned cleaner and client (polling-synchronized).

### 3. Verification & Profile Settings
- **Ghana Document Uploads**: Onboarding cleaners upload Ghana Card scans and a selfie verification.
- **Ghana Phone Formatters**: Settings page automatically cleans, formats, and validates Ghana mobile numbers (`+233...`) to prevent database key conflicts.
- **Auto-Pending Verification**: Re-entering verification files triggers admin review flags.

---

## 🔑 Quick Test Accounts
Use these pre-seeded profiles on the login screen for quick multi-portal testing. All test accounts share the password: `Password123!`.

### Client Profiles
- **Kwame (C1)**: `client1@gmail.com`
- **Abena (C2)**: `client2@gmail.com`
- **Kofi (C3)**: `client3@gmail.com`

### Cleaner Profiles
- **Emmanuel (Cl1)**: `cleaner1@gmail.com`
- **Ama (Cl2)**: `cleaner2@gmail.com`
- **Yaw (Cl3)**: `cleaner3@gmail.com`

---

## 🛠️ Installation & Setup

### Supabase Database Setup
Ensure migrations are executed in order against your Supabase project:
```bash
cd campus-cleaners-mobile/supabase
# Apply schema tables, triggers, and seed users
supabase db push
```

### Running the Mobile App
1. Install dependencies:
   ```bash
   cd campus-cleaners-mobile
   npm install
   ```
2. Start the Expo development server:
   ```bash
   npx expo start
   ```

### Packaging & Build (EAS Build)
To trigger an Android APK build for preview and testing:
```bash
eas build --profile preview --platform android
```

---

## 🛡️ Database Schema & Triggers
The Postgres database on Supabase operates with Row Level Security (RLS) policies:
- **`profiles`**: Stores full names, emails, roles, and phones.
- **`cleaner_profiles`**: Tracks work biography, mobile money numbers, skills, and admin verification status.
- **`bookings`**: Job details, price, status, location coordinates.
- **`booking_applications`**: Bids made by cleaners on active bookings.
- **`handle_new_user()` trigger**: Automatically creates a record in `profiles` and `cleaner_profiles` on registration, parsing metadata fields for both OAuth (`raw_user_meta_data`) and standard credentials (`user_metadata`).
