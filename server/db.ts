import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';

const dataDir = process.env.VERCEL ? '/tmp/facetrace-data' : path.resolve(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const uploadsDir = process.env.VERCEL ? '/tmp/facetrace-uploads' : path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'facetrace.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      password_salt TEXT NOT NULL,
      full_name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'public', -- 'public', 'case_manager', 'law_enforcement', 'admin'
      organization TEXT,
      phone TEXT,
      is_verified INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cases (
      id TEXT PRIMARY KEY,
      case_number TEXT UNIQUE NOT NULL,
      full_name TEXT NOT NULL,
      alias_nickname TEXT,
      age_at_disappearance INTEGER NOT NULL,
      current_estimated_age INTEGER,
      gender TEXT NOT NULL, -- 'male', 'female', 'non-binary', 'other'
      height_cm INTEGER,
      weight_kg INTEGER,
      eye_color TEXT,
      hair_color TEXT,
      distinguishing_features TEXT,
      date_missing TEXT NOT NULL,
      last_seen_city TEXT NOT NULL,
      last_seen_state TEXT NOT NULL,
      last_seen_country TEXT NOT NULL,
      last_seen_location_detail TEXT,
      law_enforcement_agency TEXT NOT NULL,
      police_case_number TEXT NOT NULL,
      investigating_officer TEXT,
      contact_phone_masked TEXT NOT NULL,
      circumstances TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active', -- 'active', 'located', 'resolved', 'suspended'
      is_sensitive INTEGER NOT NULL DEFAULT 0,
      consent_verified INTEGER NOT NULL DEFAULT 1,
      reporter_user_id TEXT,
      primary_photo_url TEXT,
      additional_photos_json TEXT DEFAULT '[]',
      is_demo INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(reporter_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS sightings (
      id TEXT PRIMARY KEY,
      case_id TEXT NOT NULL,
      sighting_date TEXT NOT NULL,
      city TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT NOT NULL,
      location_notes TEXT NOT NULL,
      description TEXT NOT NULL,
      photo_url TEXT,
      photo_analysis_json TEXT,
      submitter_name TEXT NOT NULL,
      submitter_contact TEXT NOT NULL,
      submitter_user_id TEXT,
      status TEXT NOT NULL DEFAULT 'pending_review', -- 'pending_review', 'verified_by_moderator', 'dismissed', 'forwarded_to_police'
      moderator_notes TEXT,
      reviewed_by_user_id TEXT,
      reviewed_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
      FOREIGN KEY(submitter_user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY(reviewed_by_user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      user_email TEXT,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT,
      ip_address TEXT,
      user_agent TEXT,
      details_json TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      link TEXT,
      type TEXT NOT NULL DEFAULT 'system', -- 'case_update', 'sighting_moderation', 'system'
      is_read INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
    CREATE INDEX IF NOT EXISTS idx_cases_date_missing ON cases(date_missing);
    CREATE INDEX IF NOT EXISTS idx_sightings_case_id ON sightings(case_id);
    CREATE INDEX IF NOT EXISTS idx_sightings_status ON sightings(status);
    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
  `);

  seedInitialData();
}

import { hashPassword } from './auth';

function seedInitialData() {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
  if (userCount.count > 0) {
    return;
  }

  console.log('Seeding initial verified users and synthetic demo cases...');

  // Create standard test accounts
  const adminSalt = 'admin_salt_77a94';
  const adminHash = hashPassword('AdminPass123!', adminSalt);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, full_name, role, organization, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usr_admin_1', 'admin@facetrace.org', adminHash, adminSalt, 'Elena Rostova', 'admin', 'National Missing Persons Liaison Bureau', 1);

  const coordSalt = 'coord_salt_b8c21';
  const coordHash = hashPassword('CoordPass123!', coordSalt);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, full_name, role, organization, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usr_coord_1', 'coordinator@facetrace.org', coordHash, coordSalt, 'Marcus Thorne', 'case_manager', 'Metro Missing Persons Alliance', 1);

  const volSalt = 'vol_salt_f43e9';
  const volHash = hashPassword('VolunPass123!', volSalt);
  db.prepare(`
    INSERT INTO users (id, email, password_hash, password_salt, full_name, role, organization, is_verified)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run('usr_vol_1', 'volunteer@facetrace.org', volHash, volSalt, 'Sarah Chen', 'public', 'Community Search Volunteer', 1);

  // Seed synthetic demo cases (Explicitly labeled DEMO RECORD per user specifications)
  const alexPhoto = '/src/assets/images/demo_person_alex_1792074144997.jpg';
  const mayaPhoto = '/src/assets/images/demo_person_maya_1792074144416.jpg';

  db.prepare(`
    INSERT INTO cases (
      id, case_number, full_name, alias_nickname, age_at_disappearance, current_estimated_age,
      gender, height_cm, weight_kg, eye_color, hair_color, distinguishing_features,
      date_missing, last_seen_city, last_seen_state, last_seen_country, last_seen_location_detail,
      law_enforcement_agency, police_case_number, investigating_officer, contact_phone_masked,
      circumstances, status, is_sensitive, consent_verified, reporter_user_id, primary_photo_url, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, 0, 1, ?, ?, 1
    )
  `).run(
    'case_demo_alex_01',
    'FT-2026-0814',
    '[DEMO] Alexander James Vance',
    'Alex',
    32,
    32,
    'male',
    182,
    78,
    'Hazel',
    'Brown',
    'Faint 2cm scar above left eyebrow, small birthmark on right collarbone.',
    '2026-09-12',
    'Seattle',
    'WA',
    'United States',
    'Downtown Transit Hub near 4th and Pike St',
    'Seattle Police Department - Missing Persons Section',
    'SPD-26-884192',
    'Detective R. Henderson',
    '(206) 555-0143',
    'Alexander was last seen departing his office near downtown Seattle on the evening of Sept 12. His vehicle was recovered parked near Discovery Park trail head. Family and law enforcement request any verified sightings.',
    'active',
    'usr_coord_1',
    alexPhoto
  );

  db.prepare(`
    INSERT INTO cases (
      id, case_number, full_name, alias_nickname, age_at_disappearance, current_estimated_age,
      gender, height_cm, weight_kg, eye_color, hair_color, distinguishing_features,
      date_missing, last_seen_city, last_seen_state, last_seen_country, last_seen_location_detail,
      law_enforcement_agency, police_case_number, investigating_officer, contact_phone_masked,
      circumstances, status, is_sensitive, consent_verified, reporter_user_id, primary_photo_url, is_demo
    ) VALUES (
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?, ?,
      ?, ?, ?, ?, ?,
      ?, ?, ?, ?,
      ?, ?, 0, 1, ?, ?, 1
    )
  `).run(
    'case_demo_maya_02',
    'FT-2026-0922',
    '[DEMO] Maya Lin Sterling',
    'May',
    27,
    27,
    'female',
    168,
    59,
    'Dark Brown',
    'Wavy Dark Brown',
    'Small geometric tattoo on inside right wrist, silver hoop earrings in both ears.',
    '2026-08-28',
    'Portland',
    'OR',
    'United States',
    'Eastbank Esplanade near Hawthorne Bridge',
    'Portland Police Bureau - Missing Persons Unit',
    'PPB-26-049281',
    'Officer T. Alvarez',
    '(503) 555-0188',
    'Maya was last seen walking south along Eastbank Esplanade after an evening social event. Her mobile phone powered down approximately 45 minutes later. Search operations coordinated with local coast guard auxiliary and search volunteers.',
    'active',
    'usr_coord_1',
    mayaPhoto
  );

  // Seed sample verified sighting and pending sighting
  db.prepare(`
    INSERT INTO sightings (
      id, case_id, sighting_date, city, state, country, location_notes, description,
      submitter_name, submitter_contact, submitter_user_id, status, moderator_notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sight_demo_01',
    'case_demo_alex_01',
    '2026-09-14',
    'Bremerton',
    'WA',
    'United States',
    'Ferry Terminal waiting benches',
    'Observed an individual matching description wearing dark gray crew sweater and navy backpack buying ticket at kiosk.',
    'David Miller',
    'd.miller.volunteer@example.org',
    'usr_vol_1',
    'verified_by_moderator',
    'Confirmed ferry surveillance log matches timeline. Forwarded to Detective Henderson on 2026-09-15.'
  );

  db.prepare(`
    INSERT INTO sightings (
      id, case_id, sighting_date, city, state, country, location_notes, description,
      submitter_name, submitter_contact, submitter_user_id, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'sight_demo_02',
    'case_demo_maya_02',
    '2026-09-18',
    'Eugene',
    'OR',
    'United States',
    'Public library plaza',
    'Saw a woman of similar height and wavy dark hair carrying sketchpad near civic center courtyard.',
    'Anonymous Community Member',
    'confidential@example.org',
    'usr_vol_1',
    'pending_review'
  );

  // Seed initial notification
  db.prepare(`
    INSERT INTO notifications (id, user_id, title, message, link, type)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    'notif_demo_01',
    'usr_admin_1',
    'New Sighting Submitted for Review',
    'A new community sighting was reported for [DEMO] Maya Lin Sterling in Eugene, OR. Moderation action required.',
    '/admin',
    'sighting_moderation'
  );

  // Seed initial audit log
  db.prepare(`
    INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, ip_address, details_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    'audit_demo_01',
    'usr_admin_1',
    'admin@facetrace.org',
    'SYSTEM_INITIALIZED',
    'system',
    'facetrace_db',
    '127.0.0.1',
    JSON.stringify({ note: 'Initialized database with cryptographic auth and demo records' })
  );
}
