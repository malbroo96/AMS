import { useFormContext } from 'react-hook-form';
import type { StudentProfileFormData } from '../../../types/studentProfile';
import { TextInput } from './FormField';
import { cardClassName, sectionSubtitleClassName, sectionTitleClassName } from './formStyles';

export function EmergencyContact() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudentProfileFormData>();

  return (
    <section className={cardClassName}>
      <div>
        <h2 className={sectionTitleClassName}>Emergency Contact</h2>
        <p className={sectionSubtitleClassName}>Add family or guardian details for admission correspondence.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Father Name"
          required
          error={errors.fatherName}
          {...register('fatherName', { required: 'Father name is required' })}
        />
        <TextInput label="Mother Name" error={errors.motherName} {...register('motherName')} />
        <TextInput
          label="Guardian Name"
          required
          error={errors.guardianName}
          {...register('guardianName', { required: 'Guardian name is required' })}
        />
        <TextInput
          label="Emergency Contact Number"
          type="tel"
          required
          error={errors.emergencyContactNumber}
          {...register('emergencyContactNumber', {
            required: 'Emergency contact number is required',
            minLength: { value: 10, message: 'Enter a valid contact number' },
            maxLength: { value: 15, message: 'Contact number is too long' },
          })}
        />
      </div>
    </section>
  );
}
