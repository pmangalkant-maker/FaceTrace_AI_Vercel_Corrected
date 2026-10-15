import { Router } from 'express';
import crypto from 'node:crypto';
import { db } from '../db';
import { requireAuth, requireRole, logAudit } from '../auth';

export const casesRouter = Router();

// GET /api/cases - Public search and filtering
casesRouter.get('/', (req, res) => {
  try {
    const {
      q,
      status,
      gender,
      age_min,
      age_max,
      country,
      state,
      city,
      page = '1',
      limit = '12',
    } = req.query as Record<string, string>;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const offset = (pageNum - 1) * limitNum;

    const conditions: string[] = [];
    const params: any[] = [];

    if (q && q.trim()) {
      const searchTerm = `%${q.trim()}%`;
      conditions.push(`(
        full_name LIKE ? OR
        alias_nickname LIKE ? OR
        case_number LIKE ? OR
        police_case_number LIKE ? OR
        last_seen_city LIKE ? OR
        circumstances LIKE ?
      )`);
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    if (status && status !== 'all') {
      conditions.push('status = ?');
      params.push(status);
    }

    if (gender && gender !== 'all') {
      conditions.push('gender = ?');
      params.push(gender);
    }

    if (age_min) {
      const min = parseInt(age_min, 10);
      if (!isNaN(min)) {
        conditions.push('age_at_disappearance >= ?');
        params.push(min);
      }
    }

    if (age_max) {
      const max = parseInt(age_max, 10);
      if (!isNaN(max)) {
        conditions.push('age_at_disappearance <= ?');
        params.push(max);
      }
    }

    if (country && country !== 'all') {
      conditions.push('last_seen_country = ?');
      params.push(country);
    }

    if (state && state.trim()) {
      conditions.push('last_seen_state LIKE ?');
      params.push(`%${state.trim()}%`);
    }

    if (city && city.trim()) {
      conditions.push('last_seen_city LIKE ?');
      params.push(`%${city.trim()}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const countRow = db
      .prepare(`SELECT COUNT(*) as total FROM cases ${whereClause}`)
      .get(...params) as { total: number };
    const total = countRow ? countRow.total : 0;

    const query = `
      SELECT
        id, case_number, full_name, alias_nickname, age_at_disappearance, current_estimated_age,
        gender, height_cm, weight_kg, eye_color, hair_color, distinguishing_features,
        date_missing, last_seen_city, last_seen_state, last_seen_country,
        law_enforcement_agency, police_case_number, contact_phone_masked,
        status, is_sensitive, primary_photo_url, is_demo, created_at
      FROM cases
      ${whereClause}
      ORDER BY date_missing DESC
      LIMIT ? OFFSET ?
    `;

    const cases = db.prepare(query).all(...params, limitNum, offset);

    res.json({
      cases,
      total,
      page: pageNum,
      limit: limitNum,
      totalPages: Math.ceil(total / limitNum),
    });
  } catch (err: any) {
    console.error('Fetch cases error:', err);
    res.status(500).json({ error: 'Failed to retrieve case listings.' });
  }
});

// GET /api/cases/:id - Detailed case view with privacy controls
casesRouter.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const caseRecord = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;

    if (!caseRecord) {
      res.status(404).json({ error: 'Missing person case record not found.' });
      return;
    }

    // Determine access privilege
    const isOwner = req.user && req.user.id === caseRecord.reporter_user_id;
    const isAuthority = req.user && ['admin', 'case_manager', 'law_enforcement'].includes(req.user.role);
    const hasPrivilegedAccess = isOwner || isAuthority;

    // Log audit trail if sensitive or privileged access
    if (hasPrivilegedAccess) {
      logAudit(req, 'CASE_VIEW_PRIVILEGED', 'case', caseRecord.id, {
        case_number: caseRecord.case_number,
      });
    }

    // Safe public projection vs privileged projection
    const responseData = {
      ...caseRecord,
      additional_photos: JSON.parse(caseRecord.additional_photos_json || '[]'),
      is_privileged: hasPrivilegedAccess,
      // Mask internal police contact or unverified location nuance for public
      investigating_officer: hasPrivilegedAccess ? caseRecord.investigating_officer : 'Official Case Assigned',
      last_seen_location_detail: hasPrivilegedAccess || !caseRecord.is_sensitive
        ? caseRecord.last_seen_location_detail
        : 'Confidential details restricted to verified case handlers.',
    };

    delete responseData.additional_photos_json;

    res.json({ case: responseData });
  } catch (err: any) {
    console.error('Fetch case detail error:', err);
    res.status(500).json({ error: 'Failed to retrieve case record.' });
  }
});

// POST /api/cases - Submit new missing person case
casesRouter.post('/', requireAuth, (req, res) => {
  try {
    const {
      full_name,
      alias_nickname,
      age_at_disappearance,
      current_estimated_age,
      gender,
      height_cm,
      weight_kg,
      eye_color,
      hair_color,
      distinguishing_features,
      date_missing,
      last_seen_city,
      last_seen_state,
      last_seen_country,
      last_seen_location_detail,
      law_enforcement_agency,
      police_case_number,
      investigating_officer,
      contact_phone_masked,
      circumstances,
      primary_photo_url,
      additional_photos = [],
      is_sensitive = false,
      lawful_relationship_affirmation,
      consent_verified,
    } = req.body;

    // Strict validation
    if (!full_name || !age_at_disappearance || !gender || !date_missing) {
      res.status(400).json({
        error: 'Missing vital demographics: Name, Age, Gender, and Disappearance Date are required.',
      });
      return;
    }

    if (!law_enforcement_agency || !police_case_number) {
      res.status(400).json({
        error: 'Lawful intake requirement: You must provide the reporting law enforcement agency and police case number.',
      });
      return;
    }

    if (!lawful_relationship_affirmation || !consent_verified) {
      res.status(400).json({
        error: 'Lawful authority and consent affirmations must be confirmed prior to submission.',
      });
      return;
    }

    const caseId = 'case_' + crypto.randomUUID();
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const caseNumber = `FT-${year}-${randomSuffix}`;

    db.prepare(`
      INSERT INTO cases (
        id, case_number, full_name, alias_nickname, age_at_disappearance, current_estimated_age,
        gender, height_cm, weight_kg, eye_color, hair_color, distinguishing_features,
        date_missing, last_seen_city, last_seen_state, last_seen_country, last_seen_location_detail,
        law_enforcement_agency, police_case_number, investigating_officer, contact_phone_masked,
        circumstances, status, is_sensitive, consent_verified, reporter_user_id, primary_photo_url,
        additional_photos_json, is_demo
      ) VALUES (
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, 'active', ?, ?, ?, ?,
        ?, 0
      )
    `).run(
      caseId,
      caseNumber,
      full_name.trim(),
      alias_nickname?.trim() || null,
      parseInt(age_at_disappearance, 10),
      current_estimated_age ? parseInt(current_estimated_age, 10) : parseInt(age_at_disappearance, 10),
      gender,
      height_cm ? parseInt(height_cm, 10) : null,
      weight_kg ? parseInt(weight_kg, 10) : null,
      eye_color || null,
      hair_color || null,
      distinguishing_features || null,
      date_missing,
      last_seen_city.trim(),
      last_seen_state.trim(),
      last_seen_country.trim(),
      last_seen_location_detail?.trim() || null,
      law_enforcement_agency.trim(),
      police_case_number.trim(),
      investigating_officer?.trim() || null,
      contact_phone_masked.trim(),
      circumstances.trim(),
      is_sensitive ? 1 : 0,
      consent_verified ? 1 : 0,
      req.user!.id,
      primary_photo_url || null,
      JSON.stringify(additional_photos)
    );

    // Notify admins of new case intake
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all() as any[];
    for (const admin of adminUsers) {
      db.prepare(`
        INSERT INTO notifications (id, user_id, title, message, link, type)
        VALUES (?, ?, ?, ?, ?, 'case_update')
      `).run(
        'notif_' + crypto.randomUUID(),
        admin.id,
        'New Case Intake Submitted',
        `Case ${caseNumber} (${full_name}) registered with police case ref ${police_case_number}.`,
        `/cases/${caseId}`
      );
    }

    logAudit(req, 'CASE_CREATED', 'case', caseId, {
      case_number: caseNumber,
      police_agency: law_enforcement_agency,
      police_case_number,
    });

    res.status(201).json({
      message: 'Missing person case registered successfully.',
      case_id: caseId,
      case_number: caseNumber,
    });
  } catch (err: any) {
    console.error('Create case error:', err);
    res.status(500).json({ error: 'Failed to record missing person case.' });
  }
});

// PUT /api/cases/:id - Update case details (owner or manager/admin)
casesRouter.put('/:id', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;

    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const isOwner = req.user!.id === existing.reporter_user_id;
    const isAuthority = ['admin', 'case_manager', 'law_enforcement'].includes(req.user!.role);

    if (!isOwner && !isAuthority) {
      res.status(403).json({ error: 'You are not authorized to edit this case record.' });
      return;
    }

    const {
      full_name,
      alias_nickname,
      height_cm,
      weight_kg,
      eye_color,
      hair_color,
      distinguishing_features,
      circumstances,
      last_seen_location_detail,
      contact_phone_masked,
      primary_photo_url,
    } = req.body;

    db.prepare(`
      UPDATE cases
      SET
        full_name = COALESCE(?, full_name),
        alias_nickname = COALESCE(?, alias_nickname),
        height_cm = COALESCE(?, height_cm),
        weight_kg = COALESCE(?, weight_kg),
        eye_color = COALESCE(?, eye_color),
        hair_color = COALESCE(?, hair_color),
        distinguishing_features = COALESCE(?, distinguishing_features),
        circumstances = COALESCE(?, circumstances),
        last_seen_location_detail = COALESCE(?, last_seen_location_detail),
        contact_phone_masked = COALESCE(?, contact_phone_masked),
        primary_photo_url = COALESCE(?, primary_photo_url),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      full_name || null,
      alias_nickname || null,
      height_cm ? parseInt(height_cm, 10) : null,
      weight_kg ? parseInt(weight_kg, 10) : null,
      eye_color || null,
      hair_color || null,
      distinguishing_features || null,
      circumstances || null,
      last_seen_location_detail || null,
      contact_phone_masked || null,
      primary_photo_url || null,
      id
    );

    logAudit(req, 'CASE_UPDATED', 'case', id, { updated_by: req.user!.email });

    res.json({ message: 'Case record updated successfully.' });
  } catch (err: any) {
    console.error('Update case error:', err);
    res.status(500).json({ error: 'Failed to update case record.' });
  }
});

// PATCH /api/cases/:id/status - Update case status (active, located, resolved, suspended)
casesRouter.patch('/:id/status', requireAuth, (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution_notes } = req.body;

    const validStatuses = ['active', 'located', 'resolved', 'suspended'];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }

    const existing = db.prepare('SELECT * FROM cases WHERE id = ?').get(id) as any;
    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    const isOwner = req.user!.id === existing.reporter_user_id;
    const isAuthority = ['admin', 'case_manager', 'law_enforcement'].includes(req.user!.role);
    if (!isOwner && !isAuthority) {
      res.status(403).json({ error: 'Unauthorized to change case status.' });
      return;
    }

    db.prepare(`
      UPDATE cases
      SET status = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(status, id);

    logAudit(req, 'CASE_STATUS_CHANGED', 'case', id, {
      from: existing.status,
      to: status,
      resolution_notes,
    });

    res.json({ message: `Case status changed to ${status}.` });
  } catch (err: any) {
    console.error('Status change error:', err);
    res.status(500).json({ error: 'Failed to update case status.' });
  }
});

// DELETE /api/cases/:id - Deletion / retention request
casesRouter.delete('/:id', requireAuth, requireRole(['admin', 'case_manager']), (req, res) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT id, case_number, full_name FROM cases WHERE id = ?').get(id) as any;

    if (!existing) {
      res.status(404).json({ error: 'Case not found.' });
      return;
    }

    db.prepare('DELETE FROM cases WHERE id = ?').run(id);

    logAudit(req, 'CASE_DELETED_RETENTION', 'case', id, {
      case_number: existing.case_number,
      full_name: existing.full_name,
    });

    res.json({ message: 'Case and associated records deleted per retention policy.' });
  } catch (err: any) {
    console.error('Delete case error:', err);
    res.status(500).json({ error: 'Failed to delete case.' });
  }
});
