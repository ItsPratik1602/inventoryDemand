import { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader.jsx";
import StatCard from "../components/StatCard.jsx";
import DataTable from "../components/DataTable.jsx";
import { useApi } from "../hooks/useApi.js";
import api from "../lib/api.js";
import Loader from "../components/Loader.jsx";
import LowStockAlert from "../components/LowStockAlert.jsx";
import AlertStrip from '../components/AlertStrip.jsx';

const formatShortDate = (value) =>
  new Date(value).toLocaleDateString(undefined, { month: "short", day: "numeric" });

function buildSmoothPath(points) {
  if (!points.length) {
    return "";
  }

  if (points.length === 1) {
    const point = points[0];
    return `M ${point.x} ${point.y}`;
  }

  let path = `M ${points[0].x} ${points[0].y}`;

  for (let index = 0; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const controlX = (current.x + next.x) / 2;
    path += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }

  return path;
}

function MiniLineChart({ data, color = "#0f766e" }) {
  const [activeIndex, setActiveIndex] = useState(null);

  const chart = useMemo(() => {
    if (!data.length) {
      return null;
    }

    const width = 520;
    const height = 260;
    const padding = { top: 24, right: 24, bottom: 42, left: 48 };
    const quantities = data.map((point) => point.quantity);
    const minQuantity = Math.min(...quantities);
    const maxQuantity = Math.max(...quantities);
    const range = Math.max(maxQuantity - minQuantity, 1);
    const paddedMin = Math.max(0, minQuantity - range * 0.25);
    const paddedMax = maxQuantity + range * 0.35;
    const innerWidth = width - padding.left - padding.right;
    const innerHeight = height - padding.top - padding.bottom;

    const points = data.map((point, index) => {
      const x =
        padding.left + (index / Math.max(data.length - 1, 1)) * innerWidth;
      const normalized = (point.quantity - paddedMin) / Math.max(paddedMax - paddedMin, 1);
      const y = padding.top + (1 - normalized) * innerHeight;
      return {
        ...point,
        x,
        y
      };
    });

    const yTicks = Array.from({ length: 4 }, (_, index) => {
      const value = paddedMin + ((paddedMax - paddedMin) / 3) * index;
      const y = padding.top + innerHeight - (innerHeight / 3) * index;
      return {
        value: Math.round(value),
        y
      };
    });

    return {
      width,
      height,
      padding,
      points,
      yTicks,
      path: buildSmoothPath(points)
    };
  }, [data]);

  if (!chart) {
    return <p className="text-sm text-[color:var(--muted)]">No trend data available.</p>;
  }

  const activePoint =
    activeIndex === null ? chart.points[chart.points.length - 1] : chart.points[activeIndex];

  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[1.75rem] border border-[color:var(--line)] bg-white/75 p-3">
        <svg
          viewBox={`0 0 ${chart.width} ${chart.height}`}
          className="h-64 w-full"
          onMouseLeave={() => setActiveIndex(null)}
        >
          {chart.yTicks.map((tick) => (
            <g key={tick.y}>
              <line
                x1={chart.padding.left}
                x2={chart.width - chart.padding.right}
                y1={tick.y}
                y2={tick.y}
                stroke="rgba(27, 42, 34, 0.08)"
                strokeDasharray="4 6"
              />
              <text
                x={chart.padding.left - 12}
                y={tick.y + 4}
                fontSize="11"
                textAnchor="end"
                fill="var(--muted)"
              >
                {tick.value}
              </text>
            </g>
          ))}

          <path
            d={chart.path}
            fill="none"
            stroke={color}
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {chart.points.map((point, index) => (
            <g key={point.date}>
              <circle
                cx={point.x}
                cy={point.y}
                r={activePoint?.date === point.date ? 6 : 4}
                fill="white"
                stroke={color}
                strokeWidth="3"
              />
              <rect
                x={point.x - 18}
                y={chart.padding.top}
                width="36"
                height={chart.height - chart.padding.top - chart.padding.bottom}
                fill="transparent"
                onMouseEnter={() => setActiveIndex(index)}
              />
              <text
                x={point.x}
                y={chart.height - 14}
                fontSize="11"
                textAnchor="middle"
                fill="var(--muted)"
              >
                {formatShortDate(point.date)}
              </text>
            </g>
          ))}
        </svg>

        {activePoint ? (
          <div
            className="pointer-events-none absolute z-10 min-w-40 rounded-2xl border border-[color:var(--line)] bg-white/95 px-4 py-3 shadow-lg"
            style={{
              left: `min(calc(${((activePoint.x / chart.width) * 100).toFixed(2)}% + 12px), calc(100% - 11rem))`,
              top: `max(calc(${((activePoint.y / chart.height) * 100).toFixed(2)}% - 68px), 1rem)`
            }}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[color:var(--muted)]">
              {formatShortDate(activePoint.date)}
            </p>
            <p className="mt-1 text-sm font-semibold text-[color:var(--text)]">
              {activePoint.quantity} units sold
            </p>
            {activePoint.totalSalesValue !== undefined ? (
              <p className="mt-1 text-xs text-[color:var(--muted)]">
                Sales value: ${Number(activePoint.totalSalesValue).toFixed(2)}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function MiniBarChart({ data, barKey, labelKey, tone = "accent" }) {
  if (!data.length) {
    return <p className="text-sm text-[color:var(--muted)]">No chart data available.</p>;
  }

  const max = Math.max(...data.map((item) => item[barKey]), 1);
  const barClass =
    tone === "amber" ? "bg-amber-400/90" : "bg-[color:var(--accent)]";

  return (
    <div className="space-y-4">
      {data.map((item) => (
        <div key={item.id || item[labelKey]} className="space-y-2">
          <div className="flex items-center justify-between gap-4 text-sm">
            <span className="font-medium">{item[labelKey]}</span>
            <span className="text-[color:var(--muted)]">{item[barKey]}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/65">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${barClass}`}
              style={{ width: `${Math.max((item[barKey] / max) * 100, 8)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function CriticalDemandAlerts({ alerts, loading }) {
  if (loading) {
    return <Loader text="Loading demand alerts..." />;
  }

  if (!alerts.length) {
    return (
      <div className="text-center py-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 mb-3">
          <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <p className="text-sm font-medium text-[color:var(--text)]">No critical demand alerts</p>
        <p className="text-xs text-[color:var(--muted)] mt-1">Current stock meets predicted demand</p>
      </div>
    );
  }

  const criticalCount = alerts.filter(alert => alert.riskLevel === 'CRITICAL').length;
  const highCount = alerts.filter(alert => alert.riskLevel === 'HIGH').length;

  return (
    <div className="space-y-4">
      <div className="flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span className="text-[color:var(--muted)]">Critical: {criticalCount}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-amber-500"></div>
          <span className="text-[color:var(--muted)]">High: {highCount}</span>
        </div>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => {
          const deficit = alert.demandPrediction - alert.currentStock;
          const isCritical = alert.riskLevel === 'CRITICAL';
          
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg border ${
                isCritical 
                  ? 'bg-red-50 border-red-200' 
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-[color:var(--text)]">{alert.name}</h4>
                  <div className="mt-2 flex items-center gap-4 text-xs">
                    <span className="text-[color:var(--muted)]">
                      Stock: <span className="font-medium">{alert.currentStock}</span>
                    </span>
                    <span className="text-[color:var(--muted)]">
                      Demand: <span className="font-medium">{alert.demandPrediction.toFixed(1)}</span>
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                    isCritical 
                      ? 'bg-red-100 text-red-700' 
                      : 'bg-amber-100 text-amber-700'
                  }`}>
                    {isCritical ? 'CRITICAL' : 'HIGH'}
                  </span>
                  <p className="text-xs text-[color:var(--muted)] mt-1">
                    {deficit.toFixed(1)} short
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DashboardSection({ title, description, children }) {
  return (
    <section className="app-card h-full p-5">
      <h3 className="app-section-title">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-[color:var(--muted)]">{description}</p>
      <div className="mt-5">{children}</div>
    </section>
  );
}

function DashboardPage() {
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState("all"); // all, today, last7, custom
  
  const fetchSummary = async () => {
    const params = { dateRange }; // Always send dateRange parameter
    
    // Debug logging
    console.log("=== Dashboard API Call ===");
    console.log("Date Range:", dateRange);
    console.log("API Params:", params);
    
    const response = await api.get("/dashboard/summary", { params });
    console.log("API Response:", response.data);
    
    return response.data.data;
  };

  const { data, loading, error } = useApi(fetchSummary, [dateRange]);
  const counts = data?.counts || {};
  const outOfStockItems = data?.outOfStockItems || [];
  const criticalItems = data?.criticalItems || [];
  const criticalDemandAlerts = data?.criticalDemandAlerts || [];
  const salesTrend = data?.salesTrend || [];
  const topSellingProducts = data?.topSellingProducts || [];
  const lowStockItems = data?.lowStockItems || [];

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        <PageHeader
          title="Dashboard"
          description="Track sales momentum, demand, and stock pressure from one analytics surface."
          action={
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-500">Date Range:</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="last7">Last 7 Days</option>
                <option value="last30">Last 30 Days</option>
              </select>
            </div>
          }
        />

        {error ? <p className="mb-4 text-sm text-red-600">{error}</p> : null}

        <AlertStrip />

        {/* Top Summary Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 border">
          <div className="flex items-center justify-between">
            <div className="flex gap-10">
              <div className="text-center">
                <p className="text-2xl font-bold text-red-500">{counts.outOfStockCount || 0}</p>
                <p className="text-sm text-gray-500">Out of Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-500">{counts.lowStockCount || 0}</p>
                <p className="text-sm text-gray-500">Low Stock</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-orange-500">{counts.criticalCount || 0}</p>
                <p className="text-sm text-gray-500">Critical Risk</p>
              </div>
            </div>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              View Inventory
            </button>
          </div>
        </div>

        {/* Main Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 border hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-blue-100">
                <span className="text-blue-600">💰</span>
              </div>
              <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded-full">Revenue</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              {loading ? "..." : `$${(counts.totalSales || 0).toFixed(2)}`}
            </h3>
            <p className="text-sm text-gray-500">Total Sales</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 border hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-green-100">
                <span className="text-green-600">🛒</span>
              </div>
              <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Orders</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              {loading ? "..." : counts.totalOrders || 0}
            </h3>
            <p className="text-sm text-gray-500">Total Orders</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 border hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-purple-100">
                <span className="text-purple-600">👥</span>
              </div>
              <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">Users</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              {loading ? "..." : counts.users || 0}
            </h3>
            <p className="text-sm text-gray-500">Total Users</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 flex flex-col gap-2 border hover:shadow-md transition-all duration-200">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 flex items-center justify-center rounded-lg bg-indigo-100">
                <span className="text-indigo-600">📦</span>
              </div>
              <span className="text-xs font-medium text-indigo-600 bg-indigo-100 px-2 py-1 rounded-full">Products</span>
            </div>
            <h3 className="text-2xl font-semibold text-gray-800">
              {loading ? "..." : counts.products || 0}
            </h3>
            <p className="text-sm text-gray-500">Total Products</p>
          </div>
        </div>

        {/* Chart + Top Products Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Sales over time</h3>
                <p className="text-sm text-gray-500 mt-1">Last seven days of recorded unit sales</p>
              </div>
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600">📊</span>
              </div>
            </div>
            <MiniLineChart data={salesTrend} />
          </div>

          <div className="bg-white rounded-xl shadow-sm p-5 border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Top selling products</h3>
                <p className="text-sm text-gray-500 mt-1">Products generating the highest sold quantity</p>
              </div>
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600">📈</span>
              </div>
            </div>
            <MiniBarChart data={topSellingProducts} barKey="totalSold" labelKey="name" />
          </div>
        </div>

        {/* Compact Alert Widget */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Out of Stock */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-red-600 font-semibold flex items-center gap-2">
              🚫 Out of Stock ({outOfStockItems?.length || 0})
            </h3>

            {outOfStockItems && outOfStockItems.length > 0 ? (
              <>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {outOfStockItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="truncate">{item.name}</li>
                  ))}
                </ul>

                {outOfStockItems.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{outOfStockItems.length - 3} more
                  </p>
                )}

                <div className="mt-3">
                  <Link 
                    to="/admin/inventory"
                    className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
                  >
                    Manage Inventory
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No items out of stock</p>
            )}
          </div>

          {/* Critical Items */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-orange-500 font-semibold flex items-center gap-2">
              ⚠️ Critical ({criticalItems?.length || 0})
            </h3>

            {criticalItems && criticalItems.length > 0 ? (
              <>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {criticalItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="truncate">{item.name}</li>
                  ))}
                </ul>

                {criticalItems.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{criticalItems.length - 3} more
                  </p>
                )}

                <div className="mt-3">
                  <Link 
                    to="/admin/inventory"
                    className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
                  >
                    Restock Now
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No critical items</p>
            )}
          </div>

          {/* Low Stock Items */}
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <h3 className="text-yellow-500 font-semibold flex items-center gap-2">
              📦 Low Stock ({lowStockItems?.length || 0})
            </h3>

            {lowStockItems && lowStockItems.length > 0 ? (
              <>
                <ul className="mt-2 space-y-1 text-sm text-gray-700">
                  {lowStockItems.slice(0, 3).map((item) => (
                    <li key={item.id} className="truncate">{item.name}</li>
                  ))}
                </ul>

                {lowStockItems.length > 3 && (
                  <p className="text-xs text-gray-500 mt-2">
                    +{lowStockItems.length - 3} more
                  </p>
                )}

                <div className="mt-3">
                  <Link 
                    to="/admin/inventory"
                    className="text-sm text-blue-600 hover:text-blue-700 transition font-medium"
                  >
                    View All
                  </Link>
                </div>
              </>
            ) : (
              <p className="mt-2 text-sm text-gray-500">No low stock items</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
