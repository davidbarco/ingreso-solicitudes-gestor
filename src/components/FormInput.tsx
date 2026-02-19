import { UseFormRegister, FieldErrors, RegisterOptions, FieldValues, Path } from 'react-hook-form';
import { InputHTMLAttributes } from 'react';

interface FormInputProps<T extends FieldValues> extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string;
  name: Path<T>;
  register: UseFormRegister<T>;
  errors: FieldErrors<T>;
  type?: string;
  validation?: RegisterOptions<T, Path<T>>;
}

const FormInput = <T extends FieldValues>({
  label,
  name,
  register,
  errors,
  type = "text",
  validation = {},
  ...props
}: FormInputProps<T>) => {
  return (
    <div className="form-group">
      <label htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        {...register(name, validation)}
        {...props}
      />
      {errors[name] && (
        <span className="error-message">{errors[name]?.message as string}</span>
      )}
    </div>
  );
};

export default FormInput;
