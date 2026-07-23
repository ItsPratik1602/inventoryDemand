function FormInput({ label, ...props }) {
  return (
    <label className="block">
      <span className="app-field-label">{label}</span>
      <input {...props} className="app-input" />
    </label>
  );
}

export default FormInput;
