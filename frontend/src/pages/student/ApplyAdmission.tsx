import { useEffect, useState, type ChangeEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { createApplication } from '../../api/applications';
import { getSchools, getCourses } from '../../api/schools';
import { uploadDocument } from '../../api/admin';
import { DashboardLayout } from '../../components/layout/DashboardLayout';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { useToast } from '../../context/ToastContext';
import type { Course, School } from '../../types';

interface FormData {
  dob: string;
  gender: string;
  address: string;
  parentName: string;
  grade: string;
  board: string;
  percentage: number;
  schoolId: string;
  courseId: string;
}

interface UploadedDoc {
  documentType: string;
  fileUrl: string;
  name: string;
}

const STEPS = ['Student Details', 'Academic Details', 'School Selection', 'Documents', 'Preview'];

export function ApplyAdmission() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [step, setStep] = useState(0);
  const [schools, setSchools] = useState<School[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [docs, setDocs] = useState<UploadedDoc[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { register, handleSubmit, watch, setValue } = useForm<FormData>();

  const schoolId = watch('schoolId');

  useEffect(() => {
    getSchools({ limit: 100 }).then((res) => setSchools(res.data.data.schools));
  }, []);

  useEffect(() => {
    if (schoolId) {
      getCourses(schoolId).then((res) => setCourses(res.data.data));
      setValue('courseId', '');
    } else {
      setCourses([]);
    }
  }, [schoolId, setValue]);

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadDocument(file, documentType);
      setDocs((prev) => [
        ...prev.filter((d) => d.documentType !== documentType),
        { documentType, fileUrl: res.data.data.fileUrl, name: file.name },
      ]);
      showToast('Document uploaded', 'success');
    } catch {
      showToast('Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await createApplication({
        schoolId: data.schoolId,
        courseId: data.courseId,
        studentDetails: {
          dob: data.dob || null,
          gender: data.gender || null,
          address: data.address,
          parentName: data.parentName,
          grade: data.grade,
          board: data.board,
          percentage: data.percentage || null,
        },
        documents: docs.map((d) => ({ documentType: d.documentType, fileUrl: d.fileUrl })),
      });
      showToast('Application submitted successfully', 'success');
      navigate('/dashboard/student/applications');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Submit failed';
      showToast(msg, 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const values = watch();
  const selectedSchool = schools.find((s) => s.id === values.schoolId);
  const selectedCourse = courses.find((c) => c.id === values.courseId);

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold text-slate-900">Apply for Admission</h1>
      <div className="mt-4 flex flex-wrap gap-2">
        {STEPS.map((label, i) => (
          <span
            key={label}
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              i === step ? 'bg-blue-600 text-white' : i < step ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {i + 1}. {label}
          </span>
        ))}
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        {step === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of Birth"><input type="date" {...register('dob')} className={inp} /></Field>
            <Field label="Gender">
              <select {...register('gender')} className={inp}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </Field>
            <Field label="Address" className="sm:col-span-2"><input {...register('address')} className={inp} /></Field>
            <Field label="Parent / Guardian Name"><input {...register('parentName')} className={inp} /></Field>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Grade / Class"><input {...register('grade')} className={inp} /></Field>
            <Field label="Board"><input {...register('board')} className={inp} /></Field>
            <Field label="Percentage / CGPA"><input type="number" step="0.01" {...register('percentage', { valueAsNumber: true })} className={inp} /></Field>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-4">
            <Field label="Select School">
              <select {...register('schoolId', { required: true })} className={inp}>
                <option value="">Choose school</option>
                {schools.map((s) => (
                  <option key={s.id} value={s.id}>{s.schoolName} — {s.city}</option>
                ))}
              </select>
            </Field>
            <Field label="Select Course">
              <select {...register('courseId', { required: true })} className={inp} disabled={!schoolId}>
                <option value="">Choose course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.courseName} (Fees: {c.fees ?? 'N/A'})</option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {step === 3 && (
          <div className="space-y-4">
            {['marksheet', 'id_proof', 'photo'].map((type) => (
              <Field key={type} label={type.replace('_', ' ').toUpperCase()}>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={(e) => handleFileUpload(e, type)} disabled={uploading} className="text-sm" />
                {docs.find((d) => d.documentType === type) && (
                  <p className="mt-1 text-xs text-green-600">Uploaded: {docs.find((d) => d.documentType === type)?.name}</p>
                )}
              </Field>
            ))}
            {uploading && <LoadingSpinner />}
          </div>
        )}
        {step === 4 && (
          <div className="space-y-3 text-sm text-slate-700">
            <p><strong>Parent:</strong> {values.parentName || '—'}</p>
            <p><strong>Grade:</strong> {values.grade} | <strong>Board:</strong> {values.board}</p>
            <p><strong>School:</strong> {selectedSchool?.schoolName}</p>
            <p><strong>Course:</strong> {selectedCourse?.courseName}</p>
            <p><strong>Documents:</strong> {docs.length} uploaded</p>
          </div>
        )}
        <div className="mt-6 flex justify-between">
          <button type="button" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium disabled:opacity-40">
            Back
          </button>
          {step < 4 ? (
            <button type="button" onClick={() => setStep((s) => s + 1)} className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700">
              Next
            </button>
          ) : (
            <button type="submit" disabled={submitting} className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow-md hover:bg-blue-700 disabled:opacity-60">
              {submitting ? 'Submitting...' : 'Submit Application'}
            </button>
          )}
        </div>
      </form>
    </DashboardLayout>
  );
}

const inp = 'w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      {children}
    </div>
  );
}
