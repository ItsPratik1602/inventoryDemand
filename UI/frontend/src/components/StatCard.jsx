function StatCard({ label, value }) {
  return (
    <div className="app-card flex h-full min-h-[8.75rem] flex-col justify-between p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-[color:var(--text)]">
        {value}
      </p>
    </div>
  );
}

export default StatCard;
