import { useEffect, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import FormPanel from "../components/FormPanel.jsx";
import DataTable from "../components/DataTable.jsx";
import FormInput from "../components/FormInput.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import InlineSpinner from "../components/InlineSpinner.jsx";
import Pagination from "../components/Pagination.jsx";
import TableActionButtons from "../components/TableActionButtons.jsx";
import Button from "../components/Button.jsx";
import api from "../lib/api.js";
import { downloadCsv, downloadPdf } from "../utils/export.js";
import { useToast } from "../context/ToastContext.jsx";

const pageSize = 6;

const emptyForm = {
  productId: "",
  quantity: ""
};

function SalesPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState(emptyForm);
  const [rows, setRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("createdAt-desc");
  const [quantityFilter, setQuantityFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formError, setFormError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [saving, setSaving] = useState(false);

  const [sortField, sortOrder] = sortBy.split("-");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.id));
  const exportPayload = {
    search,
    sortBy: sortField,
    order: sortOrder,
    quantityFilter
  };

  const fetchSales = async () => {
    setLoading(true);
    setError("");

    try {
      // Fetch from orders instead of sales table
      const response = await api.get("/admin/orders", {
        params: {
          page,
          limit: pageSize,
          search,
          sortBy: sortField,
          order: sortOrder
        }
      });
      
      // Transform orders data to flat structure for DataTable
      const orders = response.data.data?.items || [];
      const transformedRows = orders.map(order => ({
        id: order.id,
        orderId: order.id,
        user: order.user?.name || 'Unknown',
        userEmail: order.user?.email || '',
        totalAmount: Number(order.totalAmount) || 0,
        status: order.status || 'UNKNOWN',
        date: order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'Not set',
        createdAt: order.createdAt
      }));
      
      setRows(transformedRows);
      setTotal(response.data.data?.total || 0);
    } catch (requestError) {
      setError(requestError.response?.data?.message || "Failed to fetch orders data");
      setRows([]);
      setTotal(0);
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
    fetchSales().catch(() => {});
  }, [page, search, sortBy, quantityFilter]);

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
    setSaving(true);

    try {
      await api.post("/sales", {
        productId: Number(form.productId),
        quantity: Number(form.quantity)
      });
      setForm(emptyForm);
      await fetchSales();
      showToast({ type: "success", message: "Sale recorded successfully." });
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to record sale");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to record sale"
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setFormError("");

    try {
      await api.delete(`/sales/${id}`);
      await fetchSales();
      showToast({ type: "success", message: "Sale deleted successfully." });
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to delete sale");
      showToast({
        type: "error",
        message: err.response?.data?.message || "Unable to delete sale"
      });
    }
  };

  const toggleSale = (id) => {
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
      await downloadCsv("/sales/export", ids, "sales.csv", exportPayload);
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to export sales");
    } finally {
      setExporting(false);
    }
  };

  const handleExportPdf = async (ids = []) => {
    setExporting(true);
    setFormError("");

    try {
      await downloadPdf("/sales/export/pdf", { ...exportPayload, ids }, "sales.pdf");
    } catch (err) {
      setFormError(err.response?.data?.message || "Unable to export sales");
    } finally {
      setExporting(false);
    }
  };

  // Add safety check for critical data
if (loading && rows.length === 0) {
  return (
    <div className="app-page">
      <PageHeader
        title="Sales"
        description="Record transactions, keep the ledger searchable, and export the exact slice you are reviewing."
      />
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    </div>
  );
}

return (
    <div className="app-page">
      <PageHeader
        title="Sales"
        description="Record transactions, keep the ledger searchable, and export the exact slice you are reviewing."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionDropdown
              label="Export Selected"
              disabled={exporting || !selectedIds.length}
              items={[
                { label: "As CSV", onClick: () => handleExport(selectedIds) },
                { label: "As PDF", onClick: () => handleExportPdf(selectedIds) }
              ]}
            />
            <ActionDropdown
              label="Export All"
              disabled={exporting || !total}
              items={[
                { label: "As CSV", onClick: () => handleExport([]) },
                { label: "As PDF", onClick: () => handleExportPdf([]) }
              ]}
            />
          </div>
        }
      />

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
        <input
          type="search"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search by product name"
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
          <option value="quantity-asc">Quantity low-high</option>
          <option value="quantity-desc">Quantity high-low</option>
        </select>
        <select
          value={quantityFilter}
          onChange={(event) => {
            setQuantityFilter(event.target.value);
            setPage(1);
          }}
          className="app-input"
        >
          <option value="ALL">All sale sizes</option>
          <option value="STANDARD">Standard (&lt; 10)</option>
          <option value="BULK">Bulk (10+)</option>
        </select>
      </div>

      <div className="grid gap-6 xl:grid-cols-[360px_1fr]">
        <FormPanel title="Record sale">
          <form className="grid gap-4" onSubmit={handleSubmit}>
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
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </select>
            </label>
            <FormInput
              label="Quantity sold"
              type="number"
              min="1"
              value={form.quantity}
              onChange={(event) => setForm({ ...form, quantity: event.target.value })}
              required
            />
            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}
            <Button type="submit" disabled={saving} variant="primary">
              {saving ? <InlineSpinner label="Saving" /> : "Save sale"}
            </Button>
          </form>
        </FormPanel>

        <div className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          
          {/* Add safety check for rows data */}
          {!rows || rows.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
              <div className="text-gray-500">
                {loading ? "Loading sales data..." : "No sales records found"}
              </div>
            </div>
          ) : (
            <DataTable
            columns={[
              {
                key: "select",
                label: (
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select visible orders"
                  />
                ),
                render: (row) => {
                  const orderId = row?.id || row?.orderId;
                  return (
                    <input
                      type="checkbox"
                      checked={orderId ? selectedIds.includes(orderId) : false}
                      onChange={() => orderId && toggleSale(orderId)}
                      aria-label={`Select order ${orderId || 'unknown'}`}
                    />
                  );
                }
              },
              { key: "orderId", label: "Order ID", render: (row) => `#${row.orderId || 'unknown'}` },
              { key: "user", label: "Customer", render: (row) => row.user || 'Unknown' },
              { 
                key: "totalAmount", 
                label: "Total Amount",
                render: (row) => {
                  const amount = typeof row?.totalAmount === 'number' ? row.totalAmount : 0;
                  return `$${amount.toFixed(2)}`;
                }
              },
              { 
                key: "status", 
                label: "Status",
                render: (row) => {
                  const status = row?.status || 'UNKNOWN';
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' :
                      status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {status}
                    </span>
                  );
                }
              },
              {
                key: "date",
                label: "Date",
                render: (row) => row.date || 'Not set'
              }
            ]}
            rows={rows}
            emptyMessage={loading ? "Loading sales..." : "No sales match your filters."}
          />
          )}
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

export default SalesPage;
