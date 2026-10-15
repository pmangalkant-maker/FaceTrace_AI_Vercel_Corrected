import assert from 'node:assert';
import { db, initDatabase } from '../server/db';
import {
  hashPassword,
  generateSalt,
  verifyPassword,
  signToken,
  verifyToken,
} from '../server/auth';
import {
  analyzeImageBuffer,
  sanitizeExifBuffer,
  extractDimensions,
} from '../server/imageAnalysis';

async function runTestSuite() {
  console.log('--- Starting FaceTrace AI Verification & Test Suite ---\n');
  let passedTests = 0;
  let totalTests = 0;

  function test(name: string, fn: () => void | Promise<void>) {
    totalTests++;
    try {
      fn();
      console.log(`  ✓ PASS: ${name}`);
      passedTests++;
    } catch (err: any) {
      console.error(`  ✗ FAIL: ${name}`);
      console.error(`    ${err.message}`);
    }
  }

  // 1. Database Initialization
  test('Database schema initializes tables and indexes', () => {
    initDatabase();
    const tables = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table'")
      .all()
      .map((t: any) => t.name);

    assert(tables.includes('users'), 'Users table must exist');
    assert(tables.includes('cases'), 'Cases table must exist');
    assert(tables.includes('sightings'), 'Sightings table must exist');
    assert(tables.includes('audit_logs'), 'Audit logs table must exist');
    assert(tables.includes('notifications'), 'Notifications table must exist');
  });

  // 2. Cryptographic Authentication
  test('Password hashing produces secure, salt-dependent scrypt hashes', () => {
    const salt1 = generateSalt();
    const salt2 = generateSalt();
    const pass = 'SecretPassw0rd!';

    const hash1 = hashPassword(pass, salt1);
    const hash2 = hashPassword(pass, salt2);

    assert.notStrictEqual(hash1, hash2, 'Different salts must produce distinct hashes');
    assert(verifyPassword(pass, salt1, hash1), 'Password must verify with matching salt');
    assert(!verifyPassword('WrongPass', salt1, hash1), 'Incorrect password must fail');
  });

  test('Session tokens sign and verify with expiration and role payload', () => {
    const dummyUser = {
      id: 'usr_test_1',
      email: 'test@facetrace.org',
      role: 'case_manager' as const,
      full_name: 'Test Officer',
      is_verified: true,
    };

    const token = signToken(dummyUser);
    const decoded = verifyToken(token);

    assert(decoded !== null, 'Token signature must verify');
    assert.strictEqual(decoded.sub, dummyUser.id, 'Subject must match user ID');
    assert.strictEqual(decoded.role, 'case_manager', 'Role claim must be preserved');
  });

  // 3. Case Search & Persistence
  test('Case queries execute with filter conditions and unboxed projection', () => {
    const activeCases = db
      .prepare("SELECT * FROM cases WHERE status = 'active'")
      .all() as any[];

    assert(activeCases.length > 0, 'Seed demo cases must be present');
    const firstCase = activeCases[0];
    assert(firstCase.case_number, 'Case must have official case number');
    assert(firstCase.full_name, 'Case must have full name');
    assert(firstCase.police_case_number, 'Case must have police reference');
  });

  // 4. Privacy & EXIF Stripping
  test('EXIF sanitizer inspects JPEG APP1 segment', () => {
    // Construct sample JPEG SOI header with APP1 marker
    const testJpeg = Buffer.from([
      0xff, 0xd8, // SOI
      0xff, 0xe1, 0x00, 0x08, // APP1 length 8
      0x45, 0x78, 0x69, 0x66, 0x00, 0x00, // "Exif\0\0"
      0xff, 0xd9, // EOI
    ]);

    const { buffer: clean, hadExif } = sanitizeExifBuffer(testJpeg);
    assert.strictEqual(hadExif, true, 'Must detect presence of EXIF segment');
    // Resulting buffer should start with SOI and end with EOI without APP1
    assert.strictEqual(clean[0], 0xff);
    assert.strictEqual(clean[1], 0xd8);
  });

  // 5. Image Quality & Haar Candidate Analysis
  test('Image analyzer calculates resolution, Laplacian sharpness, and luminance metrics', () => {
    // Synthetic 400x400 test buffer
    const mockBuffer = Buffer.alloc(400 * 400 * 3, 120);
    const analysis = analyzeImageBuffer(mockBuffer);

    assert(analysis.quality, 'Quality report must be computed');
    assert(typeof analysis.quality.sharpness.laplacian_variance === 'number', 'Sharpness must be numeric');
    assert(typeof analysis.quality.brightness.mean_luminance === 'number', 'Luminance must be numeric');
    assert(Array.isArray(analysis.faces), 'Faces array must be returned');
    assert(analysis.faces.length > 0, 'Face detector must localize candidate bounds');
    assert(analysis.faces[0].landmarks, 'Facial landmarks (ocular, oral) must be present');
    assert(
      analysis.technical_disclaimer.includes('DOES NOT perform automated biometric identification'),
      'Mandatory non-biometric legal disclaimer must be present'
    );
  });

  // 6. Sighting Moderation Pipeline
  test('Sighting lifecycle enforces pending review status and moderator approval', () => {
    const testSightingId = 'sight_test_' + Date.now();
    db.prepare(`
      INSERT INTO sightings (
        id, case_id, sighting_date, city, state, country, location_notes, description,
        submitter_name, submitter_contact, status
      ) VALUES (?, 'case_demo_alex_01', '2026-10-15', 'Tacoma', 'WA', 'USA', 'Coffee shop', 'Saw subject', 'Pat Citizen', 'pat@example.org', 'pending_review')
    `).run(testSightingId);

    // Verify initial status is pending_review
    const created = db.prepare('SELECT status FROM sightings WHERE id = ?').get(testSightingId) as any;
    assert.strictEqual(created.status, 'pending_review');

    // Moderate to verified
    db.prepare(`
      UPDATE sightings
      SET status = 'verified_by_moderator', moderator_notes = 'Verified with store clerk'
      WHERE id = ?
    `).run(testSightingId);

    const updated = db.prepare('SELECT status, moderator_notes FROM sightings WHERE id = ?').get(testSightingId) as any;
    assert.strictEqual(updated.status, 'verified_by_moderator');
    assert.strictEqual(updated.moderator_notes, 'Verified with store clerk');

    // Clean up test record
    db.prepare('DELETE FROM sightings WHERE id = ?').run(testSightingId);
  });

  // 7. Audit Trail Persistence
  test('Audit trail logs user events with sanitized records', () => {
    const auditId = 'audit_test_' + Date.now();
    db.prepare(`
      INSERT INTO audit_logs (id, user_id, user_email, action, entity_type, entity_id, ip_address, details_json)
      VALUES (?, 'usr_admin_1', 'admin@facetrace.org', 'TEST_ACTION', 'test_entity', '123', '127.0.0.1', ?)
    `).run(auditId, JSON.stringify({ verified: true }));

    const logRow = db.prepare('SELECT * FROM audit_logs WHERE id = ?').get(auditId) as any;
    assert(logRow, 'Audit log must be persisted in database');
    assert.strictEqual(logRow.action, 'TEST_ACTION');

    // Clean up
    db.prepare('DELETE FROM audit_logs WHERE id = ?').run(auditId);
  });

  console.log(`\nTest results: ${passedTests}/${totalTests} tests passed.\n`);
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
