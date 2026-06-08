import { useFormContext } from 'react-hook-form';
import type { StudentProfileFormData } from '../../../types/studentProfile';
import { TextInput } from './FormField';
import { cardClassName, sectionSubtitleClassName, sectionTitleClassName } from './formStyles';

export function AcademicInformation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudentProfileFormData>();

  const percentageRule = {
    min: { value: 0, message: 'Percentage cannot be negative' },
    max: { value: 100, message: 'Percentage cannot exceed 100' },
  };

  return (
    <section className={cardClassName}>
      <div>
        <h2 className={sectionTitleClassName}>Academic Information</h2>
        <p className={sectionSubtitleClassName}>Share your academic background for admission evaluation.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextInput
          label="10th Percentage"
          type="number"
          step="0.01"
          required
          error={errors.tenthPercentage}
          {...register('tenthPercentage', {
            required: '10th percentage is required',
            valueAsNumber: true,
            ...percentageRule,
          })}
        />
        <TextInput
          label="12th Percentage"
          type="number"
          step="0.01"
          required
          error={errors.twelfthPercentage}
          {...register('twelfthPercentage', {
            required: '12th percentage is required',
            valueAsNumber: true,
            ...percentageRule,
          })}
        />
        <TextInput
          label="Qualification"
          required
          error={errors.qualification}
          placeholder="e.g. Intermediate, Diploma"
          {...register('qualification', { required: 'Qualification is required' })}
        />
        <TextInput
          label="Board"
          required
          error={errors.board}
          placeholder="e.g. CBSE, State Board"
          {...register('board', { required: 'Board is required' })}
        />
        <TextInput
          label="Passing Year"
          type="number"
          required
          error={errors.passingYear}
          placeholder="e.g. 2024"
          className="sm:col-span-2"
          {...register('passingYear', {
            required: 'Passing year is required',
            minLength: { value: 4, message: 'Enter a valid year' },
            maxLength: { value: 4, message: 'Enter a valid year' },
          })}
        />
      </div>
    </section>
  );
}
