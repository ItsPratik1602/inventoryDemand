import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import FormPanel from "../components/FormPanel.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import Modal from "../components/Modal.jsx";
import Button from "../components/Button.jsx";
import api from "../lib/api.js";
import { useToast } from "../context/ToastContext.jsx";

const pageSize = 10;

function CouponsPage() {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [allRows, setAllRows] = useState([]); // Store all coupons for frontend filtering
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [selectedIds, setSelectedIds] = useState([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [formError, setFormError] = useState("");

  // Debounced search
  const debouncedSearch = useMemo(() => {
    let timeoutId;
    return (value) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setSearch(value);
      }, 300);
    };
  }, []);

  // Search handler
  const handleSearch = (value) => {
    debouncedSearch(value);
  };

  // Fetch coupons
  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const response = await api.get("/coupons", {
        params: { 
          page, 
          limit: pageSize,
          status: statusFilter,
          sortBy,
          order: sortOrder
        }
      });
      const fetchedRows = response.data.data?.items || [];
      setAllRows(fetchedRows); // Store all coupons
      setTotal(response.data.data?.total || 0);
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
      setError(error.message);
      showToast({ type: "error", message: "Failed to load coupons" });
    } finally {
      setLoading(false);
    }
  };

  // Frontend filtering for search
  useEffect(() => {
    if (allRows.length === 0) {
      setRows([]);
      return;
    }

    let filteredRows = [...allRows];

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredRows = filteredRows.filter(coupon => 
        coupon.code.toLowerCase().includes(searchLower) ||
        coupon.type.toLowerCase().includes(searchLower)
      );
    }

    setRows(filteredRows);
  }, [search, allRows]);

  useEffect(() => {
    fetchCoupons();
  }, [page, statusFilter, sortBy, sortOrder]);

  // Toggle selection
  const handleToggle = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  // Toggle all visible
  const handleToggleAllVisible = () => {
    const allVisibleIds = rows.map((row) => row.id);
    setSelectedIds((current) =>
      current.length === allVisibleIds.length ? [] : allVisibleIds
    );
  };

  const allVisibleSelected = rows.length > 0 && selectedIds.length === rows.length;

  // Create/Update coupon
  const handleSaveCoupon = async (couponData, assignedUserIds) => {
    try {
      setFormError("");
      
      if (editingCoupon) {
        await api.put(`/coupons/${editingCoupon.id}`, couponData);
        await api.post(`/coupons/${editingCoupon.id}/users`, {
          userIds: assignedUserIds
        });
        showToast({ type: "success", message: "Coupon updated successfully" });
        setIsEditModalOpen(false);
        setEditingCoupon(null);
      } else {
        const response = await api.post("/coupons", couponData);
        await api.post(`/coupons/${response.data.data.id}/users`, {
          userIds: assignedUserIds
        });
        showToast({ type: "success", message: "Coupon created successfully" });
        setIsCreateModalOpen(false);
      }
      
      fetchCoupons();
      setSelectedIds([]);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to save coupon");
    }
  };

  // Toggle coupon status
  const handleToggleStatus = async (coupon) => {
    try {
      await api.patch(`/coupons/${coupon.id}/status`, {
        isActive: !coupon.isActive
      });
      showToast({ type: "success", message: `Coupon ${coupon.isActive ? "deactivated" : "activated"} successfully` });
      fetchCoupons();
    } catch (err) {
      showToast({ type: "error", message: "Failed to update coupon status" });
    }
  };

  // Delete coupon (soft delete)
  const handleDelete = async (coupon) => {
    try {
      await api.delete(`/coupons/${coupon.id}`);
      showToast({ type: "success", message: "Coupon deleted successfully" });
      fetchCoupons();
      setSelectedIds(selectedIds.filter((id) => id !== coupon.id));
    } catch (err) {
      showToast({ type: "error", message: "Failed to delete coupon" });
    }
  };

  // Edit coupon
  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setIsEditModalOpen(true);
  };

  // Export selected coupons
  const handleExport = (ids) => {
    // TODO: Implement CSV export
    showToast({ type: "info", message: "Export functionality coming soon" });
  };

  // Status badge helper
  const getStatusBadge = (status) => {
    const statusConfig = {
      Active: { bg: "bg-green-100", text: "text-green-700" },
      Disabled: { bg: "bg-gray-100", text: "text-gray-700" },
      Expired: { bg: "bg-red-100", text: "text-red-700" },
      "Used Up": { bg: "bg-orange-100", text: "text-orange-700" }
    };
    
    const config = statusConfig[status] || statusConfig.Active;
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {status}
      </span>
    );
  };

  // Usage display helper
  const getUsageDisplay = (coupon) => {
    if (coupon.usageLimit === null) {
      return `${coupon.usedCount} / ∞`;
    }
    return `${coupon.usedCount} / ${coupon.usageLimit}`;
  };

  const pageCount = Math.ceil(total / pageSize);

  const columns = [
    {
      key: "select",
      label: (
        <input
          type="checkbox"
          checked={allVisibleSelected}
          onChange={handleToggleAllVisible}
          aria-label="Select all coupons"
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedIds.includes(row.id)}
          onChange={() => handleToggle(row.id)}
          aria-label={`Select coupon ${row.code}`}
        />
      )
    },
    { key: "code", label: "Code" },
    {
      key: "type",
      label: "Type",
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          {row.type === "PERCENTAGE" ? "%" : "$"}
        </span>
      )
    },
    {
      key: "value",
      label: "Value",
      render: (row) => (
        <span className="font-medium">
          {row.type === "PERCENTAGE" ? `${row.value || 0}%` : `$${row.value || 0}`}
        </span>
      )
    },
    {
      key: "usage",
      label: "Usage",
      render: (row) => getUsageDisplay(row)
    },
    {
      key: "audience",
      label: "Audience",
      render: (row) => {
        const assignedCount = row.assignedUsers?.length || 0;
        return assignedCount > 0 ? `${assignedCount} assigned` : "Public";
      }
    },
    {
      key: "minCartValue",
      label: "Min Order",
      render: (row) => row.minCartValue ? `$${row.minCartValue}` : "No minimum"
    },
    {
      key: "expiresAt",
      label: "Expires",
      render: (row) => {
        const expiryDate = new Date(row.expiresAt);
        const isExpired = expiryDate < new Date();
        return (
          <span className={isExpired ? "text-red-600" : "text-gray-900"}>
            {expiryDate.toLocaleDateString()}
          </span>
        );
      }
    },
    {
      key: "status",
      label: "Status",
      render: (row) => {
        // Determine status based on isActive and expiry
        let status = "Active";
        const expiryDate = new Date(row.expiresAt);
        const now = new Date();
        
        if (!row.isActive) {
          status = "Disabled";
        } else if (expiryDate < now) {
          status = "Expired";
        }
        
        return getStatusBadge(status);
      }
    },
    {
      key: "actions",
      label: "Actions",
      render: (row) => (
        <div className="flex gap-2">
          <Button
            type="button"
            variant="soft"
            onClick={() => handleEdit(row)}
            size="small"
          >
            Edit
          </Button>
          <Button
            type="button"
            variant="info"
            onClick={() => {
              console.log("Button clicked - row.id:", row.id);
              if (row.id) {
                console.log("Navigating to:", `/admin/coupons/${row.id}/usage`);
                navigate(`/admin/coupons/${row.id}/usage`);
              } else {
                showToast({
                  type: 'error',
                  message: 'Invalid coupon ID'
                });
              }
            }}
            size="small"
          >
            View Usage
          </Button>
          <Button
            type="button"
            variant={row.isActive ? "warning" : "success"}
            onClick={() => handleToggleStatus(row)}
            size="small"
          >
            {row.isActive ? "Disable" : "Enable"}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={() => handleDelete(row)}
            size="small"
          >
            Delete
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coupon Management"
        subtitle="Create and manage discount coupons for your customers"
        action={
          <Button 
            onClick={() => {
              console.log("Add Coupon button clicked");
              console.log("Current modal state:", isCreateModalOpen);
              setIsCreateModalOpen(true);
              console.log("Modal state after set:", true);
            }}
            variant="primary"
          >
            Add Coupon
          </Button>
        }
      />

      <FormPanel
        title="Coupon Controls"
        actions={
          <div className="flex flex-wrap gap-3">
            <ActionDropdown
              label="Create Coupon"
              items={[
                { label: "Percentage Discount", onClick: () => setIsCreateModalOpen(true) },
                { label: "Fixed Amount Discount", onClick: () => setIsCreateModalOpen(true) }
              ]}
            />
            <ActionDropdown
              label="Export Selected"
              disabled={!selectedIds.length}
              items={[{ label: "As CSV", onClick: () => handleExport(selectedIds) }]}
            />
            <ActionDropdown
              label="Export All"
              disabled={!total}
              items={[{ label: "As CSV", onClick: () => handleExport([]) }]}
            />
          </div>
        }
      >
        <div className="app-controls lg:grid lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
          <input
            type="search"
            value={search}
            onChange={(event) => handleSearch(event.target.value)}
            placeholder="Search coupons..."
            className="app-input"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="app-select"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="used">Used Up</option>
          </select>
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(event) => {
              const [field, order] = event.target.value.split("-");
              setSortBy(field);
              setSortOrder(order);
            }}
            className="app-select"
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="code-asc">Code (A-Z)</option>
            <option value="code-desc">Code (Z-A)</option>
            <option value="value-desc">Value (High-Low)</option>
            <option value="value-asc">Value (Low-High)</option>
          </select>
        </div>
      </FormPanel>

      <div className="space-y-4">
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
        
        <DataTable
          columns={columns}
          rows={rows}
          emptyMessage={loading ? "Loading coupons..." : "No coupons found"}
        />
      </div>

      <div className="app-card app-pagination rounded-xl text-sm">
        <p>
          Showing {rows.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of{" "}
          {total}
        </p>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={page === 1}
            onClick={() => setPage((current) => current - 1)}
            className="app-button app-button-secondary rounded-xl px-3 py-2"
          >
            Previous
          </button>
          <span className="rounded-xl bg-[color:var(--accent)] px-3 py-2 font-semibold text-white shadow-sm">
            Page {page} / {pageCount}
          </span>
          <button
            type="button"
            disabled={page >= pageCount}
            onClick={() => setPage((current) => current + 1)}
            className="app-button app-button-secondary rounded-xl px-3 py-2"
          >
            Next
          </button>
        </div>
      </div>

      {/* Simple Add Coupon Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Add New Coupon</h3>
            
            <CouponForm 
              onSave={handleSaveCoupon}
              onCancel={() => setIsCreateModalOpen(false)}
              error={formError}
            />
          </div>
        </div>
      )}

      {isEditModalOpen && editingCoupon && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Edit Coupon</h3>
            
            <CouponForm 
              onSave={handleSaveCoupon}
              onCancel={() => {
                setIsEditModalOpen(false);
                setEditingCoupon(null);
              }}
              error={formError}
              coupon={editingCoupon}
            />
          </div>
        </div>
      )}
    </div>
  );

// Unified Coupon Form Component (handles both create and edit)
function CouponForm({ onSave, onCancel, error, coupon = null }) {
  const [formData, setFormData] = useState({
    code: coupon?.code || "",
    type: coupon?.type || "PERCENTAGE",
    value: coupon?.value || "",
    minCartValue: coupon?.minCartValue || "",
    maxDiscount: coupon?.maxDiscount || "",
    usageLimit: coupon?.usageLimit || "",
    perUserLimit: coupon?.perUserLimit?.toString() || "1",
    isFirstOrderOnly: coupon?.isFirstOrderOnly || false,
    startsAt: coupon?.startsAt ? new Date(coupon.startsAt).toISOString().slice(0, 16) : "",
    expiresAt: coupon?.expiresAt ? new Date(coupon.expiresAt).toISOString().split('T')[0] : "",
    isActive: coupon?.isActive !== false
  });
  const [userSearch, setUserSearch] = useState("");
  const [userOptions, setUserOptions] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState(coupon?.assignedUsers || []);
  const [userLoading, setUserLoading] = useState(false);
  const [userError, setUserError] = useState("");

  useEffect(() => {
    setSelectedUsers(coupon?.assignedUsers || []);
  }, [coupon]);

  useEffect(() => {
    let cancelled = false;

    const fetchUsers = async () => {
      setUserLoading(true);
      setUserError("");

      try {
        const response = await api.get("/users", {
          params: {
            page: 1,
            limit: 20,
            search: userSearch,
            sortBy: "name",
            order: "asc",
            roleFilter: "CUSTOMER",
            genderFilter: "ALL"
          }
        });

        if (!cancelled) {
          setUserOptions(response.data.data?.items || []);
        }
      } catch (err) {
        if (!cancelled) {
          setUserError(err.response?.data?.message || "Failed to load users");
        }
      } finally {
        if (!cancelled) {
          setUserLoading(false);
        }
      }
    };

    fetchUsers();

    return () => {
      cancelled = true;
    };
  }, [userSearch]);

  useEffect(() => {
    if (!coupon?.id) {
      return;
    }

    let cancelled = false;

    const fetchAssignedUsers = async () => {
      try {
        const response = await api.get(`/coupons/${coupon.id}/users`);
        if (!cancelled) {
          setSelectedUsers(response.data.data || []);
        }
      } catch (err) {
        if (!cancelled) {
          setUserError(err.response?.data?.message || "Failed to load assigned users");
        }
      }
    };

    fetchAssignedUsers();

    return () => {
      cancelled = true;
    };
  }, [coupon?.id]);

  const addSelectedUser = (user) => {
    setSelectedUsers((current) => (
      current.some((selectedUser) => selectedUser.id === user.id)
        ? current
        : [...current, user]
    ));
  };

  const removeSelectedUser = (userId) => {
    setSelectedUsers((current) => current.filter((user) => user.id !== userId));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Convert form data to correct types
    const submitData = {
      code: formData.code,
      type: formData.type,
      value: parseFloat(formData.value),
      minCartValue: parseFloat(formData.minCartValue) || null,
      maxDiscount: parseFloat(formData.maxDiscount) || null,
      usageLimit: parseInt(formData.usageLimit) || null,
      perUserLimit: parseInt(formData.perUserLimit) || 1,
      isFirstOrderOnly: formData.isFirstOrderOnly,
      startsAt: formData.startsAt ? new Date(formData.startsAt).toISOString() : null,
      expiresAt: new Date(formData.expiresAt).toISOString(),
      isActive: formData.isActive
    };
    
    console.log("Submitting coupon data:", submitData);
    onSave(submitData, selectedUsers.map((user) => user.id));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Coupon Code</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter coupon code"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData({...formData, type: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="PERCENTAGE">Percentage Discount</option>
            <option value="FIXED">Fixed Amount Discount</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Value</label>
          <input
            type="number"
            step="0.01"
            value={formData.value}
            onChange={(e) => setFormData({...formData, value: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={formData.type === "PERCENTAGE" ? "Enter percentage (e.g., 10)" : "Enter fixed amount (e.g., 50)"}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Minimum Cart Value</label>
          <input
            type="number"
            step="0.01"
            value={formData.minCartValue}
            onChange={(e) => setFormData({...formData, minCartValue: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter minimum cart value"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Maximum Discount (for % coupons)</label>
          <input
            type="number"
            step="0.01"
            value={formData.maxDiscount}
            onChange={(e) => setFormData({...formData, maxDiscount: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter maximum discount amount"
            disabled={formData.type === "FIXED"}
          />
          {formData.type === "FIXED" && (
            <p className="text-xs text-gray-500 mt-1">Not applicable for fixed amount coupons</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Usage Limit (optional)</label>
          <input
            type="number"
            value={formData.usageLimit}
            onChange={(e) => setFormData({...formData, usageLimit: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter usage limit (leave empty for unlimited)"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Per User Limit</label>
          <input
            type="number"
            value={formData.perUserLimit}
            onChange={(e) => setFormData({...formData, perUserLimit: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter per-user usage limit"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date (optional)</label>
          <input
            type="datetime-local"
            value={formData.startsAt}
            onChange={(e) => setFormData({...formData, startsAt: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
          <input
            type="date"
            value={formData.expiresAt}
            onChange={(e) => setFormData({...formData, expiresAt: e.target.value})}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isFirstOrderOnly}
            onChange={(e) => setFormData({...formData, isFirstOrderOnly: e.target.checked})}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">First Order Only</label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label className="ml-2 text-sm text-gray-700">Active</label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 p-4 space-y-4">
        <div>
          <h4 className="text-sm font-semibold text-gray-900">Coupon Audience</h4>
          <p className="text-sm text-gray-500">
            Leave empty to make this a public coupon. Add customers to restrict usage to specific users.
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Search Customers</label>
          <input
            type="search"
            value={userSearch}
            onChange={(e) => setUserSearch(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search by name or email"
          />
          {userError ? <p className="mt-2 text-sm text-red-600">{userError}</p> : null}
        </div>

        <div className="rounded-lg border border-gray-200">
          <div className="px-3 py-2 border-b border-gray-200 text-sm font-medium text-gray-700">
            Matching customers
          </div>
          <div className="max-h-48 overflow-y-auto divide-y divide-gray-100">
            {userLoading ? (
              <div className="px-3 py-4 text-sm text-gray-500">Loading customers...</div>
            ) : userOptions.length === 0 ? (
              <div className="px-3 py-4 text-sm text-gray-500">No customers found</div>
            ) : (
              userOptions.map((user) => {
                const isSelected = selectedUsers.some((selectedUser) => selectedUser.id === user.id);

                return (
                  <button
                    key={user.id}
                    type="button"
                    onClick={() => addSelectedUser(user)}
                    disabled={isSelected}
                    className="w-full px-3 py-3 text-left hover:bg-gray-50 disabled:bg-gray-50 disabled:text-gray-400"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                      <span className="text-sm font-medium text-blue-600">
                        {isSelected ? "Added" : "Add"}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div>
          <div className="mb-2 text-sm font-medium text-gray-700">
            Assigned users ({selectedUsers.length})
          </div>
          {selectedUsers.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-300 px-3 py-4 text-sm text-gray-500">
              No users assigned. This coupon will be public.
            </div>
          ) : (
            <div className="space-y-2">
              {selectedUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                >
                  <div>
                    <div className="text-sm font-medium text-gray-900">{user.name}</div>
                    <div className="text-sm text-gray-500">{user.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeSelectedUser(user.id)}
                    className="text-sm font-medium text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {coupon ? "Update Coupon" : "Create Coupon"}
        </button>
      </div>
    </form>
  );
}

}

export default CouponsPage;
