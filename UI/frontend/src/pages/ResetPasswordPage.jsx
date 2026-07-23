import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import AuthCard from "../components/AuthCard.jsx";
import FormInput from "../components/FormInput.jsx";
import api from "../lib/api.js";

function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    setMessage("");

    try {
      const response = await api.post("/auth/reset-password", { token, password });
      setMessage(response.data.message);
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthCard
        title="Reset password"
        description="Choose a new password for your account."
        footer={
          <Link to="/login" className="text-[color:var(--accent)]">
            Back to login
          </Link>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormInput
            label="New password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
          {!token ? (
            <p className="text-sm text-red-600">A valid reset token is required.</p>
          ) : null}
          {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting || !token}
            className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Updating..." : "Reset password"}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}

export default ResetPasswordPage;
