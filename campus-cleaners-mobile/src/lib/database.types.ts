/**
 * Auto-generated database types placeholder.
 * Replace with actual types from `npx supabase gen types typescript` once the schema is applied.
 */

export type UserRole = 'client' | 'cleaner';
export type VerificationStatus = 'pending' | 'approved' | 'rejected';
export type UserStatus = 'active' | 'suspended';
export type CleanerAvailability = 'available' | 'busy' | 'offline';
export type BookingStatus =
  | 'requested'
  | 'accepted'
  | 'en_route'
  | 'arrived'
  | 'started'
  | 'completed'
  | 'verified'
  | 'closed'
  | 'cancelled'
  | 'declined';
export type PaymentStatus = 'pending' | 'held' | 'released' | 'refunded';
export type DisputeType = 'no_show' | 'poor_quality' | 'property_damage' | 'theft';
export type DisputeStatus = 'open' | 'under_review' | 'resolved';
export type DocumentType = 'ghana_card' | 'student_id' | 'selfie' | 'guarantor_doc';
export type PhotoType = 'before' | 'after';
export type ServiceCategory = 'cleaning' | 'laundry';

export interface Profile {
  id: string;
  full_name: string;
  phone: string;
  email: string;
  ghana_card_number: string | null;
  role: UserRole;
  location: string | null;
  room_number: string | null;
  avatar_url: string | null;
  push_token: string | null;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface CleanerProfile {
  user_id: string;
  bio: string | null;
  skills: string[];
  availability: CleanerAvailability;
  mobile_money_number: string | null;
  guarantor_name: string | null;
  guarantor_phone: string | null;
  verification_status: VerificationStatus;
  current_lat: number | null;
  current_lng: number | null;
  avg_rating: number | null;
  total_jobs: number;
  created_at: string;
  updated_at: string;
}

export interface CleanerDocument {
  id: string;
  cleaner_id: string;
  document_type: DocumentType;
  file_url: string;
  uploaded_at: string;
}

export interface ServiceType {
  id: string;
  category: ServiceCategory;
  name: string;
  description: string | null;
  base_price: number;
  is_active: boolean;
}

export interface LaundryItem {
  item_type: string;
  quantity: number;
}

export interface Booking {
  id: string;
  client_id: string;
  cleaner_id: string | null;
  service_type_id: string;
  location: string;
  description: string | null;
  scheduled_date: string;
  scheduled_time: string;
  room_type: string | null;
  room_size: string | null;
  room_count: number | null;
  bathroom_included: boolean;
  laundry_items: LaundryItem[] | null;
  total_price: number;
  status: BookingStatus;
  cancellation_reason: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  client?: Profile;
  cleaner?: Profile;
  cleaner_profile?: CleanerProfile;
  service_type?: ServiceType;
  photos?: BookingPhoto[];
  review?: Review;
}

export interface BookingPhoto {
  id: string;
  booking_id: string;
  photo_type: PhotoType;
  file_url: string;
  uploaded_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  message: string;
  image_url: string | null;
  created_at: string;
  // Joined
  sender?: Profile;
}

export interface Review {
  id: string;
  booking_id: string;
  client_id: string;
  cleaner_id: string;
  quality_rating: number;
  punctuality_rating: number;
  professionalism_rating: number;
  communication_rating: number;
  overall_rating: number;
  comment: string | null;
  created_at: string;
}

export interface Payment {
  id: string;
  booking_id: string;
  client_id: string;
  cleaner_id: string;
  amount: number;
  platform_fee: number;
  cleaner_payout: number;
  payment_method: string | null;
  payment_reference: string | null;
  status: PaymentStatus;
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  body: string;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

export interface Dispute {
  id: string;
  booking_id: string;
  raised_by: string;
  type: DisputeType;
  description: string;
  status: DisputeStatus;
  resolution: string | null;
  created_at: string;
}

// Supabase Database type structure (simplified)
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      cleaner_profiles: { Row: CleanerProfile; Insert: Partial<CleanerProfile>; Update: Partial<CleanerProfile> };
      cleaner_documents: { Row: CleanerDocument; Insert: Partial<CleanerDocument>; Update: Partial<CleanerDocument> };
      service_types: { Row: ServiceType; Insert: Partial<ServiceType>; Update: Partial<ServiceType> };
      bookings: { Row: Booking; Insert: Partial<Booking>; Update: Partial<Booking> };
      booking_photos: { Row: BookingPhoto; Insert: Partial<BookingPhoto>; Update: Partial<BookingPhoto> };
      messages: { Row: Message; Insert: Partial<Message>; Update: Partial<Message> };
      reviews: { Row: Review; Insert: Partial<Review>; Update: Partial<Review> };
      payments: { Row: Payment; Insert: Partial<Payment>; Update: Partial<Payment> };
      notifications: { Row: AppNotification; Insert: Partial<AppNotification>; Update: Partial<AppNotification> };
      disputes: { Row: Dispute; Insert: Partial<Dispute>; Update: Partial<Dispute> };
    };
  };
}
