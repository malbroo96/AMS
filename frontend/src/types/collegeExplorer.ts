import type { CollegeProfileData } from '../api/ams';

export interface CollegeExplorerItem {
  id: string;
  name: string;
  city: string;
  location: string;
  rating: number;
  reviewCount: number;
  courses: string[];
  feesFrom: number;
  studyModes: string[];
  logoTone: string;
  admissionStatus: string;
  highlights: string[];
}

const logoTones = [
  'from-sky-400 to-blue-700',
  'from-cyan-300 to-indigo-700',
  'from-blue-300 to-slate-700',
  'from-teal-300 to-blue-800',
  'from-sky-300 to-violet-700',
  'from-indigo-300 to-sky-800',
];

const knownStudyModes = new Set(['Full-time', 'Hybrid', 'Online', 'Part-time']);

function stringValue(value: unknown) {
  return typeof value === 'string' ? value : '';
}

function numberValue(value: unknown, fallback: number) {
  const next = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(next) ? next : fallback;
}

function courseName(course: Record<string, unknown>) {
  return stringValue(course.courseName) || stringValue(course.CourseName) || stringValue(course.name);
}

export function mapProfileToExplorerCollege(profile: CollegeProfileData, index = 0): CollegeExplorerItem {
  const extra = profile as unknown as Record<string, unknown>;
  const rawCourses = Array.isArray(profile.courses) ? profile.courses : [];
  const courses = rawCourses.map(courseName).filter(Boolean);
  const facilities = Array.isArray(profile.facilities) ? profile.facilities.filter(Boolean) : [];
  const studyModes = facilities.filter((item) => knownStudyModes.has(item));
  const highlights = facilities.filter((item) => !knownStudyModes.has(item));
  const city = profile.location?.city || '';
  const locationParts = [profile.location?.fullAddress, city, profile.location?.state].filter(Boolean);

  return {
    id: profile.id,
    name: profile.collegeName || 'College',
    city,
    location: locationParts[0] || city || 'Location not added',
    rating: numberValue(extra.rating, 4.5),
    reviewCount: numberValue(extra.reviewCount, 0),
    courses,
    feesFrom: numberValue(extra.feesFrom, 250000),
    studyModes: studyModes.length ? studyModes : ['Full-time'],
    logoTone: logoTones[index % logoTones.length],
    admissionStatus: profile.status === 'approved' ? 'Applications open' : profile.status || 'Profile pending',
    highlights: highlights.length ? highlights.slice(0, 4) : ['Verified SQL profile'],
  };
}
