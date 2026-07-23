import { useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import FormPanel from "../components/FormPanel.jsx";
import FormInput from "../components/FormInput.jsx";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";
import InlineSpinner from "../components/InlineSpinner.jsx";

const allowedImageTypes = ["image/png", "image/jpeg", "image/jpg"];
const placeholderImage =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160"><rect width="100%" height="100%" rx="24" fill="#f3efe4"/><text x="50%" y="52%" dominant-baseline="middle" text-anchor="middle" fill="#5a5e4d" font-family="Arial" font-size="22">Profile</text></svg>'
  );

const fileToDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Unable to read image file"));
    reader.readAsDataURL(file);
  });

function ProfilePage() {
  const { user, updateCurrentUser, isAdmin } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    name: user?.name || "",
    gender: user?.gender || "",
    mobileNumber: user?.mobileNumber || "",
    profileImage: user?.profileImage || ""
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
    const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);

  const previewImage = useMemo(
    () => form.profileImage || placeholderImage,
    [form.profileImage]
  );

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
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      console.log("Updating profile with data:", {
        name: form.name,
        gender: form.gender || null,
        mobileNumber: form.mobileNumber || null,
        profileImage: form.profileImage || null
      });
      
      const response = await api.patch("/auth/profile", {
        name: form.name,
        gender: form.gender || null,
        mobileNumber: form.mobileNumber || null,
        profileImage: form.profileImage || null
      });

      console.log("Profile update response:", response.data);
      updateCurrentUser(response.data.data);
      setSuccess("Profile updated successfully.");
      showToast({ type: "success", message: "Profile updated successfully." });
    } catch (requestError) {
      console.error("Profile update error:", requestError.response?.data);
      setError(requestError.response?.data?.message || "Unable to update profile");
      showToast({
        type: "error",
        message: requestError.response?.data?.message || "Unable to update profile"
      });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Validate passwords
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError("New password must be at least 6 characters long.");
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.patch("/auth/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });

      setSuccess("Password changed successfully.");
      showToast({ type: "success", message: "Password changed successfully." });
      
      // Clear password form
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Unable to change password");
      showToast({
        type: "error",
        message: requestError.response?.data?.message || "Unable to change password"
      });
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Profile"
        description="Keep your account details current without exposing role or email controls."
      />

      <div className="profile-container">
          {/* LEFT: Details + Update Form */}
          <div className="space-y-6">
            {/* Profile Details */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
              <div className="text-center mb-6">
                <img
                  src={previewImage}
                  alt={user?.name || "Profile"}
                  className="h-32 w-32 rounded-[1.25rem] object-cover mx-auto"
                />
              </div>
              <div className="space-y-3 text-sm">
                <p>
                  <span className="font-medium">Email:</span> {user?.email}
                </p>
                {isAdmin ? (
                  <p>
                    <span className="font-medium">Role:</span> {user?.role}
                  </p>
                ) : null}
                <p>
                  <span className="font-medium">Gender:</span> {user?.gender || "Not set"}
                </p>
                <p>
                  <span className="font-medium">Mobile:</span>{" "}
                  {user?.mobileNumber || "Not set"}
                </p>
              </div>
            </div>

            {/* Update Profile Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold mb-4">Update Profile</h3>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
            <div className="md:col-span-2">
              <FormInput
                label="Name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
                required
              />
            </div>

            <label className="block">
              <span className="app-field-label">Gender</span>
              <select
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({ ...current, gender: event.target.value }))
                }
                className="app-input"
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
                setForm((current) => ({
                  ...current,
                  mobileNumber: event.target.value.replace(/[^\d]/g, "")
                }))
              }
              placeholder="10 to 15 digits"
            />

            <label className="block md:col-span-2">
              <span className="app-field-label">Profile image</span>
              <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleImageChange}
                className="app-input text-sm"
              />
              <p className="mt-2 text-xs text-[color:var(--muted)]">
                PNG, JPG, or JPEG up to 2MB.
              </p>
            </label>

            {error ? <p className="text-sm text-red-600 md:col-span-2">{error}</p> : null}
            {success ? (
              <p className="text-sm text-emerald-600 md:col-span-2">{success}</p>
            ) : null}

            <div className="md:col-span-2">
              <button type="submit" disabled={saving} className="app-button app-button-primary">
                {saving ? <InlineSpinner label="Saving" /> : "Save profile"}
              </button>
            </div>
          </form>
            </div>
          </div>

          {/* RIGHT: Change Password */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
              <form className="grid gap-4" onSubmit={handlePasswordChange}>
                <FormInput
                  label="Current Password"
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, currentPassword: event.target.value }))
                  }
                  required
                />
                
                <FormInput
                  label="New Password"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, newPassword: event.target.value }))
                  }
                  required
                  minLength="6"
                />
                
                <FormInput
                  label="Confirm New Password"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((current) => ({ ...current, confirmPassword: event.target.value }))
                  }
                  required
                  minLength="6"
                />

                <div className="flex gap-3">
                  <button type="submit" disabled={changingPassword} className="flex-1 app-button app-button-primary">
                    {changingPassword ? <InlineSpinner label="Changing" /> : "Change Password"}
                  </button>
                </div>
              </form>
            </div>
      </div>
    </div>
  );
}

export default ProfilePage;

/* Add CSS for profile layout */
const style = document.createElement('style');
const css = '.profile-container { max-width: 1000px; margin: 0 auto; display: grid; grid-template-columns: 2fr 1fr; gap: 24px; } @media (max-width: 768px) { .profile-container { grid-template-columns: 1fr; } }';
style.textContent = css;
document.head.appendChild(style);

