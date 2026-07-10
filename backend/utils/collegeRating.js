/**
 * Convert accreditation grades/scores to a 0–5 numeric value and average them.
 * Used wherever college rating is displayed — never hardcode ratings.
 */

const NAAC_MAP = {
  'A++': 5,
  'A+': 4.5,
  A: 4,
  'B++': 3.5,
  'B+': 3,
  B: 2.5,
  C: 2,
  D: 1,
};

const NBA_MAP = {
  accredited: 4.5,
  yes: 4.5,
  provisional: 3.5,
};

function parseNumericScore(raw) {
  if (raw == null || raw === '') return null;
  const cleaned = String(raw).trim();
  const pct = cleaned.match(/^(\d+(?:\.\d+)?)\s*%$/);
  if (pct) {
    const n = Number(pct[1]);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(5, (n / 100) * 5));
  }
  const nirf = cleaned.match(/^(\d+(?:\.\d+)?)\s*\/\s*100$/i);
  if (nirf) {
    const n = Number(nirf[1]);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(5, (n / 100) * 5));
  }
  const plain = Number(cleaned);
  if (Number.isFinite(plain)) {
    if (plain > 5 && plain <= 100) return Math.max(0, Math.min(5, (plain / 100) * 5));
    if (plain >= 0 && plain <= 5) return plain;
  }
  return null;
}

function scoreAccreditation(name, gradeOrScore) {
  const label = String(name || '').trim().toUpperCase();
  const grade = String(gradeOrScore || '').trim();
  const gradeUpper = grade.toUpperCase();

  const numeric = parseNumericScore(grade);
  if (numeric != null) return numeric;

  if (label.includes('NAAC') && NAAC_MAP[gradeUpper] != null) return NAAC_MAP[gradeUpper];
  if (label.includes('NBA')) {
    const key = grade.toLowerCase();
    if (NBA_MAP[key] != null) return NBA_MAP[key];
    if (gradeUpper === 'A' || gradeUpper === 'ACCREDITED') return 4.5;
  }
  if (label.includes('AICTE') || label.includes('UGC') || label.includes('ISO')) {
    if (/^(yes|approved|accredited|certified)$/i.test(grade) || !grade) return 4;
    return 3.5;
  }
  if (label.includes('NIRF')) {
    const rank = Number(grade.replace(/[^\d.]/g, ''));
    if (Number.isFinite(rank) && rank > 0) {
      if (rank <= 50) return 5;
      if (rank <= 100) return 4.5;
      if (rank <= 200) return 4;
      if (rank <= 500) return 3.5;
      return 3;
    }
  }

  // Unknown accreditation with a grade present — mild credit
  if (grade) return 3.5;
  return 3;
}

/**
 * @param {Array<{ accreditationName?: string, AccreditationName?: string, gradeOrScore?: string, GradeOrScore?: string }>} accreditations
 * @returns {number|null} average on 0–5 scale, or null if none
 */
function calculateCollegeRating(accreditations) {
  if (!Array.isArray(accreditations) || accreditations.length === 0) return null;
  const scores = accreditations
    .map((row) =>
      scoreAccreditation(
        row.accreditationName || row.AccreditationName,
        row.gradeOrScore || row.GradeOrScore
      )
    )
    .filter((n) => Number.isFinite(n));
  if (!scores.length) return null;
  const avg = scores.reduce((sum, n) => sum + n, 0) / scores.length;
  return Math.round(avg * 100) / 100;
}

module.exports = {
  calculateCollegeRating,
  scoreAccreditation,
};
