export type UserRole = 'public' | 'case_manager' | 'law_enforcement' | 'admin';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  organization?: string;
  phone?: string;
  is_verified: boolean;
}

export type CaseStatus = 'active' | 'located' | 'resolved' | 'suspended';

export interface Case {
  id: string;
  case_number: string;
  full_name: string;
  alias_nickname?: string;
  age_at_disappearance: number;
  current_estimated_age?: number;
  gender: 'male' | 'female' | 'non-binary' | 'other';
  height_cm?: number;
  weight_kg?: number;
  eye_color?: string;
  hair_color?: string;
  distinguishing_features?: string;
  date_missing: string;
  last_seen_city: string;
  last_seen_state: string;
  last_seen_country: string;
  last_seen_location_detail?: string;
  law_enforcement_agency: string;
  police_case_number: string;
  investigating_officer?: string;
  contact_phone_masked: string;
  circumstances: string;
  status: CaseStatus;
  is_sensitive: boolean;
  consent_verified: boolean;
  reporter_user_id?: string;
  primary_photo_url?: string;
  additional_photos?: string[];
  is_demo: boolean;
  is_privileged?: boolean;
  created_at: string;
  updated_at?: string;
}

export type SightingStatus =
  | 'pending_review'
  | 'verified_by_moderator'
  | 'dismissed'
  | 'forwarded_to_police';

export interface Sighting {
  id: string;
  case_id: string;
  sighting_date: string;
  city: string;
  state: string;
  country: string;
  location_notes: string;
  description: string;
  photo_url?: string;
  photo_analysis?: ImageAnalysisResult;
  submitter_name: string;
  submitter_contact: string;
  status: SightingStatus;
  moderator_notes?: string;
  case_full_name?: string;
  case_number?: string;
  police_case_number?: string;
  case_photo_url?: string;
  created_at: string;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  landmarks?: {
    left_eye: { x: number; y: number };
    right_eye: { x: number; y: number };
    mouth: { x: number; y: number };
  };
}

export interface ImageQualityReport {
  resolution: {
    width: number;
    height: number;
    megapixels: number;
    is_sufficient: boolean;
  };
  brightness: {
    mean_luminance: number;
    assessment: 'optimal' | 'underexposed' | 'overexposed';
    score: number;
  };
  contrast: {
    standard_deviation: number;
    assessment: 'good' | 'low_contrast' | 'harsh';
    score: number;
  };
  sharpness: {
    laplacian_variance: number;
    assessment: 'sharp' | 'acceptable' | 'soft_or_blurred' | 'severely_blurred';
    score: number;
  };
  compression: {
    artifact_estimate: 'low' | 'moderate' | 'high';
  };
  intake_compliance: {
    meets_standard: boolean;
    issues: string[];
    recommendations: string[];
  };
}

export interface ImageAnalysisResult {
  faces: BoundingBox[];
  quality: ImageQualityReport;
  exif_sanitized: boolean;
  technical_disclaimer: string;
}

export interface NotificationItem {
  id: string;
  user_id: string;
  title: string;
  message: string;
  link?: string;
  type: 'case_update' | 'sighting_moderation' | 'system';
  is_read: number;
  created_at: string;
}

export interface AuditLogItem {
  id: string;
  user_id?: string;
  user_email?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  ip_address?: string;
  user_agent?: string;
  details: Record<string, any>;
  created_at: string;
}

export interface DatabaseStats {
  totalCases: number;
  activeCases: number;
  locatedCases: number;
  resolvedCases: number;
  totalSightings: number;
  pendingSightings: number;
  verifiedSightings: number;
  forwardedSightings: number;
  totalUsers: number;
  verifiedUsers: number;
  totalAuditEvents: number;
}
