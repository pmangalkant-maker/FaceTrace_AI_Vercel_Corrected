from pydantic import BaseModel, Field
from typing import Optional, List

class CaseIntake(BaseModel):
    full_name: str
    alias_nickname: Optional[str] = None
    age_at_disappearance: int
    current_estimated_age: Optional[int] = None
    gender: str
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    eye_color: Optional[str] = None
    hair_color: Optional[str] = None
    distinguishing_features: Optional[str] = None
    date_missing: str
    last_seen_city: str
    last_seen_state: str
    last_seen_country: str
    last_seen_location_detail: Optional[str] = None
    law_enforcement_agency: str
    police_case_number: str
    investigating_officer: Optional[str] = None
    contact_phone_masked: str
    circumstances: str
    primary_photo_url: Optional[str] = None
    additional_photos: List[str] = []
    is_sensitive: bool = False
    lawful_relationship_affirmation: bool
    consent_verified: bool

class SightingReport(BaseModel):
    case_id: str
    sighting_date: str
    city: str
    state: str
    country: str
    location_notes: str
    description: str
    photo_url: Optional[str] = None
    submitter_name: str
    submitter_contact: str
    consent_accuracy: bool

class SightingModeration(BaseModel):
    status: str # 'verified_by_moderator', 'dismissed', 'forwarded_to_police'
    moderator_notes: Optional[str] = None

class UserRegister(BaseModel):
    email: str
    password: str
    full_name: str
    role: Optional[str] = "public"
    organization: Optional[str] = None
    phone: Optional[str] = None

class UserLogin(BaseModel):
    email: str
    password: str
