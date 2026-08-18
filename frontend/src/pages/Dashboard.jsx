import React, { useEffect, useState } from "react";
import {
  IndianRupee,
  Receipt,
  Users,
  TicketCheck,
  UserPlus,
  Repeat,
  CalendarHeart,
  UserCheck,
  ClipboardCheck,
  FileSpreadsheet,
  Download,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import api from "../api/axios";
import StatCard from "../components/common/StatCard";

const PERIODS = [
  { key: "daily", label: "Daily" },
  { key: "weekly", label: "Weekly" },
  { key: "monthly", label: "Monthly" },
  { key: "yearly", label: "Yearly" },
  { key: "custom", label: "Custom" },
];

const PIE_COLORS = ["#14b8a6", "#276e8c", "#ff7043", "#f59e0b", "#8b5cf6", "#3f8fae", "#a7d3e1"];

const money = (v) => `₹${(v || 0).toLocaleString("en-IN")}`;
const pct = (cur, prev) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);
const shortK = (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v);

const ChartCard = ({ title, subtitle, children }) => (
  <div className="card">
    <div className="mb-4">
      <h3 className="text-sm font-bold text-ocean-700">{title}</h3>
      {subtitle && <p className="text-xs text-ocean-400">{subtitle}</p>}
    </div>
    <div className="h-64">{children}</div>
  </div>
);

const tooltipStyle = {
  borderRadius: 12,
  border: "1px solid #d3e9f0",
  fontSize: 12,
};

const Dashboard = () => {
  const [period, setPeriod] = useState("daily");
  const [customRange, setCustomRange] = useState({ from: "", to: "" });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  const params = { period };
  if (period === "custom") {
    if (customRange.from) params.from = customRange.from;
    if (customRange.to) params.to = customRange.to;
  }

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const { data: res } = await api.get("/dashboard", { params });
        setData(res.data);
      } finally {
        setLoading(false);
      }
    };
    load();
    const interval = setInterval(load, 30000); // refresh every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period, customRange.from, customRange.to]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const { data: blob } = await api.get("/dashboard/export", { params, responseType: "blob" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `dashboard-${period}-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Could not export the dashboard data. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  const current = data?.current || {};
  const previous = data?.previous || {};

  if (loading && !data) return <p className="text-sm text-ocean-400">Loading dashboard...</p>;
  if (!data) return <p className="text-sm text-coral-500">Could not load dashboard data.</p>;

  const delta = (key) => pct(current[key] || 0, previous[key] || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-ocean-900">Dashboard</h2>
          <p className="text-xs text-ocean-400">Auto-refreshes every 30 seconds</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-lg border border-ocean-100 bg-white p-1">
            {PERIODS.map((p) => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  period === p.key
                    ? "bg-ocean-700 text-white shadow-sm"
                    : "text-ocean-500 hover:bg-ocean-50"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button onClick={handleExport} disabled={exporting} className="btn-accent inline-flex items-center gap-2">
            <FileSpreadsheet size={16} />
            {exporting ? "Exporting..." : "Export Excel"}
          </button>
        </div>
      </div>

      {period === "custom" && (
        <div className="flex flex-wrap items-end gap-3 rounded-lg border border-ocean-100 bg-white p-4">
          <div>
            <label className="label">From</label>
            <input
              type="date"
              className="input-field"
              value={customRange.from}
              onChange={(e) => setCustomRange((r) => ({ ...r, from: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">To</label>
            <input
              type="date"
              className="input-field"
              value={customRange.to}
              onChange={(e) => setCustomRange((r) => ({ ...r, to: e.target.value }))}
            />
          </div>
          {data?.range && (
            <p className="pb-2 text-xs text-ocean-400">
              Showing {new Date(data.range.from).toLocaleDateString("en-IN")} →{" "}
              {new Date(data.range.to).toLocaleDateString("en-IN")}
            </p>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Sales" value={money(current.sales)} icon={IndianRupee} accent="teal" delta={delta("sales")} />
        <StatCard label="Bills" value={current.bills} icon={Receipt} accent="ocean" delta={delta("bills")} />
        <StatCard label="Visitors / Walk-ins" value={current.visitors} icon={Users} accent="coral" delta={delta("visitors")} />
        <StatCard label="Entries" value={current.entries} icon={TicketCheck} accent="teal" delta={delta("entries")} />
        <StatCard label="New Customers" value={current.newCustomers} icon={UserPlus} accent="ocean" delta={delta("newCustomers")} />
        <StatCard label="Repeat Customers" value={current.repeatCustomers} icon={Repeat} accent="coral" delta={delta("repeatCustomers")} />
        <StatCard label="Coupons Redeemed" value={current.coupons} icon={TicketCheck} accent="teal" delta={delta("coupons")} />
        <StatCard label="Party Bookings" value={current.bookings} icon={CalendarHeart} accent="coral" delta={delta("bookings")} />
        <StatCard label="Active Customers" value={data.activeCustomers} icon={UserCheck} accent="ocean" />
        <StatCard
          label="Staff Present Today"
          value={`${data.staffPresentToday} / ${data.staffTotal}`}
          icon={ClipboardCheck}
          accent="teal"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Revenue Trend" subtitle="vs previous equal period">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.charts.salesTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#14b8a6" stopOpacity={0.4} />
                  <stop offset="100%" stopColor="#14b8a6" stopOpacity={0.05} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} minTickGap={16} />
              <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} tickFormatter={shortK} width={40} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [money(v), "Sales"]} />
              <Area type="monotone" dataKey="value" stroke="#14b8a6" strokeWidth={2} fill="url(#salesGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Visitors Trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.charts.visitorsTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} minTickGap={16} />
              <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef6f9" }} formatter={(v) => [v, "Visitors"]} />
              <Bar dataKey="value" fill="#3f8fae" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ChartCard title="Revenue by Package">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data.charts.packageRevenue}
              layout="vertical"
              margin={{ top: 0, right: 16, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={96} tick={{ fontSize: 11, fill: "#1c5570" }} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v) => [money(v), "Revenue"]} cursor={{ fill: "#eef6f9" }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {data.charts.packageRevenue.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Payment Modes" subtitle="revenue by payment method">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.charts.paymentModes}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.charts.paymentModes.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} formatter={(v, name) => [money(v), name]} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Bookings by Status">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.charts.bookingStatus}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.charts.bookingStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChartCard title="Last 12 Months Sales">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.charts.last12MonthsSales} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef6f9" />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={{ stroke: "#d3e9f0" }} />
              <YAxis tick={{ fontSize: 11, fill: "#3f8fae" }} tickLine={false} axisLine={false} tickFormatter={shortK} width={40} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "#eef6f9" }} formatter={(v) => [money(v), "Sales"]} />
              <Bar dataKey="value" fill="#276e8c" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Customer Mix" subtitle="customers by type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.charts.customerMix}
                dataKey="value"
                nameKey="name"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={3}
              >
                {data.charts.customerMix.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
};

export default Dashboard;
