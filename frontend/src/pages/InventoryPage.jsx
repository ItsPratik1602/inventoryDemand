import { useEffect, useRef, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import FormPanel from "../components/FormPanel.jsx";
import FormInput from "../components/FormInput.jsx";
import DataTable from "../components/DataTable.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import InlineSpinner from "../components/InlineSpinner.jsx";
import Pagination from "../components/Pagination.jsx";
import Button from "../components/Button.jsx";
import api from "../lib/api.js";
import { downloadCsv, downloadPdf } from "../utils/export.js";
import { useToast } from "../context/ToastContext.jsx";

const pageSize = 6;

const emptyForm = {
  productId: "",
  quantity: ""
};

function InventoryPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importSummary, setImportSummary] = useState(null);
  const [submitMessage, setSubmitMessage] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const fileInputRef = useRef(null);

  const [sortField, sortOrder] = sortBy.split("-");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const exportPayload = {
    search,
    sortBy: sortField,
    order: sortOrder,
    stockFilter
  };
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(productQuery.trim().toLowerCase())
  );

  const fetchInventory = async () => {
    setLoading(true);
    setError("");

    try {
      console.log("Fetching inventory with params:", {
        page,
        limit: pageSize,
        search,
        sortBy: sortField,
        order: sortOrder,
        stockFilter
      });
      
      const response = await api.get("/inventory", {
        params: {
          page,
          limit: pageSize,
          search,
          sortBy: sortField,
          order: sortOrder,
          stockFilter
        }
      });

      const payload = response.data.data; // Backend returns data wrapped in data.data
      
      // Transform nested data to flat structure for DataTable
      const formattedData = (payload?.items || []).map(item => ({
        id: item.id,
        productId: item.productId,
        name: item.product?.name || "-",
        category: item.product?.category?.name || "Uncategorized",
        quantity: item.quantity || 0,
        price: Number(item.product?.price) || 0,
        reorderLevel: item.product?.reorderLevel || 0,
        createdAt: item.createdAt
      }));
      
      setRows(formattedData);
      setTotal(payload?.total || 0);
      setSelectedIds((current) =>
        current.filter((id) => (payload?.items || []).some((item) => item.id === id))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get("/products/options");
      setProducts(response.data.data || []);
    } catch {
      setProducts([]);
    }
  };

  useEffect(() => {
    fetchInventory().catch(() => {});
  }, [page, search, sortBy, stockFilter]);

  useEffect(() => {
    fetchProducts().catch(() => {});
  }, []);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setFormError("");
    setSubmitMessage("");
    setSubmitting(true);

    try {
      await api.put("/inventory", {
        productId: Number(form.productId),
        quantity: Number(form.quantity)
      });
      setForm(emptyForm);
      setProductQuery("");
      setSubmitMessage("Inventory updated successfully.");
      await fetchInventory();
      showToast({ type: "success", message: "Inventory updated successfully." });
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to update inventory");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to update inventory"
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleItem = (id) => {
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
      await downloadCsv("/inventory/export", ids, "inventory.csv", exportPayload);
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to export inventory");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async (ids = []) => {
    setExporting(true);
    setFormError("");

    try {
      await downloadPdf("/inventory/export/pdf", { ...exportPayload, ids }, "inventory.pdf");
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to export inventory");
    } finally {
      setExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = async (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
      setFormError("Please choose a CSV file.");
      event.target.value = "";
      return;
    }

    setFormError("");
    setImportSummary(null);
    setSubmitting(false);
    setImporting(true);

    try {
      const content = await file.text();
      const response = await api.post("/inventory/import/csv", {
        filename: file.name,
        content
      });

      setImportSummary(response.data.data);
      await fetchInventory();
      showToast({ type: "success", message: "Inventory CSV imported successfully." });
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to import inventory CSV");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to import inventory CSV"
      });
    } finally {
      setImporting(false);
      event.target.value = "";
    }
  };

  const getStockTone = (row) => {
    // Safety checks for row and quantity
    if (!row || typeof row !== 'object') {
      return {
        label: "Unknown",
        className: "status-badge status-badge-unknown"
      };
    }

    const quantity = typeof row.quantity === 'number' ? row.quantity : 0;
    const reorderLevel = typeof row?.reorderLevel === 'number' ? row.reorderLevel : 0;

    if (quantity <= 0) {
      return {
        label: "Out of stock",
        className: "status-badge status-badge-danger"
      };
    }

    if (quantity <= reorderLevel) {
      return {
        label: "Low stock",
        className: "status-badge status-badge-warn"
      };
    }

    return {
      label: "Healthy",
      className: "status-badge status-badge-ok"
    };
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Inventory"
        description="Keep stock levels accurate with a tighter workflow, clearer signals, and export/import actions that stay out of the way."
        action={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={handleImportClick}
              variant="primary"
              disabled={importing}
              className="min-w-[9.5rem]"
            >
              {importing ? <InlineSpinner label="Importing" /> : "Import CSV"}
            </Button>
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
        }
      />

      {importSummary ? (
        <div className="app-card rounded-xl px-4 py-3 text-sm">
          <p className="font-medium text-[color:var(--text)]">
            Import completed: {importSummary.success} succeeded, {importSummary.failed} failed.
          </p>
          {importSummary.errors?.length ? (
            <div className="mt-2 space-y-1 text-red-600">
              {importSummary.errors.slice(0, 5).map((item) => (
                <p key={`${item.row}-${item.message}`}>
                  Row {item.row}: {item.message}
                </p>
              ))}
              {importSummary.errors.length > 5 ? (
                <p>+ {importSummary.errors.length - 5} more errors</p>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_repeat(2,minmax(0,0.8fr))]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by product name or category..."
          className="app-input"
        />
        <select
          value={sortBy}
          onChange={(event) => setSortBy(event.target.value)}
          className="app-input"
        >
          <option value="createdAt-desc">Newest first</option>
          <option value="createdAt-asc">Oldest first</option>
          <option value="productName-asc">Product A-Z</option>
          <option value="productName-desc">Product Z-A</option>
          <option value="quantity-asc">Stock low-high</option>
          <option value="quantity-desc">Stock high-low</option>
        </select>
        <select
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value);
            setPage(1);
          }}
          className="app-input"
        >
          <option value="ALL">All stock states</option>
          <option value="IN_STOCK">In stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </select>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <FormPanel title="Update stock">
          <form className="grid gap-3" onSubmit={handleSubmit}>
            <FormInput
              label="Find product"
              value={productQuery}
              onChange={(event) => setProductQuery(event.target.value)}
              placeholder="Type to filter products"
              list="inventory-product-options"
            />
            <label className="block">
              <span className="mb-2 block text-sm font-semibold text-[color:var(--text)]">
                Product
              </span>
              <select
                value={form.productId}
                onChange={(event) => setForm({ ...form, productId: event.target.value })}
                className="app-input"
                required
              >
                <option value="">Select a product</option>
                {filteredProducts.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
              <datalist id="inventory-product-options">
                {products.map((product) => (
                  <option key={`product-search-${product.id}`} value={product.name} />
                ))}
              </datalist>
            </label>
            <FormInput
              label="Quantity"
              type="number"
              min="0"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              required
            />
            {submitMessage ? (
              <p className="rounded-xl bg-[color:var(--accent-soft)] px-3 py-2 text-sm font-medium text-[color:var(--accent)]">
                {submitMessage}
              </p>
            ) : null}
            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            <Button
              type="submit"
              disabled={submitting}
              variant="primary"
              className="w-full"
            >
              {submitting ? <InlineSpinner label="Saving" /> : "Save inventory"}
            </Button>
          </form>
        </FormPanel>

        <div className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="app-card flex items-center justify-between rounded-xl px-4 py-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Visible stock rows
              </p>
              <p className="mt-1 text-lg font-semibold text-[color:var(--text)]">{rows.length}</p>
            </div>
            {(loading || exporting || importing) ? (
              <InlineSpinner
                label={loading ? "Loading table" : exporting ? "Exporting" : "Importing"}
              />
            ) : null}
          </div>
          <DataTable
            columns={[
              {
                key: "select",
                label: (
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select visible inventory rows"
                  />
                ),
                render: (row) => (
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleItem(row.id)}
                    aria-label={`Select inventory row ${row.id}`}
                  />
                )
              },
              { key: "name", label: "Product", render: (row) => row.name },
              {
                key: "status",
                label: "Status",
                render: (row) => {
                  const tone = getStockTone(row);
                  return <span className={tone.className}>{tone.label}</span>;
                }
              },
              { key: "quantity", label: "Current stock" },
              {
                key: "reorderLevel",
                label: "Reorder level",
                render: (row) => row.reorderLevel || 0
              },
              {
                key: "price",
                label: "Unit price",
                render: (row) => {
                  const price = typeof row?.price === 'number' ? row.price : 0;
                  return `$${price.toFixed(2)}`;
                }
              },
              {
                key: "category",
                label: "Category",
                render: (row) => row.category || "Uncategorized"
              }
            ]}
            rows={rows}
            emptyMessage={loading ? "Loading inventory..." : "No inventory records match your filters."}
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
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv"
        onChange={handleImportFile}
        className="hidden"
      />
    </div>
  );
}

export default InventoryPage;
