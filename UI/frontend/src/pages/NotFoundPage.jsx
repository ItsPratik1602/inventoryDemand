import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { getHomeRoute } from "../utils/routeUtils.js";

function NotFoundPage() {
  const { user } = useAuth();
  const homeRoute = getHomeRoute(user?.role);

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="glass-panel max-w-xl rounded-[2rem] p-8 text-center sm:p-12">
        <p className="text-xs uppercase tracking-[0.35em] text-[color:var(--muted)]">
          Inventory Demand System
        </p>
        <h1 className="mt-4 text-4xl font-semibold">Page not found</h1>
        <p className="mt-4 text-[color:var(--muted)]">
          The page you requested does not exist or may have been moved.
        </p>
        <Link
          to={homeRoute}
          className="mt-8 inline-flex rounded-2xl bg-[color:var(--accent)] px-6 py-3 font-medium text-white transition hover:opacity-90"
        >
          Go to Home
        </Link>
      </section>
    </div>
  );
}

export default NotFoundPage;
