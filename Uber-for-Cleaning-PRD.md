Below is the consolidated **Production PRD v2.0** for Campus Cleaners Ghana (Uber for Cleaning), incorporating:

* Original requirements
* Business plan requirements 
* Missing critical features
* MVP prioritization
* Revised Tech Stack V2
* Production architecture
* Cost-conscious implementation strategy
* Future scalability roadmap

---

# CAMPUS CLEANERS GHANA

## Product Requirements Document (PRD) v2.0

### Product Name

Campus Cleaners Ghana

### Product Type

On-Demand Cleaning & Laundry Marketplace Platform

### Platform

Mobile-First

### Initial Target Market

* University of Cape Coast Students
* Lecturers
* University Staff
* Local Residents

### Long-Term Vision

Become the leading campus-focused service marketplace across Ghana and West Africa. 

---

# 1. Product Vision

Campus Cleaners Ghana is a mobile-first marketplace connecting clients with verified cleaners and laundry service providers through a secure booking, payment, and communication platform.

The platform focuses on:

* Trust
* Convenience
* Affordability
* Safety
* Job creation

---

# 2. Core User Types

## Client

Can:

* Register account
* Book cleaning services
* Book laundry services
* Track requests
* Chat with providers
* Pay securely
* Rate providers

---

## Cleaner

Can:

* Create cleaner profile
* Upload verification documents
* Accept jobs
* Chat with clients
* Upload completion photos
* Receive payouts

---

## Admin

Can:

* Verify cleaners
* Review disputes
* Manage users
* Manage payments
* Monitor fraud
* Generate reports

---

# 3. Technology Stack (Version 2)

## Mobile Frontend

### Expo

### React Native

### TypeScript

Reason:

* Fast development
* Android-first
* OTA updates
* Lower development cost
* Strong ecosystem

---

## Backend Platform

### Supabase

Used for:

* Database
* Authentication
* Storage
* APIs

Reason:

* PostgreSQL
* Fast development
* Open-source friendly
* Low operational overhead

---

## Database

### PostgreSQL (Supabase)

Stores:

* Users
* Cleaners
* Bookings
* Messages
* Reviews
* Payments
* Audit Logs

---

## Authentication

### Supabase Auth

Methods:

* Phone OTP
* Email OTP

No passwords required for MVP.

---

## Messaging System

### Supabase Database

### Expo Push Notifications

### 3-Second Polling Strategy

Workflow:

Message Sent

↓

Stored in PostgreSQL

↓

Recipient receives push notification

↓

Client polls every 3 seconds

↓

Messages appear

Advantages:

* No WebSockets
* No Realtime Costs
* Production-ready
* Near real-time experience

---

## Storage

### Supabase Storage

Stores:

* Ghana Card Images
* Student IDs
* Before Cleaning Photos
* After Cleaning Photos
* Profile Pictures

---

## Maps

### MapLibre

### OpenStreetMap

Used for:

* Booking Locations
* Cleaner Locations
* Distance Matching

Reason:

* Free
* Open Source
* No Google billing concerns

---

## Payments

### Paystack (Primary)

Future Option:

* Hubtel

Supports:

* MTN Mobile Money
* Telecel Cash
* AirtelTigo Money

---

## Notifications

### Expo Push Notifications

Events:

* Booking Updates
* New Messages
* Cleaner Arrival
* Job Completion

---

## Monitoring

### [Sentry](https://sentry.io?utm_source=chatgpt.com)

Used for:

* Error Tracking
* Crash Reporting

---

## Analytics

### [PostHog](https://posthog.com?utm_source=chatgpt.com)

Tracks:

* User Growth
* Bookings
* Retention
* Conversion Rates

---

## DNS & Security

### [Cloudflare](https://www.cloudflare.com?utm_source=chatgpt.com)

Used for:

* SSL
* DNS
* DDoS Protection
* Rate Limiting

---

## Domain Provider

### [Namecheap](https://www.namecheap.com?utm_source=chatgpt.com)

---

# 4. Functional Requirements

# MODULE 1

## Authentication & User Accounts

### Client Registration

Fields:

* Full Name
* Phone Number
* Email
* Ghana Card Number
* Location

Requirements:

* Unique Phone Number
* Unique Email
* OTP Verification

---

### Cleaner Registration

Fields:

* Full Name
* Phone Number
* Email
* Ghana Card
* Student ID (Optional)
* Guarantor Information
* Mobile Money Number
* Profile Photo

Status:

* Pending
* Approved
* Rejected

---

# MODULE 2

## Cleaner Verification Workflow

Admin verifies:

* Ghana Card
* Student ID
* Selfie Verification
* Guarantor Information

Cleaner cannot receive jobs until approved.

---

# MODULE 3

## Service Catalogue

### Cleaning

* Express Touch-Up
* Deep Scrub
* Move-In / Move-Out

### Laundry

* Wash Only
* Wash & Iron
* Iron Only

---

# MODULE 4

## Booking System

Client chooses:

* Service Type
* Location
* Date
* Time

---

### Cleaning Bookings

Input:

* Room Type
* Room Size
* Number of Rooms
* Bathroom Included

---

### Laundry Bookings

Checkboxes:

* Shirts
* T-Shirts
* Jeans
* Trousers
* Dresses
* Hoodies
* Curtains
* Bedsheets

Quantity required.

---

# MODULE 5

## Pricing Engine

Cleaning Pricing Based On:

* Service Tier
* Room Size
* Room Count

Laundry Pricing Based On:

* Item Type
* Quantity

---

# MODULE 6

## Booking Matching Engine

System matches using:

* Distance
* Availability
* Cleaner Rating
* Service Type

Radius:

2 km initially.

---

# MODULE 7

## Messaging & Communication

Features:

* One-to-One Chat
* Push Notifications
* Image Sharing
* Service Updates

Implementation:

Supabase + Push Notifications + Polling

---

# MODULE 8

## Job Lifecycle

Statuses:

* Requested
* Accepted
* Cleaner En Route
* Arrived
* Started
* Completed
* Verified
* Closed

---

# MODULE 9

## Escrow Payment System

Flow:

Client Payment

↓

Escrow

↓

Work Completed

↓

Client Verification

↓

Release Payment

Distribution:

* 80% Cleaner
* 20% Platform

---

# MODULE 10

## Dual Completion Verification

Cleaner:

✓ Work Completed

Client:

✓ Work Verified

Payment only releases after both confirmations.

---

# MODULE 11

## Before & After Verification

Cleaner uploads:

### Before Photos

### After Photos

Mandatory before payment release.

---

# MODULE 12

## Ratings & Reviews

Rating Categories:

* Quality
* Punctuality
* Professionalism
* Communication

Scale:

1–5 Stars

---

# MODULE 13

## Cancellation System

Client:

Can cancel booking.

Cleaner:

Must provide cancellation reason.

Options:

* Illness
* Emergency
* Safety Concern
* Transportation Issue
* Other

---

# MODULE 14

## Cleaner Availability Scheduling

Cleaner can:

* Set working hours
* Mark unavailable days
* Pause bookings

---

# MODULE 15

## Wallet & Earnings

Cleaner Dashboard:

* Available Balance
* Pending Balance
* Total Earnings
* Withdrawal History

---

# MODULE 16

## Dispute Resolution Center

Dispute Types:

* Cleaner Didn't Arrive
* Poor Quality Work
* Property Damage
* Theft Allegation

Admin Reviews:

* Photos
* Messages
* Logs
* Booking History

Outcome:

* Refund
* Partial Refund
* Payment Release

---

# MODULE 17

## Push Notification System

Triggers:

* Booking Accepted
* Cleaner Arriving
* New Message
* Payment Received
* Dispute Updates

---

# MODULE 18

## Admin Dashboard

Manage:

* Users
* Cleaners
* Payments
* Disputes
* Bookings
* Ratings
* Analytics

---

# MODULE 19

## Audit Logging

Track:

* Login Activity
* Booking Changes
* Payment Events
* Admin Actions

---

# MODULE 20

## Fraud Detection

Monitor:

* Fake Accounts
* Multiple Account Abuse
* Suspicious Refund Requests
* Repeated Cancellations

---

# MODULE 21

## Emergency Contact System

Client can:

* Add emergency contact

Admin can:

* Escalate emergencies

---

# MODULE 22

## Service Area Management

Admin manages:

* UCC Campus
* Amamoma
* Kwaprow
* Ayensu
* Cape Coast Expansion Areas

---

# MODULE 23

## Cleaner Performance Monitoring

Metrics:

* Acceptance Rate
* Completion Rate
* Average Rating
* Response Time
* Cancellation Rate

---

# MODULE 24

## Analytics & Reporting

Reports:

* Daily Bookings
* Monthly Revenue
* Top Cleaners
* User Growth
* Service Demand

---

# MODULE 25

## Referral Program (Phase 2)

Client Referrals

Cleaner Referrals

Rewards:

* Discounts
* Booking Credits

---

# 5. Database Tables

Core Tables:

```text
users

cleaners

cleaner_documents

bookings

booking_status

messages

conversations

payments

wallets

withdrawals

reviews

disputes

notifications

audit_logs

service_areas

referrals
```

---

# 6. Security Requirements

Authentication:

* OTP Login
* JWT Tokens

Data Security:

* HTTPS
* Encrypted Storage

Authorization:

* Role-Based Access Control

---

# 7. Performance Requirements

API Response:

< 2 Seconds

Booking Match:

< 10 Seconds

App Startup:

< 3 Seconds

---

# 8. MVP Scope (Phase 1)

Launch Only:

✅ Authentication

✅ Cleaner Verification

✅ Booking System

✅ Messaging

✅ Escrow Payments

✅ Ratings

✅ Notifications

✅ Admin Dashboard

✅ Basic Analytics

✅ Before/After Photos

---

# 9. Phase 2

Add:

* Wallet Automation
* Referral Program
* Advanced Analytics
* Cleaner Ranking System
* Automated Payouts
* Cleaner GPS Tracking

---

# 10. Phase 3

Scale Beyond UCC

Expansion Targets:

* Cape Coast
* Kumasi
* Accra

Institutions:

* University of Cape Coast
* Kwame Nkrumah University of Science and Technology
* University of Ghana
* University of Education, Winneba

---

## Final Recommendation

For a student-led startup and academic project, this PRD v2.0 strikes the right balance between:

* Fast development
* Low infrastructure costs
* Production readiness
* Real-world scalability

The first milestone should be:

**Authentication → Cleaner Verification → Booking Flow → Messaging → Payments → Admin Dashboard**

Once those six pillars are working end-to-end, you'll have a demonstrable MVP capable of onboarding real users around UCC and validating the business model before investing in more advanced features.
