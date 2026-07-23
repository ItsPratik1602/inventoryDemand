import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import FormInput from "../components/FormInput.jsx";
import FormPanel from "../components/FormPanel.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import InlineSpinner from "../components/InlineSpinner.jsx";
import Pagination from "../components/Pagination.jsx";
import TableActionButtons from "../components/TableActionButtons.jsx";
import Button from "../components/Button.jsx";
import api from "../lib/api.js";
import { downloadCsv } from "../utils/export.js";
import { useToast } from "../context/ToastContext.jsx";

const pageSize = 6;

const emptyForm = {
  name: "",
  description: ""
};

function CategoriesPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [descriptionFilter, setDescriptionFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editingCategory, setEditingCategory] = useState(null);
  const [form, setForm] = useState(emptyForm);

  const [sortField, sortOrder] = sortBy.split("-");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const allVisibleSelected =
    rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));

  const fetchCategories = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/categories", {
        params: {
          page,
          limit: pageSize,
          search,
          sortBy: sortField,
          order: sortOrder,
          descriptionFilter
        }
      });

      const payload = response.data.data;
      setRows(payload?.items || []);
      setTotal(payload?.total || 0);

      setSelectedIds((current) =>
        current.filter((id) => (payload?.items || []).some((item) => item.id === id))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, [descriptionFilter, page, search, sortBy]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingCategory(null);
  };

  const validateForm = () => {
    if (form.name.trim().length < 2) {
      return "Category name must be at least 2 characters.";
    }
    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    setActionError("");

    if (validationError) {
      setActionError(validationError);
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim()
      };

      if (editingCategory) {
        await api.put(`/categories/${editingCategory.id}`, payload);
        showToast({ type: "success", message: "Category updated successfully." });
      } else {
        await api.post("/categories", payload);
        showToast({ type: "success", message: "Category created successfully." });
      }

      resetForm();
      await fetchCategories();
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to save category");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to save category"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      description: category.description || ""
    });
  };

  const handleDelete = async (id) => {
    setActionError("");
    try {
      await api.delete(`/categories/${id}`);
      await fetchCategories();
      showToast({ type: "success", message: "Category deleted successfully." });
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to delete category");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to delete category"
      });
    }
  };

  const handleToggleCategory = (id) => {
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id]
    );
  };

  const handleToggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !rows.some((row) => row.id === id))
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...rows.map((row) => row.id)])
    ]);
  };

  const handleExport = async (ids = []) => {
    setExporting(true);
    setActionError("");

    try {
      await downloadCsv("/categories/export", ids, "categories.csv", {
        search,
        sortBy: sortField,
        order: sortOrder,
        descriptionFilter
      });
    } catch (err) {
      setActionError(err.response?.data?.message || "Unable to export categories");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Categories"
        description="Manage product categories with a clean and consistent workflow."
        action={
          <div className="flex items-center gap-3">
            <Button variant="primary" onClick={() => setEditingCategory(true)} className="min-w-[9.5rem]">
              Add Category
            </Button>
            <ActionDropdown
              label="Export Selected"
              disabled={exporting || !selectedIds.length}
              items={[
                { label: "Export CSV", onClick: () => handleExport(selectedIds) }
              ]}
            />
            <ActionDropdown
              label="Export All"
              disabled={exporting || !total}
              items={[
                { label: "Export CSV", onClick: () => handleExport([]) }
              ]}
            />
          </div>
        }
      />

      <div className="app-controls lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))] lg:grid">
        <input
          type="search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          placeholder="Search categories"
          className="app-input"
        />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="app-input"
        >
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
        </select>
        <select
          value={descriptionFilter}
          onChange={(e) => {
            setDescriptionFilter(e.target.value);
            setPage(1);
          }}
          className="app-input"
        >
          <option value="ALL">All descriptions</option>
          <option value="WITH_DESCRIPTION">With description</option>
          <option value="WITHOUT_DESCRIPTION">Without description</option>
        </select>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <FormPanel title={editingCategory ? "Edit category" : "Add category"}>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <FormInput
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <label className="block">
                <span className="app-field-label">Description</span>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={4}
                className="app-input resize-none"
              />
            </label>

            {actionError && (
              <p className="text-sm text-red-600">{actionError}</p>
            )}

            <div className="flex gap-3">
              <Button type="submit" variant="primary" disabled={saving}>
                {saving ? (
                  <InlineSpinner label={editingCategory ? "Updating" : "Creating"} />
                ) : editingCategory ? (
                  "Update"
                ) : (
                  "Create"
                )}
              </Button>
              {editingCategory && (
                <Button
                  type="button"
                  onClick={resetForm}
                  variant="secondary"
                >
                  Cancel
                </Button>
              )}
            </div>
          </form>
        </FormPanel>

        <div>
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

          <DataTable
            columns={[
              {
                key: "select",
                label: (
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={handleToggleAllVisible}
                  />
                ),
                render: (row) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => handleToggleCategory(row.id)}
                  />
                )
              },
              { key: "name", label: "Name" },
              {
                key: "description",
                label: "Description",
                render: (row) => row.description || "—"
              },
              {
                key: "productCount",
                label: "Products"
              },
              {
                key: "createdAt",
                label: "Created",
                render: (row) => {
                  if (!row.createdAt) return "Not set";
                  try {
                    return new Date(row.createdAt).toLocaleDateString();
                  } catch (error) {
                    return "Invalid Date";
                  }
                }
              },
              {
                key: "actions",
                label: "Actions",
                render: (row) => (
                  <TableActionButtons
                    onEdit={() => handleEdit(row)}
                    onDelete={() => handleDelete(row.id)}
                  />
                )
              }
            ]}
            rows={rows}
            emptyMessage={
              loading
                ? "Loading categories..."
                : "No categories found."
            }
          />
        </div>
      </div>

      <Pagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        currentCount={rows.length}
        onPrevious={() => setPage((current) => current - 1)}
        onNext={() => setPage((current) => current + 1)}
      />
    </div>
  );
}

export default CategoriesPage;
