export interface ApprovedCollege {
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

export const approvedColleges: ApprovedCollege[] = [
  {
    id: 'aurora-business-school',
    name: 'Aurora Institute of Business',
    city: 'Bengaluru',
    location: 'Indiranagar, Bengaluru',
    rating: 4.8,
    reviewCount: 1240,
    courses: ['MBA', 'BBA', 'Business Analytics'],
    feesFrom: 185000,
    studyModes: ['Full-time', 'Hybrid'],
    logoTone: 'from-sky-400 to-blue-700',
    admissionStatus: 'Applications open',
    highlights: ['AICTE approved', 'Placement cell', 'Scholarship review'],
  },
  {
    id: 'metro-tech-university',
    name: 'Metro Tech University',
    city: 'Mumbai',
    location: 'Powai, Mumbai',
    rating: 4.6,
    reviewCount: 980,
    courses: ['B.Tech', 'M.Tech', 'Computer Science'],
    feesFrom: 220000,
    studyModes: ['Full-time'],
    logoTone: 'from-cyan-300 to-indigo-700',
    admissionStatus: 'Fast apply',
    highlights: ['NAAC A+', 'Industry labs', 'Merit seats'],
  },
  {
    id: 'northbridge-college',
    name: 'Northbridge College of Arts',
    city: 'Delhi',
    location: 'Saket, New Delhi',
    rating: 4.5,
    reviewCount: 760,
    courses: ['BA', 'B.Com', 'Psychology'],
    feesFrom: 92000,
    studyModes: ['Full-time', 'Part-time'],
    logoTone: 'from-blue-300 to-slate-700',
    admissionStatus: 'Counselling live',
    highlights: ['UGC recognized', 'Modern campus', 'Flexible credits'],
  },
  {
    id: 'elevate-health-sciences',
    name: 'Elevate Health Sciences College',
    city: 'Pune',
    location: 'Baner, Pune',
    rating: 4.7,
    reviewCount: 650,
    courses: ['B.Sc Nursing', 'B.Pharm', 'Public Health'],
    feesFrom: 145000,
    studyModes: ['Full-time', 'Hybrid'],
    logoTone: 'from-teal-300 to-blue-800',
    admissionStatus: 'Seats available',
    highlights: ['Clinical tie-ups', 'Lab access', 'Hostel support'],
  },
  {
    id: 'bluecrest-design-school',
    name: 'Bluecrest School of Design',
    city: 'Hyderabad',
    location: 'HITEC City, Hyderabad',
    rating: 4.4,
    reviewCount: 540,
    courses: ['B.Des', 'UI/UX Design', 'Animation'],
    feesFrom: 175000,
    studyModes: ['Full-time', 'Online'],
    logoTone: 'from-sky-300 to-violet-700',
    admissionStatus: 'Portfolio review',
    highlights: ['Studio learning', 'Mentor reviews', 'Internship track'],
  },
  {
    id: 'summit-commerce-college',
    name: 'Summit Commerce College',
    city: 'Chennai',
    location: 'Adyar, Chennai',
    rating: 4.3,
    reviewCount: 430,
    courses: ['B.Com', 'M.Com', 'Finance'],
    feesFrom: 78000,
    studyModes: ['Full-time', 'Online'],
    logoTone: 'from-indigo-300 to-sky-800',
    admissionStatus: 'Apply today',
    highlights: ['CPA pathway', 'Low fee plans', 'Evening batches'],
  },
];
