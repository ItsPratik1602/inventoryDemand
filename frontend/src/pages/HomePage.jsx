import { Link } from "react-router-dom";

function HomePage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="glass-panel max-w-4xl rounded-[2rem] p-8 sm:p-12">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
          Inventory Demand System
        </p>
        <h1 className="mt-4 max-w-2xl text-5xl font-semibold leading-tight">
          Manage products, stock, sales, and demand in one simple workspace.
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-[color:var(--muted)]">
          A clean inventory management platform with secure authentication, low stock
          alerts, and moving-average demand prediction for everyday operations.
        </p>

        <div className="mt-8 flex flex-wrap gap-4">
          <Link
            to="/login"
            className="rounded-2xl bg-[color:var(--accent)] px-6 py-3 font-medium text-white transition hover:opacity-90"
          >
            Login
          </Link>
          <Link
            to="/register"
            className="rounded-2xl border border-[color:var(--line)] bg-white px-6 py-3 font-medium text-[color:var(--text)] transition hover:bg-[color:var(--accent-soft)]"
          >
            Register
          </Link>
        </div>
      </section>
    </div>
  );
}

export default HomePage;
