import { useMemo, useState, type ChangeEvent, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logoNav from '../../assets/logo.png';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { button, form } from '../../components/ui/designTokens';
import { getRoleRedirect, useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import {
  createCollegeGalleryImage,
  updateCollegeProfile,
  uploadCollegeBanner,
  uploadCollegeLogo,
} from '../../api/ams';
import api from '../../api/axios';
import type { UserRole } from '../../types';

const STEPS = [
  'Account',
  'Basic',
  'Branding',
  'Address',
  'Contacts',
  'Courses',
  'Facilities',
  'Placements',
  'Accreditations',
  'Documents',
  'Social',
] as const;

const FACILITY_OPTIONS = [
  'Hostel',
  'Library',
  'WiFi',
  'Smart Classroom',
  'Computer Lab',
  'Sports',
  'Gym',
  'Cafeteria',
  'Transport',
  'Auditorium',
  'Medical Facility',
  'Placement Cell',
  'Research Center',
  'Parking',
  'ATM',
  'Bank',
  'Others',
] as const;

const ACCREDITATION_OPTIONS = ['NAAC', 'NBA', 'AICTE', 'UGC', 'ISO', 'NIRF', 'Others'] as const;

const DOCUMENT_TYPES = [
  'Prospectus',
  'Brochure',
  'Fee Structure PDF',
  'Admission Rules',
  'Hostel Rules',
  'Academic Calendar',
  'Other Documents',
] as const;

type CourseDraft = {
  courseName: string;
  degree: string;
  branch: string;
  duration: string;
  intake: string;
  availableSeats: string;
  eligibility: string;
  description: string;
  tuitionFee: string;
  hostelFee: string;
  transportFee: string;
  examFee: string;
  miscellaneousFee: string;
  scholarshipInfo: string;
};

type AccreditationDraft = {
  accreditationName: string;
  gradeOrScore: string;
  certificateNumber: string;
  validTill: string;
  certificateFile: File | null;
};

type DocumentDraft = {
  documentType: string;
  file: File | null;
};

const emptyCourse = (): CourseDraft => ({
  courseName: '',
  degree: '',
  branch: '',
  duration: '',
  intake: '',
  availableSeats: '',
  eligibility: '',
  description: '',
  tuitionFee: '',
  hostelFee: '',
  transportFee: '',
  examFee: '',
  miscellaneousFee: '',
  scholarshipInfo: '',
});

const emptyAccreditation = (): AccreditationDraft => ({
  accreditationName: 'NAAC',
  gradeOrScore: '',
  certificateNumber: '',
  validTill: '',
  certificateFile: null,
});

function num(value: string) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function totalFee(course: CourseDraft) {
  return (
    (num(course.tuitionFee) || 0) +
    (num(course.hostelFee) || 0) +
    (num(course.transportFee) || 0) +
    (num(course.examFee) || 0) +
    (num(course.miscellaneousFee) || 0)
  );
}

async function uploadGenericFile(file: File, subfolder: string) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', subfolder);
  const { data } = await api.post<{ success: boolean; data: { url?: string; fileUrl?: string; fileId?: string } }>('/upload', formData);
  const payload = data.data || {};
  if (payload.url) return payload.url;
  if (payload.fileUrl) return payload.fileUrl;
  if (payload.fileId) return `/api/files/${payload.fileId}`;
  throw new Error('Upload did not return a file URL');
}

export function CollegeRegisterPage() {
  const { register: registerUser } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [account, setAccount] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    confirmPassword: '',
  });

  const [basic, setBasic] = useState({
    collegeName: '',
    collegeType: '',
    universityAffiliation: '',
    establishmentYear: '',
    description: '',
    vision: '',
    mission: '',
    website: '',
    email: '',
    phone: '',
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [campusFiles, setCampusFiles] = useState<File[]>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  const [address, setAddress] = useState({
    address: '',
    city: '',
    district: '',
    state: '',
    country: 'India',
    pincode: '',
    googleMapUrl: '',
  });

  const [contacts, setContacts] = useState({
    principalName: '',
    admissionOfficer: '',
    admissionEmail: '',
    admissionPhone: '',
    whatsAppNumber: '',
  });

  const [courses, setCourses] = useState<CourseDraft[]>([emptyCourse()]);
  const [facilities, setFacilities] = useState<string[]>([]);
  const [otherFacility, setOtherFacility] = useState('');
  const [placements, setPlacements] = useState({
    highestPackage: '',
    averagePackage: '',
    placementPercentage: '',
    topRecruiters: '',
  });
  const [accreditations, setAccreditations] = useState<AccreditationDraft[]>([emptyAccreditation()]);
  const [documents, setDocuments] = useState<DocumentDraft[]>(
    DOCUMENT_TYPES.map((documentType) => ({ documentType, file: null }))
  );
  const [social, setSocial] = useState({
    facebook: '',
    instagram: '',
    linkedin: '',
    twitter: '',
    youtube: '',
  });

  const progress = useMemo(() => Math.round(((step + 1) / STEPS.length) * 100), [step]);

  const validateStep = () => {
    if (step === 0) {
      if (!account.name.trim() || !account.email.trim() || !account.mobile.trim()) return 'Fill account contact details';
      if (account.password.length < 6) return 'Password must be at least 6 characters';
      if (account.password !== account.confirmPassword) return 'Passwords do not match';
    }
    if (step === 1) {
      if (!basic.collegeName.trim()) return 'College name is required';
      if (!basic.collegeType.trim()) return 'College type is required';
      if (!basic.email.trim()) return 'College email is required';
    }
    if (step === 3) {
      if (!address.address.trim() || !address.city.trim() || !address.state.trim()) return 'Address, city, and state are required';
    }
    if (step === 5) {
      const valid = courses.some((c) => c.courseName.trim());
      if (!valid) return 'Add at least one course';
    }
    return null;
  };

  const next = () => {
    const error = validateStep();
    if (error) {
      showToast(error, 'error');
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => setStep((s) => Math.max(s - 1, 0));

  const onLogoChange = (file: File | null) => {
    setLogoFile(file);
    setLogoPreview(file ? URL.createObjectURL(file) : null);
  };

  const onBannerChange = (file: File | null) => {
    setBannerFile(file);
    setBannerPreview(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async () => {
    const error = validateStep();
    if (error) {
      showToast(error, 'error');
      return;
    }
    setLoading(true);
    try {
      const coursePayload = courses
        .filter((c) => c.courseName.trim())
        .map((c) => ({
          courseName: c.courseName,
          degree: c.degree,
          branch: c.branch,
          duration: num(c.duration),
          intake: num(c.intake),
          availableSeats: num(c.availableSeats),
          totalSeats: num(c.intake) || num(c.availableSeats),
          eligibility: c.eligibility,
          description: c.description,
          fees: {
            tuitionFee: num(c.tuitionFee),
            hostelFee: num(c.hostelFee),
            transportFee: num(c.transportFee),
            examFee: num(c.examFee),
            miscellaneousFee: num(c.miscellaneousFee),
            scholarshipInfo: c.scholarshipInfo,
            totalFee: totalFee(c),
          },
        }));

      const facilityList = [...facilities];
      if (facilities.includes('Others') && otherFacility.trim()) {
        facilityList.push(otherFacility.trim());
      }

      const accreditationPayload = accreditations
        .filter((a) => a.accreditationName.trim())
        .map((a) => ({
          accreditationName: a.accreditationName,
          gradeOrScore: a.gradeOrScore,
          certificateNumber: a.certificateNumber,
          validTill: a.validTill || null,
          certificateUrl: null as string | null,
        }));

      await registerUser({
        name: account.name,
        email: account.email,
        mobile: account.mobile,
        password: account.password,
        confirmPassword: account.confirmPassword,
        role: 'college',
        collegeName: basic.collegeName,
        collegeAddress: address.address,
        basic: {
          ...basic,
          establishmentYear: num(basic.establishmentYear),
          phone: basic.phone || account.mobile,
          email: basic.email || account.email,
        },
        address,
        contacts,
        courses: coursePayload,
        facilities: facilityList,
        placements: {
          highestPackage: placements.highestPackage,
          averagePackage: placements.averagePackage,
          placementPercentage: num(placements.placementPercentage),
          topRecruiters: placements.topRecruiters
            .split(',')
            .map((s) => s.trim())
            .filter(Boolean),
        },
        accreditations: accreditationPayload,
        social,
        documents: [],
        gallery: [],
      } as Parameters<typeof registerUser>[0] & Record<string, unknown>);

      // Upload branding / gallery / documents with authenticated session
      if (logoFile) await uploadCollegeLogo(logoFile);
      if (bannerFile) await uploadCollegeBanner(bannerFile);

      for (const file of campusFiles) {
        await createCollegeGalleryImage({ imageTitle: file.name }, file);
      }

      const uploadedDocs: Array<{ documentType: string; documentName: string; fileUrl: string }> = [];
      for (const doc of documents) {
        if (!doc.file) continue;
        const url = await uploadGenericFile(doc.file, 'college-documents');
        uploadedDocs.push({ documentType: doc.documentType, documentName: doc.file.name, fileUrl: url });
      }

      const uploadedAccreditations = [];
      for (let i = 0; i < accreditations.length; i++) {
        const item = accreditations[i];
        let certificateUrl: string | null = null;
        if (item.certificateFile) {
          certificateUrl = await uploadGenericFile(item.certificateFile, 'college-accreditations');
        }
        if (!item.accreditationName.trim()) continue;
        uploadedAccreditations.push({
          accreditationName: item.accreditationName,
          gradeOrScore: item.gradeOrScore,
          certificateNumber: item.certificateNumber,
          validTill: item.validTill || null,
          certificateUrl,
        });
      }

      if (uploadedDocs.length || uploadedAccreditations.length) {
        await updateCollegeProfile({
          documents: uploadedDocs,
          accreditations: uploadedAccreditations,
        } as never);
      }

      showToast('College registration successful', 'success');
      navigate(getRoleRedirect('college' as UserRole));
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        ((err as { request?: unknown })?.request
          ? 'Cannot connect to the server. Please start the backend API and try again.'
          : '') ||
        (err as Error)?.message ||
        'College registration failed';
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-dvh min-h-screen flex-col bg-slate-50 font-sans text-slate-900">
      <header className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-3">
            <img src={logoNav} alt="E-Admit Portal" className="h-10 w-auto" />
            <span className="font-sans text-lg font-bold text-slate-900">E-Admit Portal</span>
          </Link>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-blue-600">College onboarding</p>
            <h1 className="text-lg font-bold text-slate-900 sm:text-xl">College Registration</h1>
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-[1400px] px-4 py-4 sm:px-6 lg:px-8">
          <div className="mb-3 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-4 flex w-full gap-1 overflow-x-auto pb-1">
            {STEPS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setStep(index)}
                className={`min-w-0 flex-1 whitespace-nowrap rounded-full px-2.5 py-1.5 text-center text-[11px] font-medium sm:text-xs ${
                  index === step ? 'bg-blue-600 text-white' : index < step ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <p className="mt-3 text-sm text-slate-500">Complete multi-step registration to publish your college profile</p>
        </div>
      </div>

      <main className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          {step === 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Contact Person">
                <input className={inputClass} value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} />
              </Field>
              <Field label="Login Email">
                <input type="email" className={inputClass} value={account.email} onChange={(e) => setAccount({ ...account, email: e.target.value })} />
              </Field>
              <Field label="Mobile Number">
                <input className={inputClass} value={account.mobile} onChange={(e) => setAccount({ ...account, mobile: e.target.value })} />
              </Field>
              <Field label="Password">
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={inputClass}
                    value={account.password}
                    onChange={(e) => setAccount({ ...account, password: e.target.value })}
                  />
                  <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
              </Field>
              <Field label="Confirm Password">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={inputClass}
                  value={account.confirmPassword}
                  onChange={(e) => setAccount({ ...account, confirmPassword: e.target.value })}
                />
              </Field>
            </div>
          )}

          {step === 1 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="College Name">
                <input className={inputClass} value={basic.collegeName} onChange={(e) => setBasic({ ...basic, collegeName: e.target.value })} />
              </Field>
              <Field label="College Type">
                <select className={inputClass} value={basic.collegeType} onChange={(e) => setBasic({ ...basic, collegeType: e.target.value })}>
                  <option value="">Select type</option>
                  <option>Government</option>
                  <option>Private</option>
                  <option>Autonomous</option>
                  <option>Deemed</option>
                </select>
              </Field>
              <Field label="University / Affiliation">
                <input className={inputClass} value={basic.universityAffiliation} onChange={(e) => setBasic({ ...basic, universityAffiliation: e.target.value })} />
              </Field>
              <Field label="Establishment Year">
                <input className={inputClass} value={basic.establishmentYear} onChange={(e) => setBasic({ ...basic, establishmentYear: e.target.value })} />
              </Field>
              <Field label="Website">
                <input className={inputClass} value={basic.website} onChange={(e) => setBasic({ ...basic, website: e.target.value })} />
              </Field>
              <Field label="Email">
                <input className={inputClass} value={basic.email} onChange={(e) => setBasic({ ...basic, email: e.target.value })} />
              </Field>
              <Field label="Phone">
                <input className={inputClass} value={basic.phone} onChange={(e) => setBasic({ ...basic, phone: e.target.value })} />
              </Field>
              <Field label="Description / About College" className="sm:col-span-2 lg:col-span-3">
                <textarea className={inputClass} rows={3} value={basic.description} onChange={(e) => setBasic({ ...basic, description: e.target.value })} />
              </Field>
              <Field label="Vision" className="sm:col-span-2 lg:col-span-3 xl:col-span-1">
                <textarea className={inputClass} rows={2} value={basic.vision} onChange={(e) => setBasic({ ...basic, vision: e.target.value })} />
              </Field>
              <Field label="Mission" className="sm:col-span-2 lg:col-span-3 xl:col-span-2">
                <textarea className={inputClass} rows={2} value={basic.mission} onChange={(e) => setBasic({ ...basic, mission: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="College Logo">
                <input type="file" accept="image/*" onChange={(e) => onLogoChange(e.target.files?.[0] || null)} />
                {logoPreview && <img src={logoPreview} alt="Logo preview" className="mt-2 h-20 w-20 rounded-lg object-cover" />}
              </Field>
              <Field label="College Banner">
                <input type="file" accept="image/*" onChange={(e) => onBannerChange(e.target.files?.[0] || null)} />
                {bannerPreview && <img src={bannerPreview} alt="Banner preview" className="mt-2 h-24 w-full rounded-lg object-cover" />}
              </Field>
              <Field label="Campus Images (multiple)">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setCampusFiles(Array.from(e.target.files || []))}
                />
                {campusFiles.length > 0 && <p className="mt-1 text-xs text-slate-500">{campusFiles.length} image(s) selected</p>}
              </Field>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Address" className="sm:col-span-2 lg:col-span-3">
                <textarea className={inputClass} rows={2} value={address.address} onChange={(e) => setAddress({ ...address, address: e.target.value })} />
              </Field>
              <Field label="City">
                <input className={inputClass} value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </Field>
              <Field label="District">
                <input className={inputClass} value={address.district} onChange={(e) => setAddress({ ...address, district: e.target.value })} />
              </Field>
              <Field label="State">
                <input className={inputClass} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </Field>
              <Field label="Country">
                <input className={inputClass} value={address.country} onChange={(e) => setAddress({ ...address, country: e.target.value })} />
              </Field>
              <Field label="Pincode">
                <input className={inputClass} value={address.pincode} onChange={(e) => setAddress({ ...address, pincode: e.target.value })} />
              </Field>
              <Field label="Google Map Location">
                <input className={inputClass} value={address.googleMapUrl} onChange={(e) => setAddress({ ...address, googleMapUrl: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 4 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Principal Name">
                <input className={inputClass} value={contacts.principalName} onChange={(e) => setContacts({ ...contacts, principalName: e.target.value })} />
              </Field>
              <Field label="Admission Officer">
                <input className={inputClass} value={contacts.admissionOfficer} onChange={(e) => setContacts({ ...contacts, admissionOfficer: e.target.value })} />
              </Field>
              <Field label="Admission Email">
                <input className={inputClass} value={contacts.admissionEmail} onChange={(e) => setContacts({ ...contacts, admissionEmail: e.target.value })} />
              </Field>
              <Field label="Admission Phone">
                <input className={inputClass} value={contacts.admissionPhone} onChange={(e) => setContacts({ ...contacts, admissionPhone: e.target.value })} />
              </Field>
              <Field label="WhatsApp Number">
                <input className={inputClass} value={contacts.whatsAppNumber} onChange={(e) => setContacts({ ...contacts, whatsAppNumber: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {courses.map((course, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-slate-800">Course {index + 1}</h3>
                    {courses.length > 1 && (
                      <button type="button" className="text-xs text-red-600" onClick={() => setCourses(courses.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {(
                      [
                        ['courseName', 'Course Name'],
                        ['degree', 'Degree'],
                        ['branch', 'Branch'],
                        ['duration', 'Duration (years)'],
                        ['intake', 'Intake'],
                        ['availableSeats', 'Available Seats'],
                        ['tuitionFee', 'Tuition Fee'],
                        ['hostelFee', 'Hostel Fee'],
                        ['transportFee', 'Transport Fee'],
                        ['examFee', 'Exam Fee'],
                        ['miscellaneousFee', 'Miscellaneous Fee'],
                      ] as const
                    ).map(([key, label]) => (
                      <Field key={key} label={label}>
                        <input
                          className={inputClass}
                          value={course[key]}
                          onChange={(e) => {
                            const nextCourses = [...courses];
                            nextCourses[index] = { ...course, [key]: e.target.value };
                            setCourses(nextCourses);
                          }}
                        />
                      </Field>
                    ))}
                    <Field label="Scholarship Information" className="sm:col-span-2 lg:col-span-3">
                      <input
                        className={inputClass}
                        value={course.scholarshipInfo}
                        onChange={(e) => {
                          const nextCourses = [...courses];
                          nextCourses[index] = { ...course, scholarshipInfo: e.target.value };
                          setCourses(nextCourses);
                        }}
                      />
                    </Field>
                    <Field label="Eligibility" className="sm:col-span-2 lg:col-span-3">
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={course.eligibility}
                        onChange={(e) => {
                          const nextCourses = [...courses];
                          nextCourses[index] = { ...course, eligibility: e.target.value };
                          setCourses(nextCourses);
                        }}
                      />
                    </Field>
                    <Field label="Description" className="sm:col-span-2 lg:col-span-3">
                      <textarea
                        className={inputClass}
                        rows={2}
                        value={course.description}
                        onChange={(e) => {
                          const nextCourses = [...courses];
                          nextCourses[index] = { ...course, description: e.target.value };
                          setCourses(nextCourses);
                        }}
                      />
                    </Field>
                  </div>
                  <p className="mt-3 text-xs font-medium text-slate-600">Total Fee: ₹{totalFee(course).toLocaleString('en-IN')}</p>
                </div>
              ))}
              <button type="button" className={button.secondary} onClick={() => setCourses([...courses, emptyCourse()])}>
                + Add Course
              </button>
            </div>
          )}

          {step === 6 && (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {FACILITY_OPTIONS.map((facility) => {
                const checked = facilities.includes(facility);
                return (
                  <label key={facility} className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm ${checked ? 'border-blue-500 bg-blue-50' : 'border-slate-200 bg-white'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setFacilities((prev) => (checked ? prev.filter((f) => f !== facility) : [...prev, facility]))
                      }
                    />
                    {facility}
                  </label>
                );
              })}
              {facilities.includes('Others') && (
                <div className="col-span-full">
                  <Field label="Other facility">
                    <input className={inputClass} value={otherFacility} onChange={(e) => setOtherFacility(e.target.value)} />
                  </Field>
                </div>
              )}
            </div>
          )}

          {step === 7 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Field label="Highest Package">
                <input className={inputClass} value={placements.highestPackage} onChange={(e) => setPlacements({ ...placements, highestPackage: e.target.value })} />
              </Field>
              <Field label="Average Package">
                <input className={inputClass} value={placements.averagePackage} onChange={(e) => setPlacements({ ...placements, averagePackage: e.target.value })} />
              </Field>
              <Field label="Placement Percentage">
                <input className={inputClass} value={placements.placementPercentage} onChange={(e) => setPlacements({ ...placements, placementPercentage: e.target.value })} />
              </Field>
              <Field label="Top Recruiters (comma separated)" className="sm:col-span-2 lg:col-span-3">
                <textarea className={inputClass} rows={2} value={placements.topRecruiters} onChange={(e) => setPlacements({ ...placements, topRecruiters: e.target.value })} />
              </Field>
            </div>
          )}

          {step === 8 && (
            <div className="space-y-4">
              {accreditations.map((item, index) => (
                <div key={index} className="rounded-xl border border-slate-200 bg-white p-4 sm:p-5">
                  <div className="mb-3 flex justify-between">
                    <h3 className="text-sm font-semibold">Accreditation {index + 1}</h3>
                    {accreditations.length > 1 && (
                      <button type="button" className="text-xs text-red-600" onClick={() => setAccreditations(accreditations.filter((_, i) => i !== index))}>
                        Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    <Field label="Accreditation Name">
                      <select
                        className={inputClass}
                        value={item.accreditationName}
                        onChange={(e) => {
                          const next = [...accreditations];
                          next[index] = { ...item, accreditationName: e.target.value };
                          setAccreditations(next);
                        }}
                      >
                        {ACCREDITATION_OPTIONS.map((opt) => (
                          <option key={opt}>{opt}</option>
                        ))}
                      </select>
                    </Field>
                    <Field label="Grade / Score">
                      <input
                        className={inputClass}
                        value={item.gradeOrScore}
                        onChange={(e) => {
                          const next = [...accreditations];
                          next[index] = { ...item, gradeOrScore: e.target.value };
                          setAccreditations(next);
                        }}
                      />
                    </Field>
                    <Field label="Certificate Number">
                      <input
                        className={inputClass}
                        value={item.certificateNumber}
                        onChange={(e) => {
                          const next = [...accreditations];
                          next[index] = { ...item, certificateNumber: e.target.value };
                          setAccreditations(next);
                        }}
                      />
                    </Field>
                    <Field label="Valid Till">
                      <input
                        type="date"
                        className={inputClass}
                        value={item.validTill}
                        onChange={(e) => {
                          const next = [...accreditations];
                          next[index] = { ...item, validTill: e.target.value };
                          setAccreditations(next);
                        }}
                      />
                    </Field>
                    <Field label="Certificate PDF" className="sm:col-span-2 lg:col-span-2">
                      <input
                        type="file"
                        accept="application/pdf,image/*"
                        onChange={(e) => {
                          const next = [...accreditations];
                          next[index] = { ...item, certificateFile: e.target.files?.[0] || null };
                          setAccreditations(next);
                        }}
                      />
                    </Field>
                  </div>
                </div>
              ))}
              <button type="button" className={button.secondary} onClick={() => setAccreditations([...accreditations, emptyAccreditation()])}>
                + Add Accreditation
              </button>
            </div>
          )}

          {step === 9 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {documents.map((doc, index) => (
                <Field key={doc.documentType} label={doc.documentType}>
                  <input
                    type="file"
                    accept="application/pdf,image/*"
                    onChange={(e) => {
                      const next = [...documents];
                      next[index] = { ...doc, file: e.target.files?.[0] || null };
                      setDocuments(next);
                    }}
                  />
                  {doc.file && <p className="mt-1 text-xs text-slate-500">{doc.file.name}</p>}
                </Field>
              ))}
            </div>
          )}

          {step === 10 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(['facebook', 'instagram', 'linkedin', 'twitter', 'youtube'] as const).map((platform) => (
                <Field key={platform} label={platform === 'twitter' ? 'Twitter / X' : platform[0].toUpperCase() + platform.slice(1)}>
                  <input className={inputClass} value={social[platform]} onChange={(e) => setSocial({ ...social, [platform]: e.target.value })} />
                </Field>
              ))}
            </div>
          )}
        </div>
      </main>

      <footer className="sticky bottom-0 z-20 shrink-0 border-t border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p className="text-sm text-slate-600">
            Already registered?{' '}
            <Link to="/login" className="font-semibold text-blue-600 hover:underline">
              Sign in
            </Link>
          </p>
          <div className="flex items-center justify-end gap-3">
            <button type="button" onClick={back} disabled={step === 0 || loading} className={`${button.secondary} disabled:opacity-40`}>
              Previous
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" onClick={next} className={button.primary}>
                Next
              </button>
            ) : (
              <button type="button" onClick={() => void onSubmit()} disabled={loading} className={`inline-flex items-center gap-2 ${button.primary}`}>
                {loading && <LoadingSpinner size="sm" />}
                Submit Registration
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`block space-y-1.5 ${className}`}>
      <span className={form.label}>{label}</span>
      {children}
    </label>
  );
}

const inputClass = `w-full ${form.input}`;
