import { useFormContext } from 'react-hook-form';
import type { StudentProfileFormData } from '../../../types/studentProfile';
import { TextInput } from './FormField';
import { cardClassName, sectionSubtitleClassName, sectionTitleClassName } from './formStyles';

export function AddressInformation() {
  const {
    register,
    formState: { errors },
  } = useFormContext<StudentProfileFormData>();

  return (
    <section className={cardClassName}>
      <div>
        <h2 className={sectionTitleClassName}>Address Information</h2>
        <p className={sectionSubtitleClassName}>Provide your current residential address.</p>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <TextInput
          label="Address Line 1"
          required
          error={errors.addressLine1}
          className="sm:col-span-2"
          {...register('addressLine1', { required: 'Address line 1 is required' })}
        />
        <TextInput
          label="Address Line 2"
          error={errors.addressLine2}
          className="sm:col-span-2"
          {...register('addressLine2')}
        />
        <TextInput label="City" required error={errors.city} {...register('city', { required: 'City is required' })} />
        <TextInput label="State" required error={errors.state} {...register('state', { required: 'State is required' })} />
        <TextInput
          label="Pincode"
          required
          error={errors.pincode}
          className="sm:col-span-2"
          {...register('pincode', {
            required: 'Pincode is required',
            pattern: { value: /^\d{6}$/, message: 'Enter a valid 6-digit pincode' },
          })}
        />
      </div>
    </section>
  );
}
