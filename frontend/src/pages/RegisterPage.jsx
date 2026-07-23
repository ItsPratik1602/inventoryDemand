import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../components/AuthCard.jsx";
import FormInput from "../components/FormInput.jsx";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";

const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg"];
const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" rx="24" fill="#f3efe4"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#5a5e4d" font-family="Arial" font-size="22">Preview</text></svg>'
  );

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });

function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    gender: "",
    mobileNumber: "",
    profileImage: ""
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const previewImage = useMemo(
    () => form.profileImage || placeholderImage,
    [form.profileImage]
  );

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Name must be at least 2 characters long.";
    }

    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) {
      return "Enter a valid email address.";
    }

    if (form.password.length < 6) {
      return "Password must be at least 6 characters long.";
    }

    if (!form.gender) {
      return "Select a gender.";
    }

    if (!/^\d{10,15}$/.test(form.mobileNumber.trim())) {
      return "Mobile number must contain 10 to 15 digits.";
    }

    return "";
  };

  const handleImageChange = async (event) => {
    setError("");
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type)) {
      setError("Profile image must be PNG, JPG, or JPEG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Profile image must be 2MB or smaller.");
      return;
    }

    try {
      const profileImage = await fileToDataUrl(file);
      setForm((current) => ({ ...current, profileImage }));
    } catch (imageError) {
      setError(imageError.message);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        gender: form.gender,
        mobileNumber: form.mobileNumber.trim(),
        profileImage: form.profileImage || null
      };

      const response = await api.post("/auth/register", payload);
      login(response.data.data);
      const fallbackPath = {
        ADMIN: "/admin/dashboard",
        STAFF: "/app/products",
        CUSTOMER: "/"
      }[response.data.data.user.role] || "/";
      navigate(fallbackPath, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-12">
      <AuthCard
        title="Create account"
        description="Start using the Inventory Demand System with your profile details ready."
        footer={
          <>
            Already have an account?{" "}
            <Link to="/login" className="text-[color:var(--accent)]">
              Login
            </Link>
          </>
        }
      >
        <form className="space-y-4" onSubmit={handleSubmit}>
          <img
            src={previewImage}
            alt="Profile preview"
            className="mx-auto h-28 w-28 rounded-3xl object-cover"
          />

          <FormInput
            label="Name"
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            required
          />
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

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Gender</span>
            <select
              value={form.gender}
              onChange={(event) => setForm({ ...form, gender: event.target.value })}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 outline-none"
              required
            >
              <option value="">Select gender</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </label>

          <FormInput
            label="Mobile number"
            value={form.mobileNumber}
            onChange={(event) =>
              setForm({
                ...form,
                mobileNumber: event.target.value.replace(/[^\d]/g, "")
              })
            }
            placeholder="10 to 15 digits"
            required
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Profile image</span>
            <input
              type="file"
              accept=".png,.jpg,.jpeg,image/png,image/jpeg"
              onChange={handleImageChange}
              className="w-full rounded-2xl border border-[color:var(--line)] bg-white px-4 py-3 text-sm outline-none"
            />
            <p className="mt-2 text-xs text-[color:var(--muted)]">
              Optional. PNG, JPG, or JPEG up to 2MB.
            </p>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-[color:var(--accent)] px-4 py-3 font-medium text-white transition hover:opacity-90 disabled:opacity-60"
          >
            {submitting ? "Creating account..." : "Register"}
          </button>
        </form>
      </AuthCard>
    </div>
  );
}

export default RegisterPage;
