import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import FormPanel from "../components/FormPanel.jsx";
import FormInput from "../components/FormInput.jsx";
import DataTable from "../components/DataTable.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import Pagination from "../components/Pagination.jsx";
import TableActionButtons from "../components/TableActionButtons.jsx";
import ProductCard from "../components/ProductCard.jsx";
import api from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { downloadCsv, downloadPdf } from "../utils/export.js";
import { useToast } from "../context/ToastContext.jsx";
import InlineSpinner from "../components/InlineSpinner.jsx";
import Loader from "../components/Loader.jsx";
import Button from "../components/Button.jsx";

const pageSize = 6;

const emptyForm = {
  name: "",
  price: "",
  stockQuantity: "",
  categoryId: "",
  reorderLevel: "10"
};

function ProductsPage() {
  const { isAdmin, isStaff, isCustomer } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [rows, setRows] = useState([]);
  const [categories, setCategories] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  
  const [sortField, sortOrder] = sortBy.split("-");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected = rows.length > 0 && rows.every((product) => selectedIds.includes(product.id));
  const params = {
    search,
    sortBy: sortField,
    order: sortOrder,
    ...(isAdmin || isStaff ? { categoryFilter } : {})
  };

  const handleToggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !rows.some((product) => product.id === id)));
      return;
    }
    setSelectedIds((current) => [...new Set([...current, ...rows.map((product) => product.id)])]);
  };

  const handleToggle = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  // User-specific: increase page size for better card grid display
  const userPageSize = (isAdmin || isStaff) ? pageSize : 12;
  const userPageCount = Math.max(1, Math.ceil(total / userPageSize));

  const fetchProducts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/products", {
        params: {
          page: page, // Use page directly - no conversion needed
          limit: (isAdmin || isStaff) ? pageSize : userPageSize,
          search: debouncedSearch,
          sortBy: sortField,
          order: sortOrder,
          ...(isAdmin || isStaff ? { categoryFilter } : {})
        }
      });

      const payload = response.data.data;
      
      // Transform nested data to flat structure for DataTable
      const formattedData = (payload.items || []).map(product => ({
        id: product.id,
        name: product.name || "-",
        category: product.category?.name || "Uncategorized",
        price: Number(product.price) || 0,
        stockQuantity: product.stockQuantity || 0,
        inventory: product.inventory?.quantity || product.stockQuantity || 0,
        reorderLevel: product.reorderLevel || 0,
        description: product.description || "",
        createdAt: product.createdAt,
        createdBy: product.createdBy
      }));
      
      setRows(formattedData);
      setTotal(payload.total || 0);
      setSelectedIds((current) =>
        current.filter((id) => (payload.items || []).some((item) => item.id === id))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories/options");
      setCategories(response.data.data || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchProducts().catch(() => {});
  }, [categoryFilter, isAdmin, isStaff, page, debouncedSearch, sortBy]);

  useEffect(() => {
    fetchCategories().catch(() => {});
  }, []);

  useEffect(() => {
    if ((isAdmin || isStaff) && page > pageCount) {
      setPage(pageCount);
    } else if (isCustomer && page > userPageCount) {
      setPage(userPageCount);
    }
  }, [page, pageCount, userPageCount, isAdmin, isStaff, isCustomer]);

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setSelectedImages([]);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSaving(true);

    try {
      const payload = {
        name: form.name.trim(),
        price: Number(form.price),
        stockQuantity: Number(form.stockQuantity),
        categoryId: Number(form.categoryId),
        reorderLevel: Number(form.reorderLevel)
      };

      let productId;
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
        productId = editingId;
        showToast({ type: "success", message: "Product updated successfully." });
      } else {
        const response = await api.post("/products", payload);
        productId = response.data.data.id;
        showToast({ type: "success", message: "Product created successfully." });
      }

      // Upload images if any were selected
      if (selectedImages.length > 0 && productId) {
        await uploadProductImages(productId);
      }

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      setFormError(error.response?.data?.message || "Failed to save product");
    } finally {
      setSaving(false);
    }
  };

  const uploadProductImages = async (productId) => {
    if (selectedImages.length === 0) return;

    try {
      const formData = new FormData();
      selectedImages.forEach(image => {
        formData.append('images', image);
      });

      const response = await api.post(`/products/${productId}/images`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      showToast({ 
        type: "success", 
        message: response.data.data.message || "Images uploaded successfully." 
      });
      setSelectedImages([]);
    } catch (error) {
      console.error("Error uploading images:", error);
      showToast({ 
        type: "error", 
        message: error.response?.data?.message || "Failed to upload images" 
      });
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      price: String(product.price),
      stockQuantity: String(product.stockQuantity ?? 0),
      categoryId: product.categoryId ? String(product.categoryId) : "",
      reorderLevel: String(product.reorderLevel ?? 10)
    });
  };

  const handleDelete = async (id) => {
    setFormError("");

    try {
      await api.delete(`/products/${id}`);
      setSelectedIds((current) => current.filter((value) => value !== id));
      await fetchProducts();
      showToast({ type: "success", message: "Product deleted successfully." });
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to delete product");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to delete product"
      });
    }
  };

  const toggleProduct = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) => current.filter((id) => !rows.some((row) => row.id === id)));
      return;
    }

    setSelectedIds((current) => [...new Set([...current, ...rows.map((row) => row.id)])]);
  };

  const handleExport = async (ids = []) => {
    setExporting(true);
    setFormError("");

    try {
      const exportPayload = {
        search,
        sortBy: sortField,
        order: sortOrder,
        ...(isAdmin || isStaff ? { categoryFilter } : {})
      };
      await downloadCsv("/products/export", ids, "products.csv", exportPayload);
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to export products");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async (ids = []) => {
    setExporting(true);
    setFormError("");

    try {
      const exportPayload = {
        search,
        sortBy: sortField,
        order: sortOrder,
        ...(isAdmin || isStaff ? { categoryFilter } : {})
      };
      await downloadPdf("/products/export/pdf", { ...exportPayload, ids }, "products.pdf");
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to export products");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Products"
        description={
          (isAdmin || isStaff)
            ? "Manage products, pricing, stock levels, and category assignment from one place."
            : "Browse products with clear stock and category details."
        }
        action={
          (isAdmin || isStaff) ? (
            <div className="flex gap-3 items-center">
              <ActionDropdown
                label="Export Selected"
                disabled={exporting || !selectedIds.length}
                items={[
                  { label: "Export CSV", onClick: () => handleExport(selectedIds) },
                  { label: "Export PDF", onClick: () => handleExportPdf(selectedIds) }
                ]}
              />
              <ActionDropdown
                label="Export All"
                disabled={exporting || !total}
                items={[
                  { label: "Export CSV", onClick: () => handleExport([]) },
                  { label: "Export PDF", onClick: () => handleExportPdf([]) }
                ]}
              />
            </div>
          ) : null
        }
      />

      <div
        className={`grid gap-3 ${
          (isAdmin || isStaff)
            ? "xl:grid-cols-[minmax(0,1.45fr)_repeat(2,minmax(0,0.8fr))]"
            : "max-w-2xl mx-auto md:grid-cols-[1.2fr_0.8fr]"
        }`}
      >
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder={(isAdmin || isStaff) ? "Search by product name or category" : "Search products..."}
          className="app-input text-base"
        />
        <select value={sortBy} onChange={(event) => setSortBy(event.target.value)} className="app-input">
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="name-asc">Name A-Z</option>
          <option value="name-desc">Name Z-A</option>
          <option value="price-asc">Price low-high</option>
          <option value="price-desc">Price high-low</option>
          <option value="stock-asc">Stock low-high</option>
          <option value="stock-desc">Stock high-low</option>
        </select>
        {(isAdmin || isStaff) ? (
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              setPage(1);
            }}
            className="app-input"
          >
            <option value="ALL">All categories</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {isCustomer ? (
        // Customer view: Product cards grid
        <div className="space-y-6">
          {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader text="Loading products..." />
            </div>
          ) : rows.length === 0 ? (
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[color:var(--accent-soft)] mb-4">
                <svg className="w-8 h-8 text-[color:var(--accent)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-[color:var(--text)] mb-2">No products found</h3>
              <p className="text-sm text-[color:var(--muted)]">Try adjusting your search or filters</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 items-stretch w-full">
                {rows.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </>
          )}
        </div>
      ) : (
        // Admin/Staff view: Table only
        <div className={`grid gap-6 xl:grid-cols-[360px_1fr]`}>
          {/* LEFT COLUMN - Form (always visible) */}
          <div className="w-full">
            <FormPanel title={editingId ? "Edit product" : "Add product"}>
              <form className="grid gap-4 md:grid-cols-2" onSubmit={handleSubmit}>
                <FormInput
                  label="Product name"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                required
              />
              <FormInput
                label="Price"
                type="number"
                step="0.01"
                min="0"
                value={form.price}
                onChange={(event) => setForm({ ...form, price: event.target.value })}
                required
              />
              <FormInput
                label="Stock quantity"
                type="number"
                min="0"
                value={form.stockQuantity}
                onChange={(event) => setForm({ ...form, stockQuantity: event.target.value })}
                required
              />
              <FormInput
                label="Reorder level"
                type="number"
                min="0"
                value={form.reorderLevel}
                onChange={(event) => setForm({ ...form, reorderLevel: event.target.value })}
                required
              />
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[color:var(--text)]">
                  Category
                </span>
                <select
                  value={form.categoryId}
                  onChange={(event) => setForm({ ...form, categoryId: event.target.value })}
                  className="app-input"
                  required
                >
                  <option value="">Select category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </label>
              
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-semibold text-[color:var(--text)]">
                  Product Images
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(event) => setSelectedImages(Array.from(event.target.files))}
                  className="w-full px-3 py-2 border border-[color:var(--line)] rounded-lg text-sm bg-white"
                />
                {selectedImages.length > 0 && (
                  <p className="mt-2 text-xs text-[color:var(--muted)]">
                    {selectedImages.length} image(s) selected. First image will be primary.
                  </p>
                )}
              </label>
              {formError ? <p className="text-sm text-red-600 md:col-span-2">{formError}</p> : null}
              <div className="flex gap-3 md:col-span-2">
                <Button type="submit" variant="primary" disabled={saving}>
                  {saving ? (
                    <InlineSpinner label={editingId ? "Updating" : "Creating"} />
                  ) : editingId ? (
                    "Update"
                  ) : (
                    "Create"
                  )}
                </Button>
                {editingId ? (
                  <Button
                    type="button"
                    onClick={resetForm}
                    variant="secondary"
                  >
                    Cancel
                  </Button>
                ) : null}
              </div>
            </form>
            </FormPanel>
          </div>

          {/* RIGHT COLUMN - Table/Grid */}
          <div className="w-full">

          <div className="space-y-4">
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            
            <DataTable
              key={`products-${rows.length}-${page}-${JSON.stringify(sortBy)}`}
              columns={[
                {
                  key: "select",
                  label: (
                    <input
                      type="checkbox"
                      checked={allVisibleSelected}
                      onChange={handleToggleAllVisible}
                      aria-label="Select visible products"
                    />
                  ),
                  render: (row) => (
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(row.id)}
                      onChange={() => handleToggle(row.id)}
                      aria-label={`Select product ${row.name}`}
                    />
                  )
                },
                { key: "name", label: "Name" },
                { key: "category", label: "Category", render: (row) => row?.category || "Uncategorized" },
                { key: "price", label: "Price", render: (row) => {
                  const price = typeof row?.price === 'number' ? row.price : 0;
                  return `$${price.toFixed(2)}`;
                }},
                { key: "stockQuantity", label: "Stock", render: (row) => typeof row?.stockQuantity === 'number' ? row.stockQuantity : 0 },
                { key: "reorderLevel", label: "Reorder", render: (row) => typeof row?.reorderLevel === 'number' ? row.reorderLevel : 0 },
                {
                  key: "actions",
                  label: "Actions",
                  render: (row) => {
                  const productId = row?.id;
                  if (!productId) return null;
                  
                  return (
                    <TableActionButtons
                      onEdit={() => handleEdit(row)}
                      onDelete={() => handleDelete(productId)}
                    />
                  );
                }
                }
              ]}
              rows={rows}
              emptyMessage={loading ? "Loading products..." : "No products match your filters."}
            />
          </div>
          </div>
        </div>
      )}

      
      {(isAdmin || isStaff) ? (
        <Pagination
          page={page}
          pageCount={pageCount}
          total={total}
          pageSize={pageSize}
          currentCount={rows.length}
          onPrevious={() => setPage((current) => current - 1)}
          onNext={() => setPage((current) => current + 1)}
        />
      ) : isCustomer ? (
        <Pagination
          page={page}
          pageCount={userPageCount}
          total={total}
          pageSize={userPageSize}
          currentCount={rows.length}
          onPrevious={() => setPage((current) => current - 1)}
          onNext={() => setPage((current) => current + 1)}
        />
      ) : null}
    </div>
  );
}

export default ProductsPage;
