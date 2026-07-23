function AuthCard({ title, description, children, footer }) {
  return (
    <div className="glass-panel w-full max-w-md rounded-[2rem] p-8">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-[0.3em] text-[color:var(--muted)]">
          Inventory Demand System
        </p>
        <h1 className="mt-2 text-3xl font-semibold">{title}</h1>
        <p className="mt-2 text-sm text-[color:var(--muted)]">{description}</p>
      </div>

      {children}

      {footer ? <div className="mt-6 text-sm text-[color:var(--muted)]">{footer}</div> : null}
    </div>
  );
}

export default AuthCard;
