import { useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard.jsx";
import FormInput from "../components/FormInput.jsx";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const submitInFlightRef = useRef(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setSubmitting(true);
    setError("");
    console.info("[auth] login submit fired once", form.email);

    try {
      const response = await api.post("/auth/login", form);
      login(response.data.data);
      const fallbackPath = {
        ADMIN: "/admin/dashboard",
        STAFF: "/app/products", 
        CUSTOMER: "/"
      }[response.data.data.user.role] || "/";
      navigate(location.state?.from?.pathname || fallbackPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    } finally {
      submitInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthCard
        title="Welcome back"
        description="Sign in to manage products, inventory, and sales."
        footer={
          <>
            No account yet? <Link to="/register" className="text-[color:var(--accent)]">Register</Link>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            label="Email"
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            required
          />
          <FormInput
            label="Password"
            type="password"
            value={form.password}
            onChange={(event) => setForm({ ...form, password: event.target.value })}
            required
          />
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>

        <div className="mt-4">
          <Link to="/forgot-password" className="text-sm text-[color:var(--accent)]">
            Forgot password?
          </Link>
        </div>
      </AuthCard>
    </div>
  );
}

export default LoginPage;
