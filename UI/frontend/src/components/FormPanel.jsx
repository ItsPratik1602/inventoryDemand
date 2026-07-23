function FormPanel({ title, children }) {
  return (
    <div className="app-card p-5">
      <h3 className="app-section-title">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}

export default FormPanel;
