import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import Pagination from "../components/Pagination.jsx";
import TableActionButtons from "../components/TableActionButtons.jsx";
import FormPanel from "../components/FormPanel.jsx";
import FormInput from "../components/FormInput.jsx";
import api from "../lib/api.js";
import { downloadCsv, downloadPdf } from "../utils/export.js";
import { useToast } from "../context/ToastContext.jsx";
import Button from "../components/Button.jsx";

const pageSize = 6;

function UsersPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [addUserForm, setAddUserForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "STAFF"
  });
  const [addUserLoading, setAddUserLoading] = useState(false);
  const [addUserError, setAddUserError] = useState("");

  const [sortField, sortOrder] = sortBy.split("-");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected = rows.length > 0 && rows.every((user) => selectedIds.includes(user.id));

  const exportPayload = {
    search,
    sortBy: sortField,
    order: sortOrder,
    roleFilter,
    genderFilter
  };

  const fetchUsers = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/users", {
        params: {
          page,
          limit: pageSize,
          search,
          sortBy: sortField,
          order: sortOrder,
          roleFilter,
          genderFilter
        }
      });

      const payload = response.data.data;
      
      // Transform nested data to flat structure for DataTable
      const formattedData = (payload?.items || []).map(user => ({
        id: user.id,
        name: user.name || "-",
        email: user.email || "-",
        mobileNumber: user.mobileNumber || null,
        gender: user.gender || null,
        role: user.role || "CUSTOMER",
        createdAt: user.createdAt
      }));
      
      setRows(formattedData);
      setTotal(payload?.total || 0);
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch users");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers().catch(() => {});
  }, [genderFilter, page, roleFilter, search, sortBy]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const handleDelete = async (id) => {
    setActionError("");

    try {
      await api.delete(`/users/${id}`);
      setSelectedIds((current) => current.filter((value) => value !== id));
      await fetchUsers();
      showToast({ type: "success", message: "User deleted successfully." });
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to delete user");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to delete user"
      });
    }
  };

  const handleRoleChange = async (id, role) => {
    setActionError("");

    try {
      await api.patch(`/users/${id}/role`, { role });
      await fetchUsers();
      showToast({ type: "success", message: "User role updated successfully." });
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to update role");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to update role"
      });
    }
  };

  const handleToggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !rows.some((user) => user.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...rows.map((user) => user.id)])]);
  };

  const handleToggleUser = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const handleExportCsv = async (ids = []) => {
    setActionError("");

    try {
      await downloadCsv("/users/export", ids, "users.csv", exportPayload);
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to export users");
    }
  };

  const handleExportPdf = async (ids = []) => {
    setActionError("");

    try {
      await downloadPdf("/users/export/pdf", { ...exportPayload, ids }, "users.pdf");
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to export users");
    }
  };

  const handleAddUser = async (event) => {
    event.preventDefault();
    setAddUserError("");
    setAddUserLoading(true);

    try {
      const response = await api.post("/users/create", addUserForm);
      await fetchUsers();
      setShowAddUserModal(false);
      setAddUserForm({
        name: "",
        email: "",
        password: "",
        role: "STAFF"
      });
      showToast({ type: "success", message: "User created successfully." });
    } catch (err) {
      setAddUserError(err.response?.data?.message || "Unable to create user");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to create user"
      });
    } finally {
      setAddUserLoading(false);
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Users"
        description="Review accounts, update roles safely, and work with the same server-backed table behavior used across the admin panel."
        action={
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => setShowAddUserModal(true)} className="min-w-[9.5rem]">
              Add User
            </Button>
            <ActionDropdown
              label="Export Selected"
              disabled={!selectedIds.length}
              items={[
                { label: "Export CSV", onClick: () => handleExportCsv(selectedIds) },
                { label: "Export PDF", onClick: () => handleExportPdf(selectedIds) }
              ]}
            />
            <ActionDropdown
              label="Export All"
              disabled={!total}
              items={[
                { label: "Export CSV", onClick: () => handleExportCsv([]) },
                { label: "Export PDF", onClick: () => handleExportPdf([]) }
              ]}
            />
          </div>
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,0.8fr))]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by name, email, or mobile"
          className="app-input"
        />
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="app-input">
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="email-asc">Email A-Z</option>
          <option value="email-desc">Email Z-A</option>
          <option value="mobileNumber-asc">Mobile A-Z</option>
          <option value="mobileNumber-desc">Mobile Z-A</option>
        </select>
        <select
          value={roleFilter}
          onChange={(event) => {
            setRoleFilter(event.target.value);
            setPage(1);
          }}
          className="app-input"
        >
          <option value="ALL">All roles</option>
          <option value="ADMIN">Admin</option>
          <option value="STAFF">Staff</option>
          <option value="CUSTOMER">Customer</option>
        </select>
        <select
          value={genderFilter}
          onChange={(event) => {
            setGenderFilter(event.target.value);
            setPage(1);
          }}
          className="app-input"
        >
          <option value="ALL">All genders</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
          <option value="OTHER">Other</option>
          <option value="NONE">Not set</option>
        </select>
      </div>

      <DataTable
        columns={[
          {
            key: "select",
            label: (
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={handleToggleAllVisible}
                aria-label="Select visible users"
              />
            ),
            render: (row) => {
              const userId = row?.id || row?.user?.id;
              return (
                <input
                  type="checkbox"
                  checked={userId ? selectedIds.includes(userId) : false}
                  onChange={() => userId && handleToggleUser(userId)}
                  aria-label={`Select user ${userId || 'unknown'}`}
                />
              );
            }
          },
          { key: "name", label: "Name" },
          { key: "email", label: "Email" },
          {
            key: "mobileNumber",
            label: "Mobile",
            render: (row) => row?.mobileNumber || "Not set"
          },
          {
            key: "gender",
            label: "Gender",
            render: (row) => row?.gender || "Not set"
          },
          {
            key: "role",
            label: "Role",
            render: (row) => {
              const userId = row?.id || row?.user?.id;
              const role = row?.role || 'CUSTOMER';
              return (
                <select
                  value={role}
                  onChange={(event) => userId && handleRoleChange(userId, event.target.value)}
                  disabled={role === "CUSTOMER"}
                  className={`app-input px-3 py-2 text-sm ${
                    role === "ADMIN"
                      ? "bg-blue-50 text-blue-700 border-blue-200"
                      : role === "STAFF"
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-50 text-gray-700 border-gray-200"
                  }`}
                >
                  <option value="ADMIN">Admin</option>
                  <option value="STAFF">Staff</option>
                  <option value="CUSTOMER">Customer</option>
                </select>
              );
            }
          },
          {
            key: "createdAt",
            label: "Created",
            render: (row) => row?.createdAt ? new Date(row.createdAt).toLocaleDateString() : "Not set"
          },
          {
            key: "actions",
            label: "Actions",
            render: (row) => {
              const userId = row?.id || row?.user?.id;
              return userId ? <TableActionButtons onDelete={() => handleDelete(userId)} /> : null;
            }
          }
        ]}
        rows={rows}
        emptyMessage={loading ? "Loading users..." : "No users match your filters."}
      />

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        currentCount={rows.length}
        onPrevious={() => setPage((current) => current - 1)}
        onNext={() => setPage((current) => current + 1)}
      />

      {/* Add User Modal */}
      {showAddUserModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="app-card w-full max-w-md mx-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-[color:var(--text)] mb-4">Add New User</h3>
              
              <form onSubmit={handleAddUser} className="space-y-4">
                {addUserError && (
                  <p className="text-sm text-red-600">{addUserError}</p>
                )}
                
                <FormInput
                  label="Name"
                  type="text"
                  value={addUserForm.name}
                  onChange={(event) => setAddUserForm({ ...addUserForm, name: event.target.value })}
                  required
                />
                
                <FormInput
                  label="Email"
                  type="email"
                  value={addUserForm.email}
                  onChange={(event) => setAddUserForm({ ...addUserForm, email: event.target.value })}
                  required
                />
                
                <FormInput
                  label="Password"
                  type="password"
                  value={addUserForm.password}
                  onChange={(event) => setAddUserForm({ ...addUserForm, password: event.target.value })}
                  required
                />
                
                <div>
                  <label className="block text-sm font-medium text-[color:var(--text)] mb-2">
                    Role
                  </label>
                  <select
                    value={addUserForm.role}
                    onChange={(event) => setAddUserForm({ ...addUserForm, role: event.target.value })}
                    className="app-input"
                    required
                  >
                    <option value="STAFF">Staff</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setShowAddUserModal(false)}
                    disabled={addUserLoading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={addUserLoading}
                    className="flex-1"
                  >
                    {addUserLoading ? "Creating..." : "Create User"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UsersPage;
