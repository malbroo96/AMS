import { useFormContext } from 'react-hook-form';
import type { StudentProfileFormData } from '../../../types/studentProfile';
import { SelectInput, TextInput } from './FormField';
import { cardClassName, sectionSubtitleClassName, sectionTitleClassName } from './formStyles';

const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export function PersonalInformation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudentProfileFormData>();

  return (
    <section className={cardClassName}>
      <div>
        <h2 className={sectionTitleClassName}>Personal Information</h2>
        <p className={sectionSubtitleClassName}>Update your basic identity and contact details.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextInput
          label="First Name"
          required
          error={errors.firstName}
          {...register('firstName', { required: 'First name is required' })}
        />
        <TextInput
          label="Last Name"
          required
          error={errors.lastName}
          {...register('lastName', { required: 'Last name is required' })}
        />

        <SelectInput label="Gender" required error={errors.gender} {...register('gender', { required: 'Gender is required' })}>
          <option value="">Select gender</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="other">Other</option>
        </SelectInput>

        <TextInput
          label="Date of Birth"
          type="date"
          required
          error={errors.dateOfBirth}
          {...register('dateOfBirth', { required: 'Date of birth is required' })}
        />

        <TextInput
          label="Mobile Number"
          type="tel"
          required
          error={errors.mobile}
          {...register('mobile', {
            required: 'Mobile number is required',
            minLength: { value: 10, message: 'Enter a valid 10-digit mobile number' },
            maxLength: { value: 15, message: 'Mobile number is too long' },
          })}
        />

        <TextInput
          label="Email"
          type="email"
          required
          error={errors.email}
          {...register('email', {
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Enter a valid email address',
            },
          })}
        />

        <SelectInput label="Blood Group" error={errors.bloodGroup} className="sm:col-span-2" {...register('bloodGroup')}>
          <option value="">Select blood group</option>
          {bloodGroups.map((group) => (
            <option key={group} value={group}>
              {group}
            </option>
          ))}
        </SelectInput>
      </div>
    </section>
  );
}
