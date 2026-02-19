import React from 'react';

const FormInput = ({ label, name, register, errors, type = "text", validation = {}, ...props }) => {
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
        <span className="error-message">{errors[name]?.message}</span>
      )}
    </div>
  );
};

export default FormInput;
