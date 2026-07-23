import { useEffect, useMemo, useState } from "react";
import PageHeader from "../components/PageHeader.jsx";
import DataTable from "../components/DataTable.jsx";
import FormPanel from "../components/FormPanel.jsx";
import ActionDropdown from "../components/ActionDropdown.jsx";
import api from "../lib/api.js";
import { downloadCsv } from "../utils/export.js";
import { useToast } from "../context/ToastContext.jsx";

const pageSize = 6;

function AlertsPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState("quantity-asc");
  const [stockFilter, setStockFilter] = useState("ALL");
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [exporting, setExporting] = useState(false);

  const [sortField, sortOrder] = sortBy.split("-");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const allVisibleSelected = rows.length > 0 && rows.every((row) => selectedIds.includes(row.inventoryId));

  const summary = useMemo(() => {
    const critical = rows.filter(
      (alert) => alert.quantity <= Math.max(0, Math.floor(alert.threshold / 2))
    ).length;

    return {
      visible: rows.length,
      critical
    };
  }, [rows]);

  const fetchAlerts = async () => {
    setLoading(true);
    setError("");

    try {
      const response = await api.get("/alerts", {
        params: {
          page,
          limit: pageSize,
          search,
          sortBy: sortField,
          order: sortOrder,
          stockFilter
        }
      });

      const payload = response.data.data;
      
      // Transform nested data to flat structure for DataTable
      const formattedData = (payload?.items || []).map(alert => ({
        id: alert.inventoryId, // Use inventoryId as the unique ID
        inventoryId: alert.inventoryId,
        productId: alert.productId,
        productName: alert.productName || "-",
        category: alert.category || "Uncategorized",
        quantity: alert.quantity || 0,
        threshold: alert.threshold || 0,
        demandPrediction: alert.demandPrediction || 0
      }));
      
      setRows(formattedData);
      setTotal(payload?.total || 0);
      setSelectedIds((current) =>
        current.filter((id) => (payload?.items || []).some((item) => item.inventoryId === id))
      );
    } catch (err) {
      setError(err.response?.data?.message || "Unable to fetch alerts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts().catch(() => {});
  }, [page, search, sortBy, stockFilter]);

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const toggleAlert = (id) => {
    setSelectedIds((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id]
    );
  };

  const toggleAllVisible = () => {
    if (allVisibleSelected) {
      setSelectedIds((current) =>
        current.filter((id) => !rows.some((row) => row.inventoryId === id))
      );
      return;
    }

    setSelectedIds((current) => [
      ...new Set([...current, ...rows.map((row) => row.inventoryId)])
    ]);
  };

  const handleExport = async (ids = []) => {
    setExporting(true);
    setActionError("");

    try {
      await downloadCsv("/alerts/export", ids, "alerts.csv", {
        search,
        sortBy: sortField,
        order: sortOrder,
        stockFilter
      });
    } catch (requestError) {
      setActionError(requestError.response?.data?.message || "Unable to export alerts");
      showToast({
        type: "error",
        message: requestError.response?.data?.message || "Unable to export alerts"
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="app-page">
      <PageHeader
        title="Alerts"
        description="Track low-stock products with the same searchable, sortable workflow used across the admin panel."
        action={
          <div className="flex flex-wrap gap-3">
            <ActionDropdown
              label="Export Selected"
              disabled={exporting || !selectedIds.length}
              items={[{ label: "As CSV", onClick: () => handleExport(selectedIds) }]}
            />
            <ActionDropdown
              label="Export All"
              disabled={exporting || !total}
              items={[{ label: "As CSV", onClick: () => handleExport([]) }]}
            />
          </div>
        }
      />

      <div className="app-controls lg:grid lg:grid-cols-[minmax(0,1.4fr)_repeat(2,minmax(0,0.8fr))]">
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
          <option value="quantity-asc">Current stock low-high</option>
          <option value="quantity-desc">Current stock high-low</option>
          <option value="productName-asc">Product A-Z</option>
          <option value="productName-desc">Product Z-A</option>
          <option value="threshold-asc">Threshold low-high</option>
          <option value="threshold-desc">Threshold high-low</option>
          <option value="demandPrediction-asc">Demand low-high</option>
          <option value="demandPrediction-desc">Demand high-low</option>
        </select>
        <select
          value={stockFilter}
          onChange={(event) => {
            setStockFilter(event.target.value);
            setPage(1);
          }}
          className="app-input"
        >
          <option value="ALL">All alert levels</option>
          <option value="CRITICAL">Critical</option>
          <option value="NEAR_THRESHOLD">Near threshold</option>
        </select>
      </div>

      <div className="grid items-start gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
        <FormPanel title="Alert overview">
          <div className="grid gap-4">
            <div className="app-card rounded-xl bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Visible alerts
              </p>
              <p className="mt-2 text-3xl font-semibold">{summary.visible}</p>
            </div>
            <div className="app-card rounded-xl bg-white/70 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--muted)]">
                Critical alerts
              </p>
              <p className="mt-2 text-3xl font-semibold">{summary.critical}</p>
            </div>
            <p className="text-sm leading-6 text-[color:var(--muted)]">
              Use the same search, sort, filter, selection, and export pattern here as the other
              admin tables to keep review workflows consistent.
            </p>
            {actionError ? <p className="text-sm text-red-600">{actionError}</p> : null}
          </div>
        </FormPanel>

        <div className="space-y-4">
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <DataTable
            columns={[
              {
                key: "select",
                label: (
                  <input
                    type="checkbox"
                    checked={allVisibleSelected}
                    onChange={toggleAllVisible}
                    aria-label="Select visible alerts"
                  />
                ),
                render: (row) => {
                  const inventoryId = row?.inventoryId || row?.id;
                  return (
                    <input
                      type="checkbox"
                      checked={inventoryId ? selectedIds.includes(inventoryId) : false}
                      onChange={() => inventoryId && toggleAlert(inventoryId)}
                      aria-label={`Select alert ${inventoryId || 'unknown'}`}
                    />
                  );
                }
              },
              { key: "productName", label: "Product", render: (row) => row?.productName || "Unknown" },
              { key: "category", label: "Category", render: (row) => row?.category || "Uncategorized" },
              { key: "quantity", label: "Current stock", render: (row) => typeof row?.quantity === 'number' ? row.quantity : 0 },
              { key: "threshold", label: "Threshold", render: (row) => typeof row?.threshold === 'number' ? row.threshold : 0 },
              { key: "demandPrediction", label: "Demand prediction", render: (row) => typeof row?.demandPrediction === 'number' ? row.demandPrediction : 0 }
            ]}
            rows={rows}
            emptyMessage={loading ? "Loading alerts..." : "No alerts match your filters."}
          />
        </div>
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

          </div>
  );
}

export default AlertsPage;
